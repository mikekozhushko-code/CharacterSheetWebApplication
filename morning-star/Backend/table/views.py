from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
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
        return GameSession.objects.prefetch_related('scenes').get(
            code=self.kwargs['code']
        )

class SceneListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, code):
        session = GameSession.objects.get(code=code)
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
        session = GameSession.objects.get(code=code)
        if session.master != request.user:
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        Scene.objects.filter(id=scene_id, session=session).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, code, scene_id):
        session = GameSession.objects.get(code=code)
        if session.master != request.user:
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        scene = Scene.objects.get(id=scene_id, session=session)
        serializer = SceneSerializer(scene, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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