from django.urls import path
from .views import CrossroadCardsView, TopCardView, UpdateCrossroad, EditGroupUniversalCard

urlpatterns = [
    path('deck/<str:room_code>/crossroad/', CrossroadCardsView.as_view(), name='crossroad'),
    path('deck/<str:room_code>/top/', TopCardView.as_view(), name='top-card-deck'),
    path('deck/<str:room_code>/update-crossroad/', UpdateCrossroad.as_view(), name='update-crossroad'),
    path('deck/<str:room_code>/edit-group/', EditGroupUniversalCard.as_view(), name='edit-group'),
]
