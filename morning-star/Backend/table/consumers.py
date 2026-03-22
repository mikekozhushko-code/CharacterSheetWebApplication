import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import GameSession

class TableConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.session_code = self.scope['url_route']['kwargs']['code']
        self.room_group   = f'table_{self.session_code}'
        self.user         = self.scope.get('user')

        print(f"WebSocket connect: user={self.user}, authenticated={getattr(self.user, 'is_authenticated', False)}")

        # Reject anonymous users
        if not self.user or not self.user.is_authenticated:
            print("Rejecting anonymous user")
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

        state = await self.get_session_state()
        await self.send(text_data=json.dumps({ 'type': 'state', 'payload': state }))
        print("WebSocket accepted and state sent")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive(self, text_data):
        data     = json.loads(text_data)
        msg_type = data.get('type')
        payload  = data.get('payload', {})

        handlers = {
            'move_token':   self.handle_move_token,
            'add_image':    self.handle_add_image,
            'delete_image': self.handle_delete_image,
            'roll_dice':    self.handle_roll_dice,
        }

        handler = handlers.get(msg_type)
        if handler:
            await handler(payload)

    async def handle_move_token(self, payload):
        await self.channel_layer.group_send(self.room_group, {
            'type':    'broadcast',
            'message': { 'type': 'move_token', 'payload': payload }
        })

    async def handle_add_image(self, payload):
        await self.save_tokens(payload.get('tokens', []))
        await self.channel_layer.group_send(self.room_group, {
            'type':    'broadcast',
            'message': { 'type': 'add_image', 'payload': payload }
        })

    async def handle_delete_image(self, payload):
        await self.save_tokens(payload.get('tokens', []))
        await self.channel_layer.group_send(self.room_group, {
            'type':    'broadcast',
            'message': { 'type': 'delete_image', 'payload': payload }
        })

    async def handle_roll_dice(self, payload):
        payload['user'] = self.user.username
        await self.channel_layer.group_send(self.room_group, {
            'type':    'broadcast',
            'message': { 'type': 'roll_dice', 'payload': payload }
        })

    async def broadcast(self, event):
        await self.send(text_data=json.dumps(event['message']))

    @database_sync_to_async
    def get_session_state(self):
        try:
            session = GameSession.objects.get(code=self.session_code)
            return { 'tokens': session.tokens }
        except GameSession.DoesNotExist:
            return { 'tokens': [] }

    @database_sync_to_async
    def save_tokens(self, tokens):
        GameSession.objects.filter(code=self.session_code).update(tokens=tokens)