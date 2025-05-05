# This module contains unit tests for the user-related serializers.
# It tests the UserSerializer to ensure correct behaviour, including 
# password hashing during user creation.

from django.test import TestCase
from users.serializers import UserSerializer

class UserSerializerTest(TestCase):
    def test_create_user_hashes_password(self):
        data = {"username": "newuser", "email": "a@example.com", "password": "plainpass"}
        serializer = UserSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertNotEqual(user.password, "plainpass")
        self.assertTrue(user.check_password("plainpass"))
