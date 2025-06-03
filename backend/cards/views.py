from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Deck, DeckCardEntry, Card, CardEpidemic, Crossroad
from rooms.models import Room
from rooms.serializers import DeckCardEntrySerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class CrossroadCardsView(APIView):
    def get(self, request, room_code):
        try:
            room = Room.objects.get(code=room_code)
            crossroad = Crossroad.objects.get(room=room)
        except Room.DoesNotExist:
            return Response({'error': 'Комната не найдена'}, status=111)
        except Crossroad.DoesNotExist:
            return Response({'error': 'Перекрёсток не найден'}, status=222)

        cards_data = DeckCardEntrySerializer(crossroad.get_cards(), many=True)

        return Response(cards_data.data, status=status.HTTP_200_OK)

    
class TopCardView(APIView):
    def get(self, request, room_code):
        try:
            room = Room.objects.get(code=room_code)
            deck = Deck.objects.get(room=room)
        except Room.DoesNotExist:
            return Response({'error': 'Комната не найдена'}, status=111)
        except Deck.DoesNotExist:
            return Response({'error': 'Колода не найдена'}, status=222)

        top_card_entry = deck.entries.filter(is_played=False).order_by('order').first()

        if not top_card_entry:
            return Response({'message': 'В колоде нет доступных карт', 'status': 'end_game'}, status=200)

        top_card_entry.is_played = True
        top_card_entry.save()

        card_data = DeckCardEntrySerializer(top_card_entry)

        return Response(card_data.data, status=status.HTTP_200_OK)
    
class UpdateCrossroad(APIView):
    def post(self, request, room_code):
        try:
            room = Room.objects.get(code=room_code)
            deck = Deck.objects.get(room=room)
            crossroad = Crossroad.objects.get(room=room)
        except Room.DoesNotExist:
            return Response({'error': 'Комната не найдена'}, status=111)
        except Deck.DoesNotExist:
            return Response({'error': 'Колода не найдена'}, status=222)
        except Crossroad.DoesNotExist:
            return Response({'error': 'Перекресток не найден'}, status=333)

        selected_card_id = request.data.get('id_card_in_deck')
        
        selected_entry = None
        slot_to_replace = None

        for card_field in ['card1', 'card2', 'card3']:
            entry = getattr(crossroad, card_field)
            if entry:
                if (entry.id) == (selected_card_id):
                    selected_entry = entry
                    slot_to_replace = card_field
                    break
        
        if not selected_entry:
            return Response({'error': 'Карта не найдена в перекрестке'}, status=555)
        
        selected_entry.is_played = True
        selected_entry.save()

        new_entry = deck.entries.filter(is_played=False).exclude(
            id__in=[
                crossroad.card1.id if crossroad.card1 else None,
                crossroad.card2.id if crossroad.card2 else None,
                crossroad.card3.id if crossroad.card3 else None,
            ]
        ).order_by('order').first()

        if not new_entry:
            return Response({'message': 'В колоде нет доступных карт'}, status=200)

        new_entry.is_played = True
        new_entry.save()

        setattr(crossroad, slot_to_replace, new_entry)
        crossroad.save()

        cards = DeckCardEntrySerializer(crossroad.get_cards(), many=True).data

        broadcast_crossroad_update(room, cards)

        return Response({'success': True})
    
class EditGroupUniversalCard(APIView):
    def post(self, request, room_code):
        id_card_in_deck = request.data.get('id_card_in_deck')
        new_group = request.data.get('new_group')

        try:
            room = Room.objects.get(code=room_code)
            deck = Deck.objects.get(room = room)
        except Room.DoesNotExist:
            return Response({'error': 'Комната не найдена'}, status=111)
        except Deck.DoesNotExist:
            return Response({'error': 'Колода не найден'}, status=222)
        
        try:
            card = deck.entries.get(id=id_card_in_deck)
        except DeckCardEntry.DoesNotExist:
            return Response({'error': 'Карта не найдена в колоде'}, status=333)
        
        card.card_group_in_deck = new_group
        card.save()

        return Response({'message' : 'Группа успешно изменена'}, status=status.HTTP_200_OK)

        
def broadcast_crossroad_update(room, cards):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"room_{room.code}",
        {
            "type": "crossroad_update",
            "action": "crossroad_update",
            "payload": cards
        }
    )
    