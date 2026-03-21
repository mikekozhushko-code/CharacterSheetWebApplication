from django.urls import include, path
from .views import CharacterCreateView, CharacterListView, CharacterDetailView, ShareTokenCreateView, SharedCharacterView

urlpatterns = [
    path("characters/create/", CharacterCreateView.as_view(), name="character_create"),
    path("characters/", CharacterListView.as_view(), name="character_list"),
    path("character-info/<int:pk>/", CharacterDetailView.as_view(), name="character_info"),
    path("characters/<int:pk>/share/", ShareTokenCreateView.as_view(), name="character_share"),
    path("shared/<uuid:token>/", SharedCharacterView.as_view(), name="shared_character"),
]
