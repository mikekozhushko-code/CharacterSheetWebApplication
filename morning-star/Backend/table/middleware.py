from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import AnonymousUser
from accounts.models import CustomUser

@database_sync_to_async
def get_user_from_token(token_key):
    try:
        token = AccessToken(token_key)
        return CustomUser.objects.get(id=token['user_id'])
    except Exception:
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = parse_qs(scope['query_string'].decode())
        token_key    = query_string.get('token', [None])[0]
        scope['user'] = await get_user_from_token(token_key) if token_key else AnonymousUser()
        return await super().__call__(scope, receive, send)