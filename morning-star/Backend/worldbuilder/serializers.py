from rest_framework import serializers
from .models import World, Folder, Card, CardBlock, DnDSheet, WikiSettings


class CardBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = CardBlock
        fields = ["id", "title", "content", "is_visible_in_wiki", "order",
                  "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]


class DnDSheetSerializer(serializers.ModelSerializer):
    class Meta:
        model = DnDSheet
        exclude = ["card"]


class CardSerializer(serializers.ModelSerializer):
    dnd_sheet = DnDSheetSerializer(read_only=True)
    blocks = CardBlockSerializer(many=True, read_only=True)

    class Meta:
        model = Card
        fields = [
            "id", "world", "folder", "card_type", "name", "description",
            "image", "order", "is_visible_in_wiki",
            "created_at", "updated_at", "dnd_sheet", "blocks",
        ]
        read_only_fields = ["world", "created_at", "updated_at", "dnd_sheet", "blocks"]


class CardListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = ["id", "folder", "card_type", "name", "image",
                  "order", "is_visible_in_wiki"]


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
        fields = ["id", "name", "description", "cover_image",
                  "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]


class WorldDetailSerializer(serializers.ModelSerializer):
    folders = serializers.SerializerMethodField()
    loose_cards = serializers.SerializerMethodField()

    class Meta:
        model = World
        fields = ["id", "name", "description", "cover_image",
                  "created_at", "updated_at", "folders", "loose_cards"]

    def get_folders(self, obj):
        return FolderSerializer(obj.folders.filter(parent=None), many=True).data

    def get_loose_cards(self, obj):
        return CardListSerializer(obj.cards.filter(folder=None), many=True).data


class WikiSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = WikiSettings
        fields = ["id", "game_session", "world", "is_enabled",
                  "visible_folders", "visible_cards"]


class WikiBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = CardBlock
        fields = ["id", "title", "content", "order"]


class WikiCardSerializer(serializers.ModelSerializer):
    dnd_sheet = DnDSheetSerializer(read_only=True)
    blocks = serializers.SerializerMethodField()

    class Meta:
        model = Card
        fields = ["id", "card_type", "name", "description", "image",
                  "dnd_sheet", "blocks"]

    def get_blocks(self, obj):
        return WikiBlockSerializer(
            obj.blocks.filter(is_visible_in_wiki=True), many=True
        ).data


class WikiFolderSerializer(serializers.ModelSerializer):
    cards = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()

    class Meta:
        model = Folder
        fields = ["id", "name", "order", "cards", "children"]

    def get_cards(self, obj):
        visible_card_ids = self.context.get("visible_card_ids", set())
        return WikiCardSerializer(
            obj.cards.filter(id__in=visible_card_ids), many=True
        ).data

    def get_children(self, obj):
        return WikiFolderSerializer(
            obj.children.all(), many=True, context=self.context
        ).data