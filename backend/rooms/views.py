from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Room, Player
from .serializers import RoomSerializer, PlayerSerializer, DeckCardEntrySerializer
from django.shortcuts import get_object_or_404
import random
from cards.models import Card, CardEpidemic, Deck, DeckCardEntry, Crossroad, ActiveEpidemic
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def handle_leprosy(cards):
    cards = [
        card for card in cards
        if card.get_card().immunity is not None or card.get_card().description == 'baby'
    ]

    cards.sort(key=lambda card: (
        0 if card.get_card().description == 'baby' else 1,
        0 if card.get_card().group == 'priest' else 1,
        card.get_card().immunity or 0
    ))

    return cards


def handle_black_pox(cards):
    cards = [
        card for card in cards
        if card.get_card().immunity is not None or card.get_card().description == 'baby'
    ]

    cards.sort(key=lambda card: (
        0 if card.get_card().description == 'baby' else 1,
        -(card.get_card().immunity or 0)
    ))

    return cards


def handle_bubonic_plague(cards):
    cards = [
        card for card in cards
        if card.get_card().immunity is not None or card.get_card().description == 'baby'
    ]

    cards.sort(key=lambda card: (
        0 if card.get_card().description == 'baby' else 1,
    ))

    return cards


def handle_malaria(cards):
    cards = [
        card for card in cards
        if card.get_card().immunity is not None or card.get_card().description == 'baby'
    ]

    cards.sort(key=lambda card: (
        0 if card.get_card().description == 'baby' else 1,
        0 if card.get_card().group == 'court' else 1,
        card.get_card().immunity or 0
    ))

    return cards


def handle_cholera(cards):
    cards = [
        card for card in cards
        if card.get_card().immunity is not None or card.get_card().description == 'baby'
    ]

    cards.sort(key=lambda card: (
        0 if card.get_card().description == 'baby' else 1,
        0 if card.get_card().group == 'peasant' else 1,
        card.get_card().immunity or 0
    ))

    return cards




EFFECTS_EPIDEMICS = {
    'leprosy': handle_leprosy,
    'black_pox': handle_black_pox,
    'bubonic_plague': handle_bubonic_plague,
    'malaria': handle_malaria,
    'cholera': handle_cholera,
}

# Чумной доктор - Уничтожает эпидемию в этом городе
def plague_doctor(room, player):
    active_epidemics = ActiveEpidemic.objects.filter(room=room, current_city=player)

    if not active_epidemics.exists():
        return {'message': 'В городе нет эпидемий'}
    
    epidemics_data = [
        {
            'id': epidemic.id,
            'name': epidemic.epidemic_card.name,
        }
        for epidemic in active_epidemics
    ]

    return {'message': 'Выберите эпидемию для лечения', 
            'epidemics': epidemics_data,
            'handle': 'handleCureEpidemic'}

# Трактирщик - Положи в этот город верхнюю карту из колоды. Мгновенное свойство новой карты не срабатывает
def innkeeper(room, player):
    try:
        deck = Deck.objects.get(room=room)
    except Deck.DoesNotExist:
        return Response({'error': 'Колода не найдена'}, status=222)
    
    top_card_entry = deck.entries.filter(is_played=False, card_type='regular').order_by('order').first()

    if not top_card_entry:
        return Response({'message': 'В колоде нет доступных карт', 'status': 'end_game'}, status=200)
    
    top_card_entry.is_played = True
    top_card_entry.save()

    player.played_cards.add(top_card_entry)
    player.save()

    change_played_cards(room, player)

    return {'message': 'Добавлена в город верхняя карта из колоды'}

# Ведьма - Правитель этого города берет две карты из колоды
def witch(room, player):
    try:
        deck = Deck.objects.get(room=room)
    except Deck.DoesNotExist:
        return Response({'error': 'Колода не найдена'}, status=222)
    
    for i in range(2):
        top_card_entry = deck.entries.filter(is_played=False, card_type='regular').order_by('order').first()

        if not top_card_entry:
            return Response({'message': 'В колоде нет доступных карт', 'status': 'end_game'}, status=200)
        
        top_card_entry.is_played = True
        top_card_entry.save()

        player.hand.add(top_card_entry)

    player.save()

    change_played_cards(room, player)

    return {'message': 'В руку добавлены 2 карты из колоды'}

# Палач - Убивает придворного в этом городе и переманивает по одному Простолюдину из соседних городов
def executioner(room, player):
    court_cards = player.played_cards.filter(card_type='regular', card_group_in_deck='court')

    if not court_cards.exists():
        return {'message': 'В городе нет придворных'}
    
    court_cards_data = [
        {
            'id': court_card.id,
            'name': court_card.get_card().name,
        }
        for court_card in court_cards
    ]
    
    return {'message': 'Выберите придворного, которого хотите убить:', 
            'court_cards': court_cards_data, 
            'player_id_where_kill': player.id,
            'handle': 'handleKillCourt'}

# Распутная девка - Переманивает монаха из другого города
def wanton_girl(room, player):
    other_players = Player.objects.filter(room=room).order_by('id').exclude(id=player.id)

    monks = []

    for other_player in other_players:
        for deck_entry in other_player.played_cards.all():
            try:
                card = deck_entry.get_card()
                if card.name == "Монах":
                    monks.append({
                        "other_player_id": other_player.id,
                        "other_player_city_name": other_player.city_name,
                        "id_card_in_deck": deck_entry.id
                    })
                    break
            except Exception as e:
                continue

    if not monks:
        return {'message': 'В городах нет карты Монах'}
       
    return {'message': 'Выберите город, из которого хотите переманить Монаха:', 
            'monks': monks,
            'player_id_to_move': player.id,
            'handle':'handleMoveCard'}

# Фанатик - Переманивает в этот город одного простолюдина-крестоносца из соседнего города
def fanatic(room, player):
    players = list(Player.objects.filter(room=room).order_by('id'))
    player_ids = [player.id for player in players]
    current_index = player_ids.index(player.id)
    next_player = players[(current_index + 1) % len(players)]
    prev_player = players[(current_index - 1) % len(players)]

    commoner_crusader_cards = []

    for neighbor in [next_player, prev_player]:
        for deck_entry in neighbor.played_cards.all():
            card = deck_entry.get_card()
            if deck_entry.card_type == 'regular' and card.group == 'peasant' and card.crusade_points != 0:
                commoner_crusader_cards.append({
                    "player_id": neighbor.id,
                    "card_id": deck_entry.id,
                    "card_name": card.name,
                })

    if not commoner_crusader_cards:
        return {'message': 'В соседних городах нет простолюдинов крестоносцев'}

    return {'message': 'Выберите карту простолюдина крестоносца, которую хотите переместить:',
            'commoner_crusader_cards': commoner_crusader_cards,
            'player_id_to_move': player.id,
            'handle':'handleMoveCard'}

