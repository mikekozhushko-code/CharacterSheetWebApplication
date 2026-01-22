from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Profile

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password1 = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ("username", "email", "password1", "password2", "is_player", "is_dm")

    def validate(self, attrs):
        if attrs["password1"] != attrs["password2"]:
            raise serializers.ValidationError({"password1": "Password not equal"})
        if User.objects.filter(username=attrs["username"]).exists():
            raise serializers.ValidationError({"username": "This username is already taken"})
        if User.objects.filter(email=attrs["email"]).exists():
            raise serializers.ValidationError({"email": "This email is already taken"})
        return attrs

    def create(self, validate_data):
        validate_data.pop("password2")
        user = User.objects.create_user(
            username=validate_data["username"],
            email=validate_data["email"],
            password=validate_data["password1"],
            is_player=validate_data.get("is_player", True),
            is_dm=validate_data.get("is_dm", False),
        )
        Profile.objects.create(user=user)
        return user

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ("bio", "avatar", "created_at")

