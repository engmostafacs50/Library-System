from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User
 
 
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
 
    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "role", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]
 
    def validate(self, data):
        if User.objects.filter(email=data.get("email", "")).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})
        return data
 
    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            password=validated_data["password"],
            role=validated_data.get("role", "USER"),
        )
 
 
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
 
    def validate(self, data):
        user = authenticate(username=data["email"], password=data["password"])
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account is inactive.")
        data["user"] = user
        return data
 