# Возничий - Поменяй местами двух жителей одного сословия из городов слева и справа от Возничего
def charioteer(room, player):
    players = list(Player.objects.filter(room=room).order_by('id'))
    player_ids = [player.id for player in players]
    current_index = player_ids.index(player.id)
    next_player = players[(current_index + 1) % len(players)]
    prev_player = players[(current_index - 1) % len(players)]

    def get_groups(player):
        groups = set()
        for deck_entry in player.played_cards.all():
            try:
                card = deck_entry.get_card()
                if card.group in ('court', 'priest', 'peasant'):
                    groups.add(card.group)
            except Exception:
                continue
        return groups
    
    next_groups = get_groups(next_player)
    prev_groups = get_groups(prev_player)

    common_groups = next_groups & prev_groups

    group_labels = {
        'court': 'Придворные',
        'priest': 'Священники',
        'peasant': 'Крестьяне'
    }

    available_groups = [
        {'value': g, 'label': group_labels[g]}
        for g in common_groups
    ]

    if not available_groups:
        return {'message': 'У соседей нет общих сословий для обмена'}

    neighbors = {
        'next_player': {
            'player_id': next_player.id,
            'player_city_name': next_player.city_name
        },
        'prev_player': {
            'player_id': prev_player.id,
            'player_city_name': prev_player.city_name
        }
    }

    return {
        'message': f"Выбери сословие для обмена жителями между {next_player.city_name} и {prev_player.city_name}:",
        'available_groups': available_groups,
        'neighbors': neighbors,
        'handle':'handleChoiseCardToMove'
    }
# Разбойник - Можно поселить только в своем городе. Убивает придворного в другом городе.
def outlaw(room, player):
    other_players = Player.objects.filter(room=room).order_by('id').exclude(id=player.id)

    players_with_court = []

    for other_player in other_players:
        for deck_entry in other_player.played_cards.all():
            try:
                card = deck_entry.get_card()
                if card.group == "court":
                    players_with_court.append({
                        "id": other_player.id,
                        "name": other_player.city_name
                    })
                    break
            except Exception as e:
                continue

    if not players_with_court:
        return {'message': 'В городах нет придворных'} 
          
    return {'message': "Выбери город, в котором хочешь убить придворного:",
            'players_with_court': players_with_court,
            'handle': 'handleChoiseCourtKill'}

# Коля - Переманивает по одной женщине из соседних городов
def Kolya(room, player):
    players = list(Player.objects.filter(room=room).order_by('id'))
    player_ids = [player.id for player in players]
    current_index = player_ids.index(player.id)
    next_player = players[(current_index + 1) % len(players)]
    prev_player = players[(current_index - 1) % len(players)]

    cards_women_neighbors = {
            "next_player": {
                'player_id': next_player.id,
                'player_city_name': next_player.city_name,
                'cards': []
            },
            "prev_player": {
                'player_id': prev_player.id,
                'player_city_name': prev_player.city_name,
                'cards': []
            }
        }

    for player_label, neighbor in [("next_player", next_player), ("prev_player", prev_player)]:
        for deck_entry in neighbor.played_cards.all():
            card = deck_entry.get_card()
            if card.is_women:
                cards_women_neighbors[player_label]['cards'].append({
                    "card_id": deck_entry.id,
                    "card_name": card.name,
                })
    
    if not cards_women_neighbors["next_player"]['cards'] and not cards_women_neighbors["prev_player"]['cards']:
        return {'message':'Нет карт женщин'}

    return {'message': 'Выберите по одной женщине из соседних городов',
            'cards_women_neighbors': cards_women_neighbors,
            'player_id_to_move': player.id,
            'handle':'handleMoveCardMany'}

# Еретик (Алхимик) - Сбрось любого жителя из города и получи столько крестовых очков, сколько ПО приносит житель
def heretic_alchemist(room, player, card_id):
    all_played_cards = []
    seen_card_names = set()

    for entry_card in player.played_cards.all():
        card = entry_card.get_card()
        if entry_card.card_type == 'regular' and card.name not in seen_card_names and entry_card.id != card_id:
            all_played_cards.append({
                'id': entry_card.id,
                'name': card.name
            })
            seen_card_names.add(card.name)

    if not all_played_cards:
        return {'message': 'В городе нет карт жителей'}     
        
    return {'message': 'Выберите карту, которую хотите сбросить:',
            'all_played_cards': all_played_cards,
            'player_id': player.id,
            'handle': 'handleDeleteCardAndGetCrusadePoints'}

# Проповедник - Все крестоносцы в этом городе отправляются в Крестовый поход
def preacher(room, player):
    crusade(room, player)

    if(room.crusade_points <= 0):
        end_crusade(room)
        return {'message': 'Крестовый поход завершился — Святая Земля захвачена'}

    return {'message' : 'Крестовый поход завершился'}

# Епископ - Крестоносцы из всех городов отправляются в Крестовый Поход
def bishop(room, player):
    players = list(Player.objects.filter(room=room).order_by('id'))

    start_index = players.index(player)
    ordered_players = players[start_index:] + players[:start_index]

    for p in ordered_players:
        crusade(room, p)

    if room.crusade_points <= 0:
        end_crusade(room)
        return {'message': 'Крестовый поход завершился — Святая Земля захвачена'}

    return {'message': 'Крестовый поход завершился'}

# Менестрель - Ворует 3 крестовых очка у другого города
def minstrel(room, player):
    players = list(Player.objects.filter(room=room).exclude(id=player.id).order_by('id'))

    players_have_crusade_points = []

    for pl in players:
        if pl.crusade_points > 0:
            players_have_crusade_points.append({
                'id': pl.id,
                'name': pl.city_name
            })
    
    if not players_have_crusade_points:
        return {'message' : 'У игроков нет крестовых очков'}

    return {
        'message': 'Выберите город, из которого хотите своровать крестовые очки:',
        'players_have_crusade_points': players_have_crusade_points,
        'player': player.id,
        'handle': 'handleStealCrusadePoints'
    }

# Леди - Отправляет придворного крестоносца из соседнего города в Крестовый поход. Его крестовые очки достаются Леди
def lady(room, player):
    players = list(Player.objects.filter(room=room).order_by('id'))
    player_ids = [player.id for player in players]
    current_index = player_ids.index(player.id)
    next_player = players[(current_index + 1) % len(players)]
    prev_player = players[(current_index - 1) % len(players)]

    court_crusader_neighbor = []

    for neighbor in [next_player, prev_player]:
        for entry_card in neighbor.played_cards.all():
            card = entry_card.get_card()
            if entry_card.card_group_in_deck == "court" and card.crusade_points != 0:
                court_crusader_neighbor.append({
                    'player_id': neighbor.id,
                    'card_id': entry_card.id,
                    'card_name': card.name
                })
    
    if not court_crusader_neighbor:
        return {'message':'В соседних городах нет придворных крестоносцев'}

    return {'message':'Выберите придворного, которого хотите отправить в крестовый поход:',
            'court_crusader_neighbor': court_crusader_neighbor,
            'player_id': player.id,
            'handle': 'handleSendCourtCrusaderNeighbor'}

