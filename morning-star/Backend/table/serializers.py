from rest_framework import serializers
from .models import GameSession

class GameSessionSerializer(serializers.ModelSerializer):
    master_username = serializers.CharField(source='master.username', read_only=True)

    class Meta:
        model  = GameSession
        fields = ('id', 'code', 'name', 'master', 'master_username', 'tokens', 'map_image', 'is_active', 'created_at')
        read_only_fields = ('code', 'master', 'created_at')