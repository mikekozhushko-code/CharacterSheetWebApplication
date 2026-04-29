from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import World, Folder, Card, CardBlock, DnDSheet, WikiSettings
from .serializers import (
    WorldSerializer, WorldDetailSerializer,
    FolderSerializer, FolderCreateSerializer,
    CardSerializer, CardListSerializer,
    CardBlockSerializer,
    DnDSheetSerializer,
    WikiSettingsSerializer,
    WikiCardSerializer, WikiFolderSerializer,
)


# ── World ─────────────────────────────────────────────────────────────────────

class WorldListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorldSerializer

    def get_queryset(self):
        return World.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class WorldDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorldDetailSerializer

    def get_queryset(self):
        return World.objects.filter(owner=self.request.user)


# ── Folder ────────────────────────────────────────────────────────────────────

class FolderListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return FolderSerializer if self.request.method == "GET" else FolderCreateSerializer

    def get_queryset(self):
        world = get_object_or_404(World, id=self.kwargs["world_id"], owner=self.request.user)
        return Folder.objects.filter(world=world, parent=None)

    def perform_create(self, serializer):
        world = get_object_or_404(World, id=self.kwargs["world_id"], owner=self.request.user)
        serializer.save(world=world)


class FolderDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return FolderSerializer if self.request.method == "GET" else FolderCreateSerializer

    def get_queryset(self):
        world = get_object_or_404(World, id=self.kwargs["world_id"], owner=self.request.user)
        return Folder.objects.filter(world=world)


# ── Card ──────────────────────────────────────────────────────────────────────

class CardListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return CardListSerializer if self.request.method == "GET" else CardSerializer

    def get_queryset(self):
        world = get_object_or_404(World, id=self.kwargs["world_id"], owner=self.request.user)
        qs = Card.objects.filter(world=world)
        card_type = self.request.query_params.get("type")
        if card_type:
            qs = qs.filter(card_type=card_type)
        folder_id = self.request.query_params.get("folder")
        if folder_id == "null":
            qs = qs.filter(folder=None)
        elif folder_id:
            qs = qs.filter(folder_id=folder_id)
        return qs

    def perform_create(self, serializer):
        world = get_object_or_404(World, id=self.kwargs["world_id"], owner=self.request.user)
        serializer.save(world=world)


class CardDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CardSerializer

    def get_queryset(self):
        world = get_object_or_404(World, id=self.kwargs["world_id"], owner=self.request.user)
        return Card.objects.filter(world=world)


# ── CardBlock ─────────────────────────────────────────────────────────────────

class CardBlockListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CardBlockSerializer

    def get_queryset(self):
        world = get_object_or_404(World, id=self.kwargs["world_id"], owner=self.request.user)
        card  = get_object_or_404(Card, id=self.kwargs["card_id"], world=world)
        return CardBlock.objects.filter(card=card)

    def perform_create(self, serializer):
        world = get_object_or_404(World, id=self.kwargs["world_id"], owner=self.request.user)
        card  = get_object_or_404(Card, id=self.kwargs["card_id"], world=world)
        last_order = CardBlock.objects.filter(card=card).count()
        serializer.save(card=card, order=last_order)


class CardBlockDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CardBlockSerializer

    def get_object(self):
        world = get_object_or_404(World, id=self.kwargs["world_id"], owner=self.request.user)
        card  = get_object_or_404(Card, id=self.kwargs["card_id"], world=world)
        return get_object_or_404(CardBlock, id=self.kwargs["pk"], card=card)


# ── DnD Sheet ─────────────────────────────────────────────────────────────────

class DnDSheetDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DnDSheetSerializer

    def get_object(self):
        world = get_object_or_404(World, id=self.kwargs["world_id"], owner=self.request.user)
        card  = get_object_or_404(Card, id=self.kwargs["card_id"], world=world,
                                  card_type=Card.CardType.CHARACTER)
        return get_object_or_404(DnDSheet, card=card)


# ── Wiki Settings ─────────────────────────────────────────────────────────────

class WikiSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        wiki = get_object_or_404(
            WikiSettings,
            game_session_id=session_id,
            game_session__master=request.user,
        )
        return Response(WikiSettingsSerializer(wiki).data)

    def post(self, request, session_id):
        from table.models import GameSession
        session = get_object_or_404(GameSession, id=session_id, master=request.user)
        wiki, created = WikiSettings.objects.get_or_create(game_session=session)
        serializer = WikiSettingsSerializer(wiki, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data,
                            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Public Wiki ───────────────────────────────────────────────────────────────

class PublicWikiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        from table.models import GameSession
        session = get_object_or_404(GameSession, id=session_id)

        is_master = session.master == request.user
        is_player = session.players.filter(id=request.user.id).exists()
        if not (is_master or is_player):
            return Response({"error": "Немає доступу"}, status=status.HTTP_403_FORBIDDEN)

        wiki = get_object_or_404(WikiSettings, game_session=session)
        if not wiki.is_enabled:
            return Response({"error": "Вікі вимкнено"}, status=status.HTTP_404_NOT_FOUND)
        if not wiki.world:
            return Response({"error": "Світ не підключено"}, status=status.HTTP_404_NOT_FOUND)

        world = wiki.world
        has_explicit = wiki.visible_cards.exists() or wiki.visible_folders.exists()

        if has_explicit:
            visible_card_ids = set(wiki.visible_cards.values_list("id", flat=True))
            for folder in wiki.visible_folders.all():
                visible_card_ids.update(folder.cards.values_list("id", flat=True))
            visible_folder_ids = set(wiki.visible_folders.values_list("id", flat=True))
            root_folders = world.folders.filter(parent=None, id__in=visible_folder_ids)
        else:
            visible_card_ids = set(
                world.cards.filter(is_visible_in_wiki=True).values_list("id", flat=True)
            )
            folders_with_cards = set(
                world.cards.filter(is_visible_in_wiki=True, folder__isnull=False)
                           .values_list("folder_id", flat=True)
            )
            root_folders = world.folders.filter(parent=None, id__in=folders_with_cards)

        loose_cards = world.cards.filter(folder=None, id__in=visible_card_ids)
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