# Инквизитор - Убей любого жителя в этом городе. Если сжег Еретика, то Еретик тут же активируется еще раз
def inquisitor(room, player, card_id):
    played_cards = []
    seen_card_names = set()

    for entry_card in player.played_cards.all():
        card = entry_card.get_card()
        if entry_card.card_type == 'regular' and card.name not in seen_card_names and entry_card.id != card_id:
            played_cards.append({
                'id': entry_card.id,
                'name': card.name
            })
            seen_card_names.add(card.name)

    if not played_cards:
        return {'message': 'В городе нет карт жителей'}     
        
    return {'message': 'Выберите жителя, которого хотите убить:',
            'all_played_cards': played_cards,
            'player_id': player.id,
            'handle': 'handleKillCourt'}

def baby(room, player):
    baby_kill_cards = []

    for entry_card in player.played_cards.all():
        card = entry_card.get_card()
        if card.description == 'wanton_girl' or card.description == 'lady':
            baby_kill_cards.append({
                'id': entry_card.id,
                'name': card.name
            })
    
    if not baby_kill_cards:
        return {'message': 'В городе нет Леди и Распустной девки'}
    
    if len(baby_kill_cards) == 1:
        card_to_remove = player.played_cards.get(id=baby_kill_cards[0]['id'])
        player.played_cards.remove(card_to_remove)
        player.save()
        change_played_cards(room, player)
        return {'message':'Младенец убил жителя'}
    
    return {'message':'Выберите жителя, которого хотите убить:',
            'baby_kill_cards': baby_kill_cards,
            'handle':'KillCourt'}

DESCRIPTIONS_CARDS = {
    'plague_doctor': plague_doctor,
    'innkeeper': innkeeper, 
    'witch': witch,
    'executioner': executioner,
    'wanton_girl': wanton_girl,
    'fanatic': fanatic,
    'charioteer': charioteer,
    'outlaw': outlaw,
    'Kolya': Kolya,
    'heretic_alchemist': heretic_alchemist,
    'preacher': preacher,
    'bishop': bishop,
    'minstrel': minstrel,
    'lady': lady,
    'inquisitor': inquisitor,
    'baby': baby,
}


class CreateRoomView(APIView):
    def post(self, request, *args, **kwargs):
        host_id = request.data.get('host', '')
        existing_room = Room.objects.filter(host=host_id, status__in=[Room.RoomStatus.CREATED, Room.RoomStatus.IN_PROGRESS]).first()
        
        if existing_room:
            return Response(RoomSerializer(existing_room).data)

        new_room = Room.objects.create(
            host=host_id,
            status=Room.RoomStatus.CREATED,
            players_count=0
        )

        return Response(RoomSerializer(new_room).data, status=status.HTTP_201_CREATED)
    
