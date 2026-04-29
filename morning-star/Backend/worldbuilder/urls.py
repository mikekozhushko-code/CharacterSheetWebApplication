from django.urls import path
from .views import (
    WorldListCreateView, WorldDetailView,
    FolderListCreateView, FolderDetailView,
    CardListCreateView, CardDetailView,
    CardBlockListCreateView, CardBlockDetailView,
    DnDSheetDetailView,
    WikiSettingsView, PublicWikiView,
)

urlpatterns = [
    path("worlds/", WorldListCreateView.as_view()),
    path("worlds/<int:pk>/", WorldDetailView.as_view()),

    path("worlds/<int:world_id>/folders/", FolderListCreateView.as_view()),
    path("worlds/<int:world_id>/folders/<int:pk>/", FolderDetailView.as_view()),

    path("worlds/<int:world_id>/cards/", CardListCreateView.as_view()),
    path("worlds/<int:world_id>/cards/<int:pk>/", CardDetailView.as_view()),

    path("worlds/<int:world_id>/cards/<int:card_id>/blocks/",
         CardBlockListCreateView.as_view()),
    path("worlds/<int:world_id>/cards/<int:card_id>/blocks/<int:pk>/",
         CardBlockDetailView.as_view()),

    path("worlds/<int:world_id>/cards/<int:card_id>/sheet/",
         DnDSheetDetailView.as_view()),

    path("sessions/<int:session_id>/wiki/", WikiSettingsView.as_view()),
    path("sessions/<int:session_id>/wiki/view/", PublicWikiView.as_view()),
]