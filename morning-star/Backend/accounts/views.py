from django.shortcuts import render
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, ProfileSerializer

User = get_user_model()

# Create your views here.
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.profile

class CheckUniqueView(APIView):
    def get(self, request):
        username = request.query_params.get("username")
        email = request.query_params.get("email")

        if username and User.objects.filter(username=username).exists():
            return Response({"username": "This username is already taken"}, status=400)

        if email and User.objects.filter(email=email).exists():
            return Response({"email": "This email is already taken"}, status=400)

        return Response({"ok": True})
            
