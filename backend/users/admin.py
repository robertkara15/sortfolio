from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin  # ✅ Import Django's built-in UserAdmin

# ✅ Only register if it's not already registered
if not admin.site.is_registered(User):
    admin.site.register(User, UserAdmin)
