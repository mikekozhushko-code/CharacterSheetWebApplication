from rest_framework import serializers
from .models import GameSession, Scene

class SceneSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Scene
        fields = ['id', 'name', 'tokens', 'map_image', 'order', 'is_visible']

class GameSessionSerializer(serializers.ModelSerializer):
    scenes       = SceneSerializer(many=True, read_only=True)
    active_scene = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model  = GameSession
        fields = ['id', 'code', 'name', 'master', 'players',
                  'is_active', 'created_at', 'active_scene', 'scenes']
        read_only_fields = ['master', 'code', 'players', 'is_active', 'created_at']
