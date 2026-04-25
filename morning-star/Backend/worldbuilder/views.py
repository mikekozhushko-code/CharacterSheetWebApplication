from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404

from .models import World, Folder, Card, DnDSheet, WikiSettings
from .serializers import (
    WorldSerializer,
    WorldDetailSerializer,
    FolderSerializer,
    FolderCreateSerializer,
    CardSerializer,
    CardListSerializer,
    DnDSheetSerializer,
    WikiSettingsSerializer,
    WikiCardSerializer,
    WikiFolderSerializer,
)


# ─────────────────────────────────────────
# World
# ─────────────────────────────────────────

class WorldListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return WorldSerializer

    def get_queryset(self):
        return World.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class WorldDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorldDetailSerializer

    def get_queryset(self):
        return World.objects.filter(owner=self.request.user)


# ─────────────────────────────────────────
# Folder
# ─────────────────────────────────────────

class FolderListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return FolderSerializer
        return FolderCreateSerializer

    def get_queryset(self):
        world_id = self.kwargs["world_id"]
        # Перевіряємо що світ належить юзеру
        world = get_object_or_404(World, id=world_id, owner=self.request.user)
        return Folder.objects.filter(world=world, parent=None)

    def perform_create(self, serializer):
        world_id = self.kwargs["world_id"]
        world = get_object_or_404(World, id=world_id, owner=self.request.user)
        serializer.save(world=world)


class FolderDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return FolderSerializer
        return FolderCreateSerializer

    def get_queryset(self):
        world_id = self.kwargs["world_id"]
        world = get_object_or_404(World, id=world_id, owner=self.request.user)
        return Folder.objects.filter(world=world)


# ─────────────────────────────────────────
# Card
# ─────────────────────────────────────────

class CardListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return CardListSerializer
        return CardSerializer

    def get_queryset(self):
        world_id = self.kwargs["world_id"]
        world = get_object_or_404(World, id=world_id, owner=self.request.user)
        queryset = Card.objects.filter(world=world)

        # Фільтр по типу карточки
        card_type = self.request.query_params.get("type")
        if card_type:
            queryset = queryset.filter(card_type=card_type)

        # Фільтр по папці
        folder_id = self.request.query_params.get("folder")
        if folder_id == "null":
            queryset = queryset.filter(folder=None)
        elif folder_id:
            queryset = queryset.filter(folder_id=folder_id)

        return queryset

    def perform_create(self, serializer):
        world_id = self.kwargs["world_id"]
        world = get_object_or_404(World, id=world_id, owner=self.request.user)
        serializer.save(world=world)


class CardDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CardSerializer

    def get_queryset(self):
        world_id = self.kwargs["world_id"]
        world = get_object_or_404(World, id=world_id, owner=self.request.user)
        return Card.objects.filter(world=world)


# ─────────────────────────────────────────
# DnD Sheet
# ─────────────────────────────────────────

class DnDSheetDetailView(generics.RetrieveUpdateAPIView):
    """Отримати або оновити DnD бланк конкретної карточки."""
    permission_classes = [IsAuthenticated]
    serializer_class = DnDSheetSerializer

    def get_object(self):
        world_id = self.kwargs["world_id"]
        card_id = self.kwargs["card_id"]
        world = get_object_or_404(World, id=world_id, owner=self.request.user)
        card = get_object_or_404(Card, id=card_id, world=world, card_type=Card.CardType.CHARACTER)
        return get_object_or_404(DnDSheet, card=card)


# ─────────────────────────────────────────
# Wiki Settings
# ─────────────────────────────────────────

class WikiSettingsView(APIView):
    """Отримати або створити/оновити налаштування вікі для ігрового столу."""
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        wiki = get_object_or_404(
            WikiSettings,
            game_session_id=session_id,
            game_session__master=request.user,
        )
        serializer = WikiSettingsSerializer(wiki)
        return Response(serializer.data)

    def post(self, request, session_id):
        # Перевіряємо що юзер є майстром цього столу
        from table.models import GameSession
        session = get_object_or_404(GameSession, id=session_id, master=request.user)

        wiki, created = WikiSettings.objects.get_or_create(game_session=session)
        serializer = WikiSettingsSerializer(wiki, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
            return Response(serializer.data, status=status_code)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────
# Public Wiki (для гравців)
# ─────────────────────────────────────────
class PublicWikiView(APIView):
    """Публічне вікі — доступне гравцям які є в сесії."""
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        from table.models import GameSession
        session = get_object_or_404(GameSession, id=session_id)

        # Доступ мають майстер і гравці сесії
        is_master = session.master == request.user
        is_player = session.players.filter(id=request.user.id).exists()

        if not (is_master or is_player):
            return Response(
                {"error": "Немає доступу до цієї сесії"},
                status=status.HTTP_403_FORBIDDEN,
            )

        wiki = get_object_or_404(WikiSettings, game_session=session)

        if not wiki.is_enabled:
            return Response(
                {"error": "Вікі для цієї сесії вимкнено"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not wiki.world:
            return Response(
                {"error": "До сесії не прив'язано жодного світу"},
                status=status.HTTP_404_NOT_FOUND,
            )

        world = wiki.world

        # ── Збираємо visible_card_ids ────────────────────────────────────────
        has_explicit_settings = (
            wiki.visible_cards.exists() or wiki.visible_folders.exists()
        )

        if has_explicit_settings:
            # Майстер вручну вибрав конкретні карточки/папки
            visible_card_ids = set(
                wiki.visible_cards.values_list("id", flat=True)
            )
            for folder in wiki.visible_folders.all():
                visible_card_ids.update(
                    folder.cards.values_list("id", flat=True)
                )
        else:
            # Явних налаштувань немає — показуємо всі карточки
            # які майстер позначив як is_visible_in_wiki=True
            visible_card_ids = set(
                world.cards.filter(is_visible_in_wiki=True).values_list("id", flat=True)
            )

        # ── Папки ────────────────────────────────────────────────────────────
        if has_explicit_settings:
            visible_folder_ids = set(
                wiki.visible_folders.values_list("id", flat=True)
            )
            root_folders = world.folders.filter(
                parent=None, id__in=visible_folder_ids
            )
        else:
            # Показуємо папки в яких є хоча б одна видима карточка
            folders_with_visible_cards = set(
                world.cards.filter(
                    is_visible_in_wiki=True, folder__isnull=False
                ).values_list("folder_id", flat=True)
            )
            root_folders = world.folders.filter(
                parent=None, id__in=folders_with_visible_cards
            )

        # ── Карточки без папки ───────────────────────────────────────────────
        loose_cards = world.cards.filter(
            folder=None, id__in=visible_card_ids
        )

        context = {"visible_card_ids": visible_card_ids}

        return Response({
            "world": {
                "id": world.id,
                "name": world.name,
                "description": world.description,
                "cover_image": request.build_absolute_uri(world.cover_image.url)
                if world.cover_image else None,
            },
            "folders": WikiFolderSerializer(root_folders, many=True, context=context).data,
            "loose_cards": WikiCardSerializer(loose_cards, many=True).data,
        })