from rest_framework import serializers
from .models import World, Folder, Card, DnDSheet, WikiSettings


class DnDSheetSerializer(serializers.ModelSerializer):
    class Meta:
        model = DnDSheet
        exclude = ["card"]


class CardSerializer(serializers.ModelSerializer):
    dnd_sheet = DnDSheetSerializer(read_only=True)

    class Meta:
        model = Card
        fields = [
            "id",
            "world",
            "folder",
            "card_type",
            "name",
            "description",
            "image",
            "order",
            "is_visible_in_wiki",
            "created_at",
            "updated_at",
            "dnd_sheet",
        ]
        read_only_fields = ["world", "created_at", "updated_at", "dnd_sheet"]


class CardListSerializer(serializers.ModelSerializer):
    """Легкий серіалізатор для списків — без dnd_sheet."""

    class Meta:
        model = Card
        fields = [
            "id",
            "folder",
            "card_type",
            "name",
            "image",
            "order",
            "is_visible_in_wiki",
        ]


class FolderSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    cards = CardListSerializer(many=True, read_only=True)

    class Meta:
        model = Folder
        fields = ["id", "world", "parent", "name", "order", "children", "cards"]

    def get_children(self, obj):
        return FolderSerializer(obj.children.all(), many=True).data


class FolderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Folder
        fields = ["id", "world", "parent", "name", "order"]
        read_only_fields = ["world"]


class WorldSerializer(serializers.ModelSerializer):
    class Meta:
        model = World
        fields = [
            "id",
            "name",
            "description",
            "cover_image",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class WorldDetailSerializer(serializers.ModelSerializer):
    """Повний серіалізатор світу — з деревом папок і карточками без папки."""

    folders = serializers.SerializerMethodField()
    loose_cards = serializers.SerializerMethodField()

    class Meta:
        model = World
        fields = [
            "id",
            "name",
            "description",
            "cover_image",
            "created_at",
            "updated_at",
            "folders",
            "loose_cards",
        ]

    def get_folders(self, obj):
        # Тільки кореневі папки — вкладені підтягуються рекурсивно через FolderSerializer
        root_folders = obj.folders.filter(parent=None)
        return FolderSerializer(root_folders, many=True).data

    def get_loose_cards(self, obj):
        # Карточки які не в жодній папці
        return CardListSerializer(obj.cards.filter(folder=None), many=True).data


class WikiSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = WikiSettings
        fields = [
            "id",
            "game_session",
            "world",
            "is_enabled",
            "visible_folders",
            "visible_cards",
        ]


# --- Серіалізатор для публічного вікі (тільки дозволений контент) ---

class WikiCardSerializer(serializers.ModelSerializer):
    dnd_sheet = DnDSheetSerializer(read_only=True)

    class Meta:
        model = Card
        fields = [
            "id",
            "card_type",
            "name",
            "description",
            "image",
            "dnd_sheet",
        ]


class WikiFolderSerializer(serializers.ModelSerializer):
    cards = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()

    class Meta:
        model = Folder
        fields = ["id", "name", "order", "cards", "children"]

    def get_cards(self, obj):
        visible_card_ids = self.context.get("visible_card_ids", set())
        cards = obj.cards.filter(id__in=visible_card_ids)
        return WikiCardSerializer(cards, many=True).data

    def get_children(self, obj):
        return WikiFolderSerializer(obj.children.all(), many=True, context=self.context).data