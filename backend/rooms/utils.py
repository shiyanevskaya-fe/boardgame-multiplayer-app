from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def broadcast_crossroad_update(room_code, cards):
    channel_layer = get_channel_layer()

    cards_data = []
    for entry in cards:
        if entry is None:
            continue
        card = entry.get_card()
        card_data = {
            'id': entry.card_id,
            'type': entry.card_type,
            'name': card.name,
            'image': card.image_url(),
        }

        if entry.card_type == 'regular':
            card_data.update({
                'group': card.group,
                'victory_points': card.victory_points,
                'immunity': card.immunity,
                'crusade_points': card.crusade_points,
                'description': card.description,
            })
        else:
            card_data.update({
                'death_count': card.death_count,
                'effect': card.effect,
                'hotbed_image': card.hotbed_image,
            })

        cards_data.append(card_data)

    async_to_sync(channel_layer.group_send)(
        f'room_{room_code}',
        {
            'type': 'crossroad_update',
            'payload': {
                'updated': True,
                'cards': cards_data,
            },
        }
    )