class JoinRoomView(APIView):
    def post(self, request, *args, **kwargs):
        room_code = request.data.get('room_code')
        name = request.data.get('name')

        if not room_code or not name:
            return Response({'error': 'Отсутсвует код комнаты и/или имя пользователя'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            room = Room.objects.get(code=room_code)
        except Room.DoesNotExist:
            return Response({'error': 'Комната не найдена'}, status=status.HTTP_404_NOT_FOUND)
        
        if not request.session.session_key:
            request.session.create()

        session_key = request.session.session_key

        if Player.objects.filter(room=room, session_key=session_key).exists():
            return Response({'error': 'Вы уже подключены к этой комнате с этого устройства.'}, status=status.HTTP_403_FORBIDDEN)
        
        if Player.objects.filter(room=room).count() >= 4:
            return Response({"error": "Комната переполнена"}, status=400)
        
        start_city_names = ["Вонь", "Гниль", "Говен", "Дурно", "Крово", "Обжор", "Печаль", "Сирот", "Смрад", "Содом", "Трупо", "Тупо", "Хладно", "Хряко"]
        end_city_names = ["Бург", "Вилль", "Гаген", "Град", "Дорф", "Зден", "Ленд", "-на-рейне", "Полис", "Свят", "Слизь", "Стан", "Стойн", "Хольм"]

        index_start_city_name = random.randint(0, len(start_city_names) - 1)
        index_end_city_name = random.randint(0, len(end_city_names) - 1)

        end_city_name = end_city_names[index_end_city_name]

        if(end_city_name[0] != '-'):
            end_city_name = " " + end_city_name
        
        city_name = start_city_names[index_start_city_name] + end_city_name


        player = Player.objects.create(name=name, room=room, session_key=session_key, city_name = city_name)
        room.players_count += 1
        room.save()

        serializer = PlayerSerializer(player)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
class PlayersInRoomView(APIView):
    def get(self, request, room_code):
        room = get_object_or_404(Room, code=room_code)
        players = Player.objects.filter(room=room)
        serializer = PlayerSerializer(players, many=True)
        return Response(serializer.data)

class RemovePlayerView(APIView):
    def delete(self, request, room_code, player_id):
        room = get_object_or_404(Room, code=room_code)
        
        try:
            player = room.players.get(id=player_id)
        except Player.DoesNotExist:
            return Response({"error": "Игрок не найден"}, status=status.HTTP_404_NOT_FOUND)
        
        player.delete()
        
        room.players_count -= 1
        room.save()

        return Response({'message': 'Игрок усппешно удален'}, status=status.HTTP_200_OK)
    
class CheckSessionInRoomView(APIView):
    def get(self, request, room_code):
        session_key = request.session.session_key
        if not session_key:
            return Response({'exists': False}, status=status.HTTP_200_OK)

        try:
            room = Room.objects.get(code=room_code)
            exists = Player.objects.filter(room=room, session_key=session_key).exists()
            return Response({'exists': exists, 'room_status': room.status})
        except Room.DoesNotExist:
            return Response({'exists': False}, status=status.HTTP_404_NOT_FOUND)

class StartGameView(APIView):
    def post(self, request, *args, **kwargs):
        room_code = request.data.get('room_code')

        try:
            room = Room.objects.get(code=room_code)
        except Room.DoesNotExist:
            return Response({'exists': False}, status=status.HTTP_404_NOT_FOUND)
        
        players_count = room.players_count

        if(players_count > 2 and players_count < 5):
            if players_count == 3:
                room.crusade_points = 16
            elif players_count == 4:
                room.crusade_points = 20

            room.status = Room.RoomStatus.IN_PROGRESS

            players = room.players.all()
            current_player = players.first()

            room.current_player = current_player
            room.save()

            change_crusade_points(room)

            current_player.status = Player.PlayerStatus.SET
            current_player.save()

            deck = Deck.objects.create(room=room)

            card_entries = []

            for card in Card.objects.all():
                for _ in range(card.quantity_in_deck):
                    card_entries.append({'type': 'regular', 'id': card.id, 'group': card.group})

            for epidemic_card in CardEpidemic.objects.all():
                card_entries.append({'type': 'epidemic', 'id': epidemic_card.id, 'group': 'epidemic'})

            random.shuffle(card_entries)

            for i, entry in enumerate(card_entries):
                DeckCardEntry.objects.create(
                    deck=deck,
                    card_type=entry['type'],
                    card_id=entry['id'],
                    card_group_in_deck=entry['group'],
                    order=i
                )

            entries = deck.entries.filter(is_played=False).order_by('order')[:3]

            Crossroad.objects.create(
                room=room,
                card1=entries[0] if len(entries) > 0 else None,
                card2=entries[1] if len(entries) > 1 else None,
                card3=entries[2] if len(entries) > 2 else None,
            )

            for entry in entries:
                entry.is_played = True 
                entry.save()  

            return Response({"message": "Игра началась"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Игра может быть запущена только при 3-4 игроках"}, status=status.HTTP_400_BAD_REQUEST)
        
class PlayersCount(APIView):
    def get(self, request, room_code):
        room = get_object_or_404(Room, code=room_code)
        return Response(room.players_count)
    
class RoomStatusView(APIView):
    def get(self, request, room_code):
        room = get_object_or_404(Room, code=room_code)
        return Response(room.status)
    
class CurrentPlayerView(APIView):
    def get(self, request, room_code):
        try:
            room = Room.objects.get(code=room_code)
        except Room.DoesNotExist:
            return Response({'error': 'Комната не найдена'}, status=status.HTTP_404_NOT_FOUND)
        
        current_player = room.current_player

        if not current_player:
            return Response({'error': 'Текущий игрок не установлен'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = PlayerSerializer(current_player)
        return Response(serializer.data)
    
class AddCardToHandView(APIView):
    def post(self, request, room_code, player_id, card_id):
        id_card_in_deck = request.data.get('id_card_in_deck')

        try:
            room = Room.objects.get(code=room_code)
            player = Player.objects.get(id=player_id, room=room)
            deck = Deck.objects.get(room=room)
        except Room.DoesNotExist:
            return Response({'error': 'Комната не найдена'}, status=111)
        except Player.DoesNotExist:
            return Response({'error': 'Игрок не найден в указанной комнате'}, status=222)
        except Deck.DoesNotExist:
            return Response({'error': 'Колода не найдена'}, status=333)
        
        try:
            card_entry = deck.entries.get(id=id_card_in_deck)
        except DeckCardEntry.DoesNotExist:
            return Response({'error': 'Карта не найдена в колоде'}, status=444)
        
        player.hand.add(card_entry)
        player.save()

        card_entry.is_played = True
        card_entry.save()

        return Response({'message': 'Карта успешно добавлена в руку игрока'}, status=status.HTTP_200_OK)
    
class PlayerHandView(APIView):
    def get(self, request, room_code, player_id):
        try:
            room = Room.objects.get(code=room_code)
        except Room.DoesNotExist:
            return Response({'error': 'Комната не найдена'}, status=123)

        try:
            player = Player.objects.get(id=player_id, room=room)
        except Player.DoesNotExist:
            return Response({'error': 'Игрок не найден в указанной комнате'}, status=213)
        
        hand_entries = player.hand.all()

        cards_data = DeckCardEntrySerializer(hand_entries, many=True)

        return Response(cards_data.data, status=status.HTTP_200_OK)
    
class PlayerStatusView(APIView):
    def post(self, request, room_code):
        player_id = request.data.get("player_id")

        try:
            room = Room.objects.get(code=room_code)
            player = Player.objects.get(id=player_id, room=room)
        except Room.DoesNotExist:
            return Response({'error': 'Комната не найдена'}, status=111)
        except Player.DoesNotExist:
            return Response({'error': 'Игрок не найден в указанной комнате'}, status=222)
        
        return Response(player.status, status=status.HTTP_200_OK)
    
class EditPlayerStatusView(APIView):
    def post(self, request, room_code):
        player_id = request.data.get("player_id")
        new_status = request.data.get("new_status")

        try:
            room = Room.objects.get(code=room_code)
            player = Player.objects.get(id=player_id, room=room)
        except Room.DoesNotExist:
            return Response({'error': 'Комната не найдена'}, status=111)
        except Player.DoesNotExist:
            return Response({'error': 'Игрок не найден в указанной комнате'}, status=222)
        
        if new_status not in Player.PlayerStatus.values:
            return Response({'error': 'Недопустимый статус'}, status=400)

        
        player.status = new_status
        player.save()

        return Response({'message': 'Статус успешно изменен'}, status=status.HTTP_200_OK)
    
class AddCardToPlayerPlayedCard(APIView):
    def post(self, request, room_code):
        player_id = request.data.get('player_id')
        id_card_in_deck = request.data.get('id_card_in_deck')
    
        try:
            room = Room.objects.get(code=room_code)
            player = Player.objects.get(id=player_id, room = room)
            deck = Deck.objects.get(room = room)
        except Room.DoesNotExist:
            return Response({'error': 'Комната не найдена'}, status=111)
        except Player.DoesNotExist:
            return Response({'error': 'Игрок не найден'}, status=222)
        except Deck.DoesNotExist:
            return Response({'error': 'Колода не найдена'}, status=333)
        
        try:
            card = deck.entries.get(id=id_card_in_deck)
        except DeckCardEntry.DoesNotExist:
            return Response({'error': 'Карта не найдена в колоде'}, status=444)

        if(card.card_group_in_deck == "epidemic"):
            try:
                epidemic_card = card.get_card()
            except CardEpidemic.DoesNotExist:
                return Response({'error': 'Карты эпидемии не существует'}, status=555)

            ActiveEpidemic.objects.create(
                epidemic_card = epidemic_card,
                room = room,
                hotbed_city = player,
                current_city = player,
                death_count = epidemic_card.death_count
            )
        
        player.played_cards.add(card)
        player.save()

        change_played_cards(room, player)

        if card.card_type == 'regular':
            actual_card = card.get_card()
            effect_func = DESCRIPTIONS_CARDS.get(actual_card.description)
            if effect_func:
                if actual_card.description == 'inquisitor' or actual_card.description == 'heretic_alchemist':
                    result = effect_func(room, player, card.id)
                else:
                    result = effect_func(room, player)
                return Response(result, status=200)
            

        return Response({'message': 'Карта успешно разыграна'}, status=200)
    
class PlayedCardView(APIView):
    def post(self, request, room_code):
        player_id = request.data.get('player_id')

        try:
            room = Room.objects.get(code=room_code)
            player = Player.objects.get(id=player_id, room = room)
        except Room.DoesNotExist:
            return Response({'error': 'Комната не найдена'}, status=111)
        except Player.DoesNotExist:
            return Response({'error': 'Игрок не найден'}, status=222)
        
        return Response(PlayerSerializer(player).data, status=status.HTTP_200_OK)
    
class DeleteCardHandView(APIView):
    def delete(self, request, room_code):
        id_card_in_deck = request.data.get('id_card_in_deck')
        player_id = request.data.get('player_id')

        try:
            room = Room.objects.get(code=room_code)
            player = Player.objects.get(id=player_id, room = room)
        except Room.DoesNotExist:
            return Response({'error': 'Комната не найдена'}, status=111)
        except Player.DoesNotExist:
            return Response({'error': 'Игрок не найден'}, status=222)
        
        try:
            card = DeckCardEntry.objects.get(id=id_card_in_deck)
        except DeckCardEntry.DoesNotExist:
            return Response({'error': 'Карта не найдена'}, status=404)

        player.hand.remove(card)

        return Response({'message': 'Карта успешно удалена из руки'}, status=200)
        
class EditCurrentPlayerView(APIView):
    def get(self, request, room_code):
        try:
            room = Room.objects.get(code=room_code)
        except Room.DoesNotExist:
            return Response({'error': 'Комната не найдена'}, status=111)
        
        players = list(Player.objects.filter(room=room).order_by('id'))

        if not players:
            return Response({'error': 'Нет игроков в комнате'}, status=400)
        
        if room.current_player is None:
            next_player = players[0]
        else:
            current_id = room.current_player.id
            player_ids = [player.id for player in players]
            current_index = player_ids.index(current_id)
            next_player = players[(current_index + 1) % len(players)]
    
        change_current_player(room, next_player)

        next_player.status = 'set_cards'
        next_player.save()

        return Response({'message': 'Текущий игрок обновлён'}, status=200)     
        
class LogicEpidemic(APIView):
    def post(self, request, room_code):
        player_id = request.data.get('player_id')

        try:
            room = Room.objects.get(code=room_code)
            player = Player.objects.get(id=player_id, room=room)
        except Room.DoesNotExist:
            return Response({'error': 'Комната не найдена'}, status=111)
        except Player.DoesNotExist:
            return Response({'error': 'Игрок не найден'}, status=222)
        
        players = list(Player.objects.filter(room=room).order_by('id'))

        if room.current_player is None:
            next_player = players[0]
        else:
            current_id = room.current_player.id
            player_ids = [player.id for player in players]
            current_index = player_ids.index(current_id)
            next_player = players[(current_index + 1) % len(players)]
        
        regular_cards = player.played_cards.filter(card_type='regular')

        active_epidemics = ActiveEpidemic.objects.filter(room=room, current_city=player)

        for epidemic in active_epidemics:
                try:
                    deck_entry = epidemic.room.deck.entries.get(
                        card_type='epidemic',
                        card_id=epidemic.epidemic_card.id
                    )
                except DeckCardEntry.DoesNotExist:
                    continue

                # Удаление жителей
                effect_key = epidemic.epidemic_card.effect
                effect_handler = EFFECTS_EPIDEMICS.get(effect_key)

                if effect_handler:
                    sorted_cards = effect_handler(regular_cards)
                    death_quota = epidemic.death_count
                    killed_cards = []
                    peasant_killed = False
                    for card in sorted_cards:
                        card_obj = card.get_card()
                        if card_obj.description == 'peasant' and not peasant_killed:
                            peasants = [c for c in regular_cards if c.get_card().description == 'peasant']
                            killed_cards.extend(peasants)
                            peasant_killed = True
                            death_quota -= 1
                        elif card not in killed_cards:
                            killed_cards.append(card)
                            death_quota -= 1
                        if death_quota <= 0:
                            break

                    for card in killed_cards:
                        player.played_cards.remove(card)

                    player.save()
                    change_played_cards(room, player)

                # Перемещение карты
                epidemic.current_city = next_player

                if epidemic.hotbed_city == next_player:
                    epidemic.death_count += 1

                epidemic.save()

                player.played_cards.remove(deck_entry)
                player.save()
                change_played_cards(room, player)

                next_player.played_cards.add(deck_entry)
                next_player.save()
                change_played_cards(room, next_player)
        
        return Response({'message': 'Эпидемии передвинуты'})

class CureEpidemicView(APIView):
    def post(self, request, room_code):
        epidemic_id = request.data.get('epidemic_id')

        try:
            room = Room.objects.get(code=room_code)
            epidemic = ActiveEpidemic.objects.get(id=epidemic_id, room=room)
        except (Room.DoesNotExist, Player.DoesNotExist, ActiveEpidemic.DoesNotExist):
            return Response({'error': 'Ошибка при лечении эпидемии'}, status=400)
        
        player = epidemic.current_city

        epidemic_card = epidemic.epidemic_card
        epidemic.delete()

        entry = player.played_cards.filter(card_type='epidemic', card_id=epidemic_card.id).first()
        if entry:
            player.played_cards.remove(entry)
            player.save()

        change_played_cards(room, player)
        return Response({'message': 'Эпидемия успешно устранена'}, status=200)

class KillCourt(APIView):
    def post(self, request, room_code):
        player_id = request.data.get('player_id_where_kill')
        id_card_in_deck = request.data.get('id_card_in_deck')
        card_description = request.data.get('card_description')
        player_id_play = request.data.get('player_id')

        try:
            room = Room.objects.get(code=room_code)
            player = Player.objects.get(room=room, id=player_id)
            player_play = Player.objects.get(room=room, id=player_id_play)
            deck = Deck.objects.get(room=room)
        except Room.DoesNotExist:
            return Response({'error: Комната не найдена'}, status=111)
        except Player.DoesNotExist:
            return Response({'error': 'Игрок не найден'}, status=222)
        except Deck.DoesNotExist:
            return Response({'error': 'Колода не найдена'}, status=222)
        
        remove_card = player.played_cards.get(id=id_card_in_deck)
        player.played_cards.remove(remove_card)
        player.save()

        change_played_cards(room, player)

        if(card_description == "executioner"):
            players = list(Player.objects.filter(room=room).order_by('id'))
            player_ids = [player.id for player in players]
            current_index = player_ids.index(player_id)
            next_player = players[(current_index + 1) % len(players)]
            prev_player = players[(current_index - 1) % len(players)]

            next_peasants = next_player.played_cards.filter(card_type='regular', card_group_in_deck='peasant')
            prev_peasants = prev_player.played_cards.filter(card_type='regular', card_group_in_deck='peasant')

            response_data = {
                'message': 'Выберите простолюдинов для перемещения',
                'next_player': {
                    'id': next_player.id,
                    'city_name': next_player.city_name,
                    'peasant_cards': [
                        {'id': card.id, 'name': card.get_card().name}
                        for card in next_peasants
                    ]
                },
                'prev_player': {
                    'id': prev_player.id,
                    'city_name': prev_player.city_name,
                    'peasant_cards': [
                        {'id': card.id, 'name': card.get_card().name}
                        for card in prev_peasants
                    ]
                },
                'player_id_to_move': player_id
            }
            
            return Response(response_data, status=200)
        elif(card_description == "inquisitor" and remove_card.get_card().description == 'heretic_alchemist'):
            top_card_entry = deck.entries.filter(is_played=False).order_by('order').first()

            if not top_card_entry:
                return Response({'message': 'В колоде нет доступных карт', 'status': 'end_game'}, status=200)
            
            player_play.hand.add(top_card_entry)
            player_play.save()
            return Response({'message':'Инквизитор сжег еретика, игрок берет в руки карту'}, status=200)
        else:
            return Response({'message': 'Карта удалена'}, status=200)

class MovePeasantCard(APIView):
    def post(self, request, room_code):
        player_id_from_move = request.data.get('player_id_from_move')
        player_id_to_move = request.data.get('player_id_to_move')
        id_card_in_deck = request.data.get('id_card_in_deck')

        try:
            room = Room.objects.get(code=room_code)
            player_from = Player.objects.get(room=room, id=player_id_from_move)
            player_to = Player.objects.get(room=room, id=player_id_to_move)
        except Room.DoesNotExist:
            return Response({'error': 'Комната не найдена'}, status=111)
        except Player.DoesNotExist:
            return Response({'error': 'Игрок не найден'}, status=222)

        card = player_from.played_cards.get(id=id_card_in_deck)
        if not card:
            return Response({'error': 'Карта не найдена у игрока'}, status=400)

        player_from.played_cards.remove(card)
        player_from.save()
        change_played_cards(room, player_from)

        player_to.played_cards.add(card)
        player_to.save()
        change_played_cards(room, player_to)

        return Response({'message': "Карта простолюдина успешно перемещена"}, status=200)
    
class MoveCard(APIView):
    def post(self, request, room_code):
        player_id_from = request.data.get("player_id_from_move")
        player_id_to = request.data.get("player_id_to_move")
        card_id = request.data.get("card_id")

        try:
            room = Room.objects.get(code=room_code)
            player_from = Player.objects.get(room=room, id=player_id_from)
            player_to = Player.objects.get(room=room, id=player_id_to)
            deck = Deck.objects.get(room=room)
        except Room.DoesNotExist:
            return Response({'error: Комната не найдена'}, status=111)
        except Player.DoesNotExist:
            return Response({'error': 'Игрок не найден'}, status=222)
        except Deck.DoesNotExist:
            return Response({'error': 'Колода не найдена'}, status=333)
        
        card = deck.entries.get(id=card_id)

        player_from.played_cards.remove(card)
        change_played_cards(room, player_from)

        player_to.played_cards.add(card)
        change_played_cards(room, player_to)

        return Response({'message': "Карта Монах успешно перемещена"}, status=200)

class ChoiseCardByGroupToMove(APIView):
    def post(self, request, room_code):
        next_player_id = request.data.get("next_player_id")
        prev_player_id = request.data.get("prev_player_id")
        card_group = request.data.get("card_group")

        try:
            room = Room.objects.get(code=room_code)
            next_player = Player.objects.get(room=room, id=next_player_id)
            prev_player = Player.objects.get(room=room, id=prev_player_id)
        except Room.DoesNotExist:
            return Response({'error: Комната не найдена'}, status=111)
        except Player.DoesNotExist:
            return Response({'error': 'Игрок не найден'}, status=222)
        
        cards_group_neighbors = {
            "next_player": {
                'player_id': next_player.id,
                'player_city_name': next_player.city_name,
                'cards': []
            },
            "prev_player": {
                'player_id': prev_player.id,
                'player_city_name': prev_player.city_name,
                'cards': []
            }
        }

        for player_label, neighbor in [("next_player", next_player), ("prev_player", prev_player)]:
            for deck_entry in neighbor.played_cards.all():
                card = deck_entry.get_card()
                if deck_entry.card_type == 'regular':
                    if card.group == card_group:
                        cards_group_neighbors[player_label]['cards'].append({
                            "card_id": deck_entry.id,
                            "card_name": card.name,
                        })

        return Response({'message': "Выберите по одной карте",
                        'cards_group_neighbors': cards_group_neighbors,
                        'handle':'handleSwapCards'}, 
                        status=200)


class SwapCards(APIView):
    def post(self, request, room_code):
        next_player_id = request.data.get("next_player_id")
        next_player_card_id = request.data.get("next_player_card_id")
        prev_player_id = request.data.get("prev_player_id")
        prev_player_card_id = request.data.get("prev_player_card_id")

        try:
            room = Room.objects.get(code=room_code)
            next_player = Player.objects.get(room=room, id=next_player_id)
            prev_player = Player.objects.get(room=room, id=prev_player_id)
            deck = Deck.objects.get(room=room)

            next_player_card = deck.entries.get(id=next_player_card_id)
            prev_player_card = deck.entries.get(id=prev_player_card_id)
        except Room.DoesNotExist:
            return Response({'error: Комната не найдена'}, status=111)
        except Player.DoesNotExist:
            return Response({'error': 'Игрок не найден'}, status=222)
        except Deck.DoesNotExist:
            return Response({'error': 'Колода не найдена'}, status=222)
        except DeckCardEntry.DoesNotExist:
            return Response({'error': 'Карта не найдена'}, status=222)
        
        next_player.played_cards.add(prev_player_card)
        prev_player.played_cards.add(next_player_card)

        next_player.played_cards.remove(next_player_card)
        prev_player.played_cards.remove(prev_player_card)

        change_played_cards(room, next_player)
        change_played_cards(room, prev_player)

        return Response({'message': "Карты поменялись местами"}, status=200)

class ChoiseCourtKill(APIView):
    def post(self, request, room_code):
        player_id = request.data.get('player_id')        
        try:
            room = Room.objects.get(code=room_code)
            player = Player.objects.get(room=room, id=player_id)
        except Room.DoesNotExist:
            return Response({'error: Комната не найдена'}, status=111)
        except Player.DoesNotExist:
            return Response({'error': 'Игрок не найден'}, status=222)  

        result = executioner(room, player)

        return Response(result, status=200)

class CrusadePointsView(APIView):
    def get(self, request, room_code):
        try:
            room = Room.objects.get(code=room_code)
        except Room.DoesNotExist:
            return Response({'error: Комната не найдена'}, status=111)
        
        data = room.crusade_points

        return Response(data, status=200)
    
class PlayerCrusadePointsView(APIView):
    def post(self, request, room_code):
        player_id = request.data.get('player_id')

        try:
            room = Room.objects.get(code=room_code)
            player = Player.objects.get(room=room, id=player_id)
        except Room.DoesNotExist:
            return Response({'error: Комната не найдена'}, status=111)
        except Player.DoesNotExist:
            return Response({'error: Игрок не найден'}, status=111)
        
        data = player.crusade_points

        return Response(data, status=200)
    
class CountRelicsView(APIView):
    def get(self, request, room_code):
        try:
            room = Room.objects.get(code=room_code)
        except Room.DoesNotExist:
            return Response({'error: Комната не найдена'}, status=111)
        
        data = room.count_relics

        return Response(data, status=200)
    
class PlayerCountRelicsView(APIView):
    def post(self, request, room_code):
        player_id = request.data.get('player_id')

        try:
            room = Room.objects.get(code=room_code)
            player = Player.objects.get(room=room, id=player_id)
        except Room.DoesNotExist:
            return Response({'error: Комната не найдена'}, status=111)
        except Player.DoesNotExist:
            return Response({'error: Игрок не найден'}, status=111)
        
        data = player.count_relics

        return Response(data, status=200)
    
class DeleteCardAndGetCrusadePoints(APIView):
    def post(self, request, room_code):
        player_id = request.data.get('player_id')
        card_id = request.data.get('card_id')

        try:
            room = Room.objects.get(code=room_code)
            player = Player.objects.get(room=room, id=player_id)
            deck = Deck.objects.get(room=room)

            entry_card = deck.entries.get(id=card_id)
        except Room.DoesNotExist:
            return Response({'error: Комната не найдена'}, status=111)
        except Player.DoesNotExist:
            return Response({'error: Игрок не найден'}, status=222)
        except Deck.DoesNotExist:
            return Response({'error: Колода не найдена'}, status=333)
        except DeckCardEntry.DoesNotExist:
            return Response({'error: Карта не найдена'}, status=444)
        
        card = entry_card.get_card()

        crusade_point = card.victory_points

        player.crusade_points += crusade_point
        player.played_cards.remove(entry_card)
        player.save()
        change_played_cards(room, player)
        change_player_crusade_points(room, player)

        room.crusade_points -= crusade_point

        room.save()
        change_crusade_points(room)

        if room.crusade_points <= 0:
            end_crusade(room)

        return Response({'message': 'Игрок удален, крестовые очки добавлены игроку, крестовые очки вычтены из общего числа'}, status=200)

class StealCrusadePoints(APIView):
    def post(self, request, room_code):
        player_id_from = request.data.get('player_id_from')
        player_id_to = request.data.get('player_id_to')

        try:
            room = Room.objects.get(code=room_code)
            player_from = Player.objects.get(room=room, id=player_id_from)
            player_to = Player.objects.get(room=room, id=player_id_to)
        except Room.DoesNotExist:
            return Response({'error: Комната не найдена'}, status=111)
        except Player.DoesNotExist:
            return Response({'error: Игрок не найден'}, status=222)
        
        if player_from.crusade_points >= 3:
            player_from.crusade_points -= 3
            player_from.save()
            player_to.crusade_points +=3
            player_to.save()
        else:
            count = player_from.crusade_points
            player_from.crusade_points = 0
            player_from.save()
            player_to.crusade_points += count
            player_to.save()
        
        change_player_crusade_points(room, player_to)
        change_player_crusade_points(room, player_from)

        return Response({'message':'Очки перемещены'}, status=200)

class SendCourtCrusader(APIView):
    def post(self, request, room_code):
        player_id_from = request.data.get('player_id_from')
        player_id_to = request.data.get('player_id_to')
        card_id = request.data.get('card_id')

        try:
            room = Room.objects.get(code=room_code)
            player_from = Player.objects.get(room=room, id=player_id_from)
            player_to = Player.objects.get(room=room, id=player_id_to)
            deck = Deck.objects.get(room=room)
            entry_card = deck.entries.get(id=card_id)
        except Room.DoesNotExist:
            return Response({'error: Комната не найдена'}, status=111)
        except Player.DoesNotExist:
            return Response({'error: Игрок не найден'}, status=222)
        except Deck.DoesNotExist:
            return Response({'error: Колода не найдена'}, status=333)
        
        player_from.played_cards.remove(entry_card)
        player_from.save()
        change_played_cards(room, player_from)

        count = entry_card.get_card().crusade_points

        player_to.crusade_points += count

        if player_to.crusade_points < 0:
            player_to.crusade_points = 0

        player_to.save()
        change_player_crusade_points(room, player_to)

        if count > 0:
            room.crusade_points -= count
            room.save()

        if room.crusade_points <=0:
            end_crusade(room)

        change_crusade_points(room)

        return Response({'message':'Успех'}, status=200)

class RequireDiscardToSettle(APIView):
    def post(self, request, room_code):
        player_id = request.data.get('player_id')
        card_id = request.data.get('card_id')

        try:
            room = Room.objects.get(code=room_code)
            player = Player.objects.get(room=room, id=player_id)
            deck = Deck.objects.get(room=room)
            entry_card = deck.entries.get(id=card_id)
        except Room.DoesNotExist:
            return Response({'message':'Комната не найдена'}, status=111)
        except Player.DoesNotExist:
            return Response({'message':'Игрок не найден'}, status=222)
        except Deck.DoesNotExist:
            return Response({'message':'Колода не найдена'}, status=333)
        except DeckCardEntry.DoesNotExist:
            return Response({'message':'Карта не найдена'}, status=333)
        
        have_squire = False

        for played_card in player.played_cards.all():
            card = played_card.get_card()
            if played_card.card_type == 'regular' and card.description == "squire":
                have_squire = True
                break
        
        if(have_squire):
            player.played_cards.add(entry_card)
            player.hand.remove(entry_card)
            player.save()
            change_played_cards(room, player)
            return Response({'message':'Карта разыграна',
                             'can_play': True}, status=200)
        else:
            count_cards_hand = player.hand.count()
            print(f"Количество карт в руке: {count_cards_hand}")
            if(count_cards_hand < 2):
                return Response({'message':'Карту нельзя сыграть в своем городе',
                                 'can_play': False}, status=200)
            elif(count_cards_hand == 2):
                print("2 карты на руке, сбрасывается 1")
                player.played_cards.add(entry_card)
                player.hand.clear()
                player.save()
                change_played_cards(room, player)

                return Response({'message':'Карта с руки сброшена, карта разыграна'}, status=200)
            elif(count_cards_hand > 2):
                cards_hand = []
                for entry_card_hand in player.hand.all(): 
                    card_hand = entry_card_hand.get_card()
                    if entry_card_hand.id != card_id:
                        cards_hand.append({
                            'id': entry_card_hand.id,
                            'name': card_hand.name,
                        })
                
                return Response({'message':'Выберите карту для сброса',
                                 'can_play': True,
                                 'cards_hand': cards_hand,
                                 'card_id_play': card_id,
                                 'handle': 'handleResetCard'}, status=200)
        
class ResetCardAndPlay(APIView):
    def post(self, request, room_code):
        player_id = request.data.get('player_id')
        reset_card_id = request.data.get('card_id')
        card_id_play = request.data.get('card_id_play')

        try:
            room = Room.objects.get(code=room_code)
            player = Player.objects.get(room=room, id=player_id)
            deck = Deck.objects.get(room=room)
            reset_card = deck.entries.get(id=reset_card_id)
            play_card = deck.entries.get(id=card_id_play)
        except Room.DoesNotExist:
            return Response({'message':'Комната не найдена'}, status=111)
        except Player.DoesNotExist:
            return Response({'message':'Игрок не найден'}, status=222)
        except Deck.DoesNotExist:
            return Response({'message':'Колода не найдена'}, status=333)
        except DeckCardEntry.DoesNotExist:
            return Response({'message':'Карта не найдена'}, status=333)

        player.hand.remove(reset_card)
        player.hand.remove(play_card)
        player.played_cards.add(play_card)
        player.save()
        change_played_cards(room, player)

        return Response({'message': 'Карта удалена из руки, карта разыграна'}, status=200)

class EndGameCheck(APIView):
    def get(self, request, room_code):
        try:
            room = Room.objects.get(code=room_code)
            deck = Deck.objects.get(room=room)
        except Room.DoesNotExist:
            return Response({'message':'Комната не найдена'}, status=111)
        except Deck.DoesNotExist:
            return Response({'message':'Колода не найдена'}, status=111)
        
        player = room.current_player

        count_residents = 0

        for entry_card in player.played_cards.all():
            if entry_card.card_type == 'regular':
                count_residents += 1

        if count_residents >= 10:
            room.status = 'finished'
            room.save()
            change_status_room(room)
            scoring_points(room)
            return Response({'message':'Конец игры', 'end_game': True}, status=200)
        
        deck_is_empty = not deck.entries.filter(is_played=False).exists()
        if deck_is_empty:
            room.status = 'finished'
            room.save()
            change_status_room(room)
            scoring_points(room)
            return Response({'message':'Конец игры', 'end_game': True}, status=200)
        
        return Response({'message':'Игра продолжается', 'end_game': False}, status=200)

class ScoringPointsView(APIView):
    def get(self, requset, room_code):
        try:
            room = Room.objects.get(code=room_code)
        except Room.DoesNotExist:
            return Response({'message':'Комната не найдена'}, status=111)
        
        table_score = []
        
        players = list(Player.objects.filter(room=room).order_by('id'))

        for player in players:
            table_score.append({
                'id': player.id,
                'name': player.name,
                'city_name': player.city_name,
                'score': player.victory_points
            })

        return Response({'message':'Итоговые результаты', 'table_score': table_score}, status=200)
        
        
        
def scoring_points(room):
    players = list(Player.objects.filter(room=room).order_by('id'))

    for player in players:
        score = 0
        monks = []
        tradeswomen = []
        peasants = []

        for entry_card in player.played_cards.all():
            card = entry_card.get_card()

            if entry_card.card_type != 'regular':
                continue

            # Сбор специфических карт
            if card.description == 'monk':
                monks.append(card)
            elif card.description == 'tradeswoman':
                tradeswomen.append(card)
            elif card.description == 'peasant':
                peasants.append(card)
            else:
                score += card.victory_points

        # Торговки: очки только если одна
        if len(tradeswomen) == 1:
            score += tradeswomen[0].victory_points

        # Монахи: базовые очки минус 2 ПО за каждого другого монаха
        monk_count = len(monks)
        if monk_count > 0:
            for monk in monks:
                score += monk.victory_points
            score -= monk_count * (monk_count - 1) * 2

        # Крестьяне: базовые очки +1 ПО за каждого другого крестьянина
        peasant_count = len(peasants)
        for peasant in peasants:
            score += peasant.victory_points + (peasant_count - 1)

        score += player.count_relics * 7

        player.victory_points = score
        player.save()





def crusade(room, player):
    total_crusade_points = 0
    crusaders_to_remove = []
    crusaders_with_points = []
    war_horses = []

    # Разделяем карты: кони и обычные крестоносцы
    for entry_card in player.played_cards.all():
        card = entry_card.get_card()
        if entry_card.card_type == 'regular' and card.crusade_points != 0:
            crusaders_to_remove.append(entry_card)
            if card.description == "war_horse":
                war_horses.append(entry_card)
            else:
                crusaders_with_points.append(entry_card)

    # Если есть только кони (без других крестоносцев) — не начисляем очки
    if len(crusaders_with_points) == 0 and len(war_horses) > 0:
        # Удаляем боевых коней, но очки не добавляем
        for entry_card in war_horses:
            player.played_cards.remove(entry_card)

        change_played_cards(room, player)
        return {'message': 'Боевые кони ушли в поход, но не принесли крестовых очков, так как были одни'}

    # Начисляем очки от всех участников (включая коней)
    for entry_card in crusaders_to_remove:
        total_crusade_points += entry_card.get_card().crusade_points

    player.crusade_points += total_crusade_points
    if player.crusade_points < 0:
        player.crusade_points = 0
    player.save()

    change_player_crusade_points(room, player)

    for entry_card in crusaders_to_remove:
        player.played_cards.remove(entry_card)

    change_played_cards(room, player)

    if total_crusade_points > 0:
        room.crusade_points -= total_crusade_points
        room.save()
        change_crusade_points(room)

    return {'message': f'Крестовый поход завершён. Получено очков: {total_crusade_points}'}

    
def end_crusade(room):
    players = list(Player.objects.filter(room=room).order_by('id'))
    max_crusade_points = 0
    player_with_max = None

    for player in players:
        if player.crusade_points > max_crusade_points:
            max_crusade_points = player.crusade_points
            player_with_max = player

    for player in players:
        player.crusade_points = 0
        player.save()
        change_player_crusade_points(room, player)

    if room.players_count == 3:
        room.crusade_points = 16
    elif room.players_count == 4:
        room.crusade_points = 20

    change_crusade_points(room)

    if room.count_relics > 0:
        room.count_relics -= 1
        room.save()
        change_count_relics(room)

        if player_with_max:
            player_with_max.count_relics += 1
            player_with_max.save()
            change_player_count_relics(room, player_with_max)
    
def change_current_player(room, new_player):
    room.current_player = new_player
    room.save()

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"room_{room.code}",
        {
            "type": "game_update",
            "action": "player_change",
            "payload": PlayerSerializer(new_player).data
        }
    )

def change_played_cards(room, player):
    payload = PlayerSerializer(player).data

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"room_{room.code}",
        {
            "type": "changed_played_cards",
            "action": "player_change",
            "payload": payload
        }
    )

def change_crusade_points(room):
    payload = room.crusade_points

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"room_{room.code}",
        {
            "type": "crusade_points_update",
            "action": "crusade_points_update",
            "payload": payload
        }
    )

def change_player_crusade_points(room, player):
    payload = player.crusade_points
    id = player.id

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"room_{room.code}",
        {
            "type": "changed_player_crusade_points",
            "action": "changed_player_crusade_points",
            "payload": payload,
            "player_id": id,
        }
    )

def change_count_relics(room):
    payload = room.count_relics

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"room_{room.code}",
        {
            "type": "count_relics_update",
            "action": "count_relics_update",
            "payload": payload
        }
    )

def change_player_count_relics(room, player):
    payload = player.count_relics
    id = player.id

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"room_{room.code}",
        {
            "type": "changed_player_count_relics",
            "action": "changed_player_count_relics",
            "payload": payload,
            "player_id": id,
        }
    )

def change_status_room(room):
    payload = room.status

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"room_{room.code}",
        {
            "type": "changed_status_room",
            "action": "changed_status_room",
            "payload": payload,
        }
    )
   




