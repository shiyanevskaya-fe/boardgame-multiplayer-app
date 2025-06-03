from rest_framework import serializers
from .models import Room, Player
from cards.models import Card, DeckCardEntry, CardEpidemic, ActiveEpidemic

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['code', 'status', 'players_count']

class DeckCardEntrySerializer(serializers.ModelSerializer):
    card_data = serializers.SerializerMethodField()

    class Meta:
        model = DeckCardEntry
        fields = ['id', 'card_type', 'card_id', 'card_group_in_deck', 'order', 'is_played', 'card_data']

    def get_card_data(self, obj):
        if obj.card_type == 'regular':
            try:
                card = Card.objects.get(id=obj.card_id)
                return {
                    'id_card_in_deck': obj.id,
                    'card_group_in_deck': obj.card_group_in_deck,
                    'id': card.id,
                    'type': 'regular',
                    'name': card.name,
                    'image': card.image_url(),
                    'group': card.group,
                    'victory_points': card.victory_points,
                    'immunity': card.immunity,
                    'crusade_points': card.crusade_points,
                    'description': card.description,
                    'play_only_in_own_city': card.play_only_in_own_city,
                    'is_women': card.is_women
                }
            except Card.DoesNotExist:
                return None
        elif obj.card_type == 'epidemic':
            try:
                card = CardEpidemic.objects.get(id=obj.card_id)
                return {
                    'id_card_in_deck': obj.id,
                    'card_group_in_deck': obj.card_group_in_deck,
                    'id': card.id,
                    'type': 'epidemic',
                    'name': card.name,
                    'image': card.image_url(),
                    'death_count': card.death_count,
                    'effect': card.effect,
                    'hotbed_image': card.hotbed_image,
                }
            except CardEpidemic.DoesNotExist:
                return None
        return None
    
class PlayerSerializer(serializers.ModelSerializer):
    played_cards = DeckCardEntrySerializer(many=True)
    epidemics = serializers.SerializerMethodField()

    class Meta:
        model = Player
        fields = ['id', 'name', 'room', 'session_key', 'status', 'crusade_points', 'victory_points', 'city_name', 'played_cards', 'epidemics']

    def get_epidemics(self, obj):
        active_epidemics = ActiveEpidemic.objects.filter(room=obj.room, hotbed_city=obj)
        if active_epidemics:
            return [
                {
                    'hotbed_image': epidemic.epidemic_card.hotbed_image_url(),
                    'hotbed_city': epidemic.hotbed_city.id,
                    'current_city': epidemic.current_city.city_name,
                    'death_count': epidemic.death_count
                }
                for epidemic in active_epidemics
            ]
        return None

