from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Character
from .serializers import CharacterSerializer
from datetime import timedelta
from django.utils import timezone
from rest_framework.views import APIView
from .models import ShareToken


# Create your views here.
class CharacterCreateView(generics.CreateAPIView):
    serializer_class = CharacterSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        if Character.objects.filter(owner=user).count() >= 12:
            raise ValueError("To much character")
        serializer.save(owner=user)

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class CharacterListView(generics.ListAPIView):
    serializer_class = CharacterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Character.objects.filter(owner=self.request.user)

class CharacterDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = CharacterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Character.objects.filter(owner=self.request.user)

class ShareTokenCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        character = Character.objects.filter(pk=pk, owner=request.user).first()
        if not character:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        permission = request.data.get('permission', 'view')
        duration   = request.data.get('duration', '24h')

        # Map duration string to timedelta
        duration_map = {
            '1h':  timedelta(hours=1),
            '24h': timedelta(hours=24),
            '7d':  timedelta(days=7),
            '30d': timedelta(days=30),
        }
        delta = duration_map.get(duration, timedelta(hours=24))

        token = ShareToken.objects.create(
            character  = character,
            permission = permission,
            expires_at = timezone.now() + delta,
        )

        return Response({
            "token":      str(token.token),
            "permission": token.permission,
            "expires_at": token.expires_at,
            "url":        f"/shared/{token.token}/",
        }, status=status.HTTP_201_CREATED)


class SharedCharacterView(APIView):
    permission_classes = []  # Public — no auth required

    def get(self, request, token):
        share = ShareToken.objects.filter(token=token).select_related('character').first()

        if not share:
            return Response({"error": "Invalid link"}, status=status.HTTP_404_NOT_FOUND)
        if share.is_expired():
            return Response({"error": "Link expired"}, status=status.HTTP_410_GONE)

        serializer = CharacterSerializer(share.character)
        return Response({
            "character":  serializer.data,
            "permission": share.permission,
        })

    def patch(self, request, token):
        share = ShareToken.objects.filter(token=token).select_related('character').first()

        if not share:
            return Response({"error": "Invalid link"}, status=status.HTTP_404_NOT_FOUND)
        if share.is_expired():
            return Response({"error": "Link expired"}, status=status.HTTP_410_GONE)
        if share.permission != 'edit':
            return Response({"error": "Read only"}, status=status.HTTP_403_FORBIDDEN)

        serializer = CharacterSerializer(share.character, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)