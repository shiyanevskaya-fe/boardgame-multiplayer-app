from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path("ws/rooms/<str:room_code>/", consumers.RoomConsumer.as_asgi()),
]
