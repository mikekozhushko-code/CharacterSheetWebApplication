import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import GameSession, Scene

class TableConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.session_code = self.scope['url_route']['kwargs']['code']
        self.room_group   = f'table_{self.session_code}'
        self.user         = self.scope.get('user')

        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

        state = await self.get_session_state()
        await self.send(text_data=json.dumps({'type': 'state', 'payload': state}))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive(self, text_data):
        data     = json.loads(text_data)
        msg_type = data.get('type')
        payload  = data.get('payload', {})

        handlers = {
            'move_token':    self.handle_move_token,
            'add_image':     self.handle_add_image,
            'delete_image':  self.handle_delete_image,
            'roll_dice':     self.handle_roll_dice,
            # ── Сцени ──
            'add_scene':     self.handle_add_scene,
            'switch_scene':  self.handle_switch_scene,
            'reveal_scene':  self.handle_reveal_scene,
            'delete_scene':  self.handle_delete_scene,
            'rename_scene':  self.handle_rename_scene,
        }
        handler = handlers.get(msg_type)
        if handler:
            await handler(payload)

    # ── Існуючі handlers ──────────────────────────────────────────────────────

    async def handle_move_token(self, payload):
        await self.channel_layer.group_send(self.room_group, {
            'type':    'broadcast',
            'message': {'type': 'move_token', 'payload': payload}
        })

    async def handle_add_image(self, payload):
        await self.save_tokens(payload.get('scene_id'), payload.get('tokens', []))
        await self.channel_layer.group_send(self.room_group, {
            'type':    'broadcast',
            'message': {'type': 'add_image', 'payload': payload}
        })

    async def handle_delete_image(self, payload):
        await self.save_tokens(payload.get('scene_id'), payload.get('tokens', []))
        await self.channel_layer.group_send(self.room_group, {
            'type':    'broadcast',
            'message': {'type': 'delete_image', 'payload': payload}
        })

    async def handle_roll_dice(self, payload):
        payload['user'] = self.user.username
        await self.channel_layer.group_send(self.room_group, {
            'type':    'broadcast',
            'message': {'type': 'roll_dice', 'payload': payload}
        })

    # ── Нові handlers для сцен ────────────────────────────────────────────────

    async def handle_add_scene(self, payload):
        if not await self.is_master():
            return
        scene = await self.create_scene(payload.get('name', 'Нова сцена'))
        await self.channel_layer.group_send(self.room_group, {
            'type':    'broadcast',
            'message': {'type': 'add_scene', 'payload': {
                'id': scene.id, 'name': scene.name,
                'tokens': scene.tokens, 'order': scene.order,
                'is_visible': scene.is_visible,
            }}
        })

    async def handle_switch_scene(self, payload):
        """DM перемикає активну сцену — гравці бачать splash."""
        if not await self.is_master():
            return
        scene_id = payload.get('scene_id')
        await self.set_active_scene(scene_id)
        await self.channel_layer.group_send(self.room_group, {
            'type':    'broadcast',
            'message': {'type': 'switch_scene', 'payload': {
                'scene_id':   scene_id,
                'is_visible': False,  # гравці бачать splash
            }}
        })

    async def handle_reveal_scene(self, payload):
        """DM показує поточну сцену гравцям."""
        if not await self.is_master():
            return
        scene_id = payload.get('scene_id')
        tokens   = await self.reveal_scene(scene_id)
        await self.channel_layer.group_send(self.room_group, {
            'type':    'broadcast',
            'message': {'type': 'reveal_scene', 'payload': {
                'scene_id': scene_id,
                'tokens':   tokens,
            }}
        })

    async def handle_delete_scene(self, payload):
        if not await self.is_master():
            return
        scene_id = payload.get('scene_id')
        await self.delete_scene(scene_id)
        await self.channel_layer.group_send(self.room_group, {
            'type':    'broadcast',
            'message': {'type': 'delete_scene', 'payload': {'scene_id': scene_id}}
        })

    async def handle_rename_scene(self, payload):
        if not await self.is_master():
            return
        scene_id = payload.get('scene_id')
        name     = payload.get('name', 'Нова сцена')
        await self.rename_scene(scene_id, name)
        await self.channel_layer.group_send(self.room_group, {
            'type':    'broadcast',
            'message': {'type': 'rename_scene', 'payload': {
                'scene_id': scene_id, 'name': name
            }}
        })

    # ── Broadcast ─────────────────────────────────────────────────────────────

    async def broadcast(self, event):
        await self.send(text_data=json.dumps(event['message']))

    # ── DB helpers ────────────────────────────────────────────────────────────

    @database_sync_to_async
    def get_session_state(self):
        try:
            session = GameSession.objects.prefetch_related('scenes').get(
                code=self.session_code
            )
            active = session.active_scene
            return {
                'scenes':          [
                    {'id': s.id, 'name': s.name, 'tokens': s.tokens,
                     'order': s.order, 'is_visible': s.is_visible}
                    for s in session.scenes.all()
                ],
                'active_scene_id': active.id if active else None,
                'is_visible':      active.is_visible if active else False,
                # токени активної сцени для зворотної сумісності
                'tokens':          active.tokens if active else [],
            }
        except GameSession.DoesNotExist:
            return {'scenes': [], 'active_scene_id': None, 'tokens': []}

    @database_sync_to_async
    def is_master(self):
        try:
            session = GameSession.objects.get(code=self.session_code)
            return session.master == self.user
        except GameSession.DoesNotExist:
            return False

    @database_sync_to_async
    def save_tokens(self, scene_id, tokens):
        if scene_id:
            Scene.objects.filter(id=scene_id).update(tokens=tokens)
        else:
            # fallback — зберігаємо в активну сцену
            session = GameSession.objects.get(code=self.session_code)
            if session.active_scene:
                session.active_scene.tokens = tokens
                session.active_scene.save()

    @database_sync_to_async
    def create_scene(self, name):
        session = GameSession.objects.get(code=self.session_code)
        order   = session.scenes.count()
        return Scene.objects.create(session=session, name=name, order=order)

    @database_sync_to_async
    def set_active_scene(self, scene_id):
        GameSession.objects.filter(code=self.session_code).update(active_scene_id=scene_id)
        Scene.objects.filter(id=scene_id).update(is_visible=False)

    @database_sync_to_async
    def reveal_scene(self, scene_id):
        Scene.objects.filter(id=scene_id).update(is_visible=True)
        scene = Scene.objects.get(id=scene_id)
        return scene.tokens

    @database_sync_to_async
    def delete_scene(self, scene_id):
        Scene.objects.filter(id=scene_id).delete()

    @database_sync_to_async
    def rename_scene(self, scene_id, name):
        Scene.objects.filter(id=scene_id).update(name=name)