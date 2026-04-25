from django.urls import path
from .views import (
    WorldListCreateView,
    WorldDetailView,
    FolderListCreateView,
    FolderDetailView,
    CardListCreateView,
    CardDetailView,
    DnDSheetDetailView,
    WikiSettingsView,
    PublicWikiView,
)

urlpatterns = [
    # ── Worlds ──────────────────────────────────────────
    path("worlds/", WorldListCreateView.as_view(), name="world-list"),
    path("worlds/<int:pk>/", WorldDetailView.as_view(), name="world-detail"),

    # ── Folders ─────────────────────────────────────────
    path("worlds/<int:world_id>/folders/", FolderListCreateView.as_view(), name="folder-list"),
    path("worlds/<int:world_id>/folders/<int:pk>/", FolderDetailView.as_view(), name="folder-detail"),

    # ── Cards ────────────────────────────────────────────
    path("worlds/<int:world_id>/cards/", CardListCreateView.as_view(), name="card-list"),
    path("worlds/<int:world_id>/cards/<int:pk>/", CardDetailView.as_view(), name="card-detail"),

    # ── DnD Sheet ────────────────────────────────────────
    path("worlds/<int:world_id>/cards/<int:card_id>/sheet/", DnDSheetDetailView.as_view(), name="dnd-sheet"),

    # ── Wiki Settings (майстер) ──────────────────────────
    path("sessions/<int:session_id>/wiki/", WikiSettingsView.as_view(), name="wiki-settings"),

    # ── Public Wiki (гравці) ─────────────────────────────
    path("sessions/<int:session_id>/wiki/view/", PublicWikiView.as_view(), name="wiki-public"),
]