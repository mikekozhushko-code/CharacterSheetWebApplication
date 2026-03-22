from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/table/(?P<code>[A-Z0-9]{8})/$', consumers.TableConsumer.as_asgi()),
]