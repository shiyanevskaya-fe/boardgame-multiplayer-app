from django.db import models
import string
import random
from cards.models import DeckCardEntry

# Генерация уникального кода для комнаты
def generate_room_code(length=6):
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choice(characters) for _ in range(length))


class Room(models.Model):
    class RoomStatus(models.TextChoices):
        CREATED = 'created', 'Комната создана'
        IN_PROGRESS = 'in_progress', 'Игра идет'
        FINISHED = 'finished', 'Игра закончена'

    code = models.CharField(max_length=6, unique=True, default=generate_room_code)

    # Статус комнаты
    status = models.CharField(
        max_length=20,
        choices=RoomStatus.choices,
        default=RoomStatus.CREATED
    )

    # ID хозяина комнаты
    host = models.CharField(max_length=100)

    # Количество игроков в комнате
    players_count = models.IntegerField(default=0)

    # Текущий игрок
    current_player = models.ForeignKey(
        'Player',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='current_turn_room'
    )

    crusade_points = models.IntegerField(default=0)

    count_relics = models.IntegerField(default=3)

    def __str__(self):
        return (
            f"Room {self.id}: [code = {self.code}; "
            f"is_active = {self.status}; "
            f"host_id = {self.host}; "
            f"players_count = {self.players_count}; "
             f"current_player = {self.current_player.name if self.current_player else 'None'}]"
        )
    
class Player(models.Model):
    class PlayerStatus(models.TextChoices):
        WAITING = 'waiting', 'Ожидание хода'
        SET = 'set_cards', 'Набор карт'
        PLAYING = 'playing_cards', 'Розыгрыш карт'
    # Имя пользователя
    name = models.CharField(max_length=100)

    # Связь с комнатой
    room = models.ForeignKey(Room, related_name='players', on_delete=models.CASCADE)

    session_key = models.CharField(max_length=40, null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=PlayerStatus.choices,
        default=PlayerStatus.WAITING
    )

    # Очки крестового похода
    crusade_points = models.IntegerField(default=0)

    # Победные очки 
    victory_points = models.IntegerField(default=0)

    city_name = models.CharField(max_length=100)

    hand = models.ManyToManyField(DeckCardEntry, blank=True, related_name='in_hand_of_players')

    played_cards = models.ManyToManyField(DeckCardEntry, blank=True, related_name='played_in_city_of_players')

    count_relics = models.IntegerField(default=0)

    def __str__(self):
        return(
            f"Player {self.id} '{self.name}': [room = {self.room.code}; "
            f"session_key = {self.session_key}; "
            f"status = {self.status}; "
            f"crusade_points = {self.crusade_points}; "
            f"victory_points = {self.victory_points}; "
            f"city_name = {self.city_name}]"
        )

