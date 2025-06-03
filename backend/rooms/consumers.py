import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async


class RoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_code = self.scope["url_route"]["kwargs"]["room_code"]
        self.room_group_name = f"room_{self.room_code}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get("action")

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "game_update",
                "action": action,
                "payload": data.get("payload", {})
            }
        )

    async def game_update(self, event):
        await self.send(text_data=json.dumps({
            "action": event["action"],
            "payload": event["payload"]
        }))
    
    async def crossroad_update(self, event):
        await self.send(text_data=json.dumps({
            'action': 'crossroad_update',
            'payload': event['payload']
        }))

    async def crusade_points_update(self, event):
        await self.send(text_data=json.dumps({
            'action': 'crusade_points_update',
            'payload': event['payload']
        }))

    async def count_relics_update(self, event):
        await self.send(text_data=json.dumps({
            'action': 'count_relics_update',
            'payload': event['payload']
        }))

    async def changed_played_cards(self, event):
        await self.send(text_data=json.dumps({
            'action': 'changed_played_cards',
            'payload': event['payload']
        }))
    
    async def changed_player_crusade_points(self, event):
        await self.send(text_data=json.dumps({
            'action': 'changed_player_crusade_points',
            'payload': event['payload'],
            'player_id': event['player_id']
        }))
    
    async def changed_player_count_relics(self, event):
        await self.send(text_data=json.dumps({
            'action': 'changed_player_count_relics',
            'payload': event['payload'],
            'player_id': event['player_id']
        }))

    async def changed_status_room(self, event):
        await self.send(text_data=json.dumps({
            'action': 'changed_status_room',
            'payload': event['payload'],
        }))
