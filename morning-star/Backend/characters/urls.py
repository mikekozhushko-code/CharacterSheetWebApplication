from django.urls import include, path
from .views import CharacterCreateView

urlpatterns = [
    path("characters/create/", CharacterCreateView.as_view(), name="character_create"),
]
