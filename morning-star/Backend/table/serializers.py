from rest_framework import serializers
from .models import GameSession, Scene, SessionPlayer

class SceneSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Scene
        fields = ['id', 'name', 'tokens', 'map_image', 'order', 'is_visible']

class SessionPlayerSerializer(serializers.ModelSerializer):
    user_id          = serializers.IntegerField(source='user.id', read_only=True)
    username         = serializers.CharField(source='user.username', read_only=True)
    character_id     = serializers.IntegerField(source='character.id', read_only=True, allow_null=True, default=None)
    character_name   = serializers.CharField(source='character.name', read_only=True, allow_null=True, default=None)
    character_avatar = serializers.SerializerMethodField()
    hp_current       = serializers.IntegerField(source='character.hp_current', read_only=True, allow_null=True, default=None)
    hp_max           = serializers.IntegerField(source='character.hp_max', read_only=True, allow_null=True, default=None)

    class Meta:
        model  = SessionPlayer
        fields = ['id', 'user_id', 'username', 'character_id', 'character_name',
                  'character_avatar', 'hp_current', 'hp_max']

    def get_character_avatar(self, obj):
        if not (obj.character and obj.character.avatar):
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.character.avatar.url)
        return obj.character.avatar.url


class GameSessionSerializer(serializers.ModelSerializer):
    scenes       = SceneSerializer(many=True, read_only=True)
    active_scene = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model  = GameSession
        fields = ['id', 'code', 'name', 'master', 'players',
                  'is_active', 'created_at', 'active_scene', 'scenes']
        read_only_fields = ['master', 'code', 'players', 'is_active', 'created_at']
