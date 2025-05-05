# This module defines serializers for user-related data.
# It includes the UserSerializer, which handles serialisation and deserialisation
# of User model instances, including password hashing during user creation.

from django.contrib.auth.models import User
from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)  # Hashes password
        return user
