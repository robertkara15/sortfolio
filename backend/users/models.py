# This module defines the database models for user-related data.
# It includes the Profile model, which extends the User model with additional fields
# such as a profile picture.

from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    profile_picture = models.ImageField(upload_to="profile_pictures/", blank=True, null=True)

    def __str__(self):
        return self.user.username
