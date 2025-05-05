# This module configures the Django admin interface for user-related models.
# It registers the User model and the Profile model to enable their management through the admin panel.

from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from .models import Profile

if not admin.site.is_registered(User):
    admin.site.register(User, UserAdmin)

admin.site.register(Profile)
