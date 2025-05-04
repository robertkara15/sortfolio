from django.test import TestCase
from django.contrib.auth.models import User
from users.models import Profile

class ProfileModelTest(TestCase):
    def test_profile_creation_and_str(self):
        user = User.objects.create_user(username="tester", password="test123")
        profile = Profile.objects.create(user=user)
        self.assertEqual(str(profile), "tester")
