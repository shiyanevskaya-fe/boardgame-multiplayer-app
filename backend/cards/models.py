from django.db import models
from django.apps import apps

class Card(models.Model):
    name = models.CharField(max_length=100)
    group = models.CharField(max_length=50, choices=[
        ('court', 'Придворные'),
        ('priest', 'Священники'),
        ('peasant', 'Крестьяне'),
        ('universal', 'Любое сословие'),
        ('epidemic', 'Эпидемии'),
    ])
    victory_points = models.IntegerField()
    immunity = models.IntegerField(null=True, blank=True)
    crusade_points = models.IntegerField(default=0)
    description = models.TextField()
    quantity_in_deck = models.IntegerField(default=1)
    image_name = models.CharField(max_length=100)
    play_only_in_own_city = models.BooleanField(default=False)
    is_women = models.BooleanField(default=False)

    def __str__(self):
        return self.name
    
    def image_url(self):
        return f"/images/{self.image_name}.png"


class CardEpidemic(models.Model):
    name = models.CharField(max_length=100)
    death_count = models.PositiveIntegerField()
    effect = models.TextField()
    image_name = models.CharField(max_length=100)
    hotbed_image = models.CharField(max_length=100)

    def __str__(self):
        return self.name
    
    def image_url(self):
        return f"/images/{self.image_name}.png"
    
    def hotbed_image_url(self):
        return f"/images/{self.hotbed_image}.png"

class Deck(models.Model):
    room = models.OneToOneField('rooms.Room', on_delete=models.CASCADE, related_name='deck')

    def __str__(self):
        return f"Колода для комнаты {self.room.code}"
    
    
class DeckCardEntry(models.Model):
    deck = models.ForeignKey(Deck, on_delete=models.CASCADE, related_name='entries')
    card_type = models.CharField(max_length=20, choices=[('regular', 'Обычная'), ('epidemic', 'Эпидемия')])
    card_group_in_deck = models.CharField(max_length=20, choices=[
        ('court', 'Придворные'),
        ('priest', 'Священники'),
        ('peasant', 'Крестьяне'),
        ('universal', 'Любое сословие'),
        ('epidemic', 'Эпидемии'),])
    card_id = models.PositiveIntegerField()
    order = models.PositiveIntegerField()
    is_played = models.BooleanField(default=False)

    def get_id_card_in_deck(self):
        return self.id

    def get_card(self):
        if self.card_type == 'regular':
            return Card.objects.get(id=self.card_id)
        return CardEpidemic.objects.get(id=self.card_id)

    def __str__(self):
        return f"id= {self.id} {self.card_type} card #{self.card_id} (order {self.order}) is_played = {self.is_played}"
    
class Crossroad(models.Model):
    room = models.OneToOneField('rooms.Room', on_delete=models.CASCADE, related_name='crossroad')
    card1 = models.ForeignKey(DeckCardEntry, on_delete=models.SET_NULL, null=True, related_name='as_card1')
    card2 = models.ForeignKey(DeckCardEntry, on_delete=models.SET_NULL, null=True, related_name='as_card2')
    card3 = models.ForeignKey(DeckCardEntry, on_delete=models.SET_NULL, null=True, related_name='as_card3')

    def get_cards(self):
        return [self.card1, self.card2, self.card3]
    
class ActiveEpidemic(models.Model):
    epidemic_card = models.ForeignKey(CardEpidemic, on_delete=models.CASCADE)
    room = models.ForeignKey('rooms.Room', on_delete=models.CASCADE, related_name="active_epidemics")
    hotbed_city = models.ForeignKey('rooms.Player', on_delete=models.CASCADE, related_name="hotbed_city")
    current_city = models.ForeignKey('rooms.Player', on_delete=models.CASCADE, related_name="current_city")
    death_count = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.epidemic_card.name} in {self.current_city} (hotbed: {self.hotbed_city})"

    

