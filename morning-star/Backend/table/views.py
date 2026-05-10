import os
import uuid
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.shortcuts import get_object_or_404
from django.conf import settings
from .models import GameSession, Scene
from .serializers import GameSessionSerializer, SceneSerializer

class CreateSessionView(generics.CreateAPIView):
    serializer_class   = GameSessionSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        session = serializer.save(master=self.request.user)
        # Автоматично створюємо першу сцену
        first_scene = Scene.objects.create(
            session=session,
            name='Сцена 1',
            order=0,
            is_visible=True,
        )
        session.active_scene = first_scene
        session.save()

class JoinSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get('code', '').upper()
        try:
            session = GameSession.objects.get(code=code, is_active=True)
            session.players.add(request.user)
            return Response(GameSessionSerializer(session).data)
        except GameSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

class SessionDetailView(generics.RetrieveAPIView):
    serializer_class   = GameSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return get_object_or_404(
            GameSession.objects.prefetch_related('scenes'),
            code=self.kwargs['code']
        )

class SceneListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, code):
        session = get_object_or_404(GameSession, code=code)
        if session.master != request.user:
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        order = session.scenes.count()
        scene = Scene.objects.create(
            session=session,
            name=request.data.get('name', f'Сцена {order + 1}'),
            order=order,
        )
        return Response(SceneSerializer(scene).data, status=status.HTTP_201_CREATED)

class SceneDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, code, scene_id):
        session = get_object_or_404(GameSession, code=code)
        if session.master != request.user:
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        Scene.objects.filter(id=scene_id, session=session).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, code, scene_id):
        session = get_object_or_404(GameSession, code=code)
        if session.master != request.user:
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        scene = get_object_or_404(Scene, id=scene_id, session=session)
        serializer = SceneSerializer(scene, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TableImageUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser]
    MAX_MB             = 5
    ALLOWED_TYPES      = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}

    def post(self, request):
        file = request.FILES.get('image')
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        if file.content_type not in self.ALLOWED_TYPES:
            return Response({'error': 'Invalid file type'}, status=status.HTTP_400_BAD_REQUEST)
        if file.size > self.MAX_MB * 1024 * 1024:
            return Response({'error': f'File too large (max {self.MAX_MB}MB)'}, status=status.HTTP_400_BAD_REQUEST)

        ext  = os.path.splitext(file.name)[1].lower()
        name = f'{uuid.uuid4().hex}{ext}'
        path = default_storage.save(f'table_images/{name}', ContentFile(file.read()))
        url  = request.build_absolute_uri(settings.MEDIA_URL + path)
        return Response({'url': url}, status=status.HTTP_201_CREATED)


class MySessionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        master_sessions = GameSession.objects.filter(
            master=request.user
        ).prefetch_related('scenes').order_by('-created_at')

        joined_sessions = GameSession.objects.filter(
            players=request.user
        ).prefetch_related('scenes').order_by('-created_at')

        return Response({
            'master': GameSessionSerializer(master_sessions, many=True).data,
            'joined': GameSessionSerializer(joined_sessions, many=True).data,
        })

    def delete(self, request, pk=None):
        try:
            session = GameSession.objects.get(pk=pk, master=request.user)
            session.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except GameSession.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)