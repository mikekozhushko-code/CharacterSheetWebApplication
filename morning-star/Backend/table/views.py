from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import GameSession
from .serializers import GameSessionSerializer

class CreateSessionView(generics.CreateAPIView):
    serializer_class   = GameSessionSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(master=self.request.user)

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
        code = self.kwargs['code']
        return GameSession.objects.get(code=code)