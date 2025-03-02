from django.shortcuts import render
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserSerializer
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from images.models import UploadedImage, Album
from django.shortcuts import get_object_or_404
from rest_framework import status
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from .models import Profile

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        """ Fetches profile details for any user, allowing 'me' for the logged-in user """
        if user_id == "me":
            user = request.user
        else:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({"error": "User not found"}, status=404)
            
        profile, _ = Profile.objects.get_or_create(user=user)

        profile_picture_url = None
        if profile.profile_picture:
            profile_picture_url = f"{request.build_absolute_uri(profile.profile_picture.url)}"

        profile_data = {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "image_count": UploadedImage.objects.filter(user=user).count(),
            "profile_picture": profile_picture_url,
        }
        return Response(profile_data, status=200)

class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data

        user.first_name = data.get("first_name", user.first_name)
        user.last_name = data.get("last_name", user.last_name)

        # Check if password update is requested
        if "old_password" in data and "password" in data and "confirm_password" in data:
            if not user.check_password(data["old_password"]):
                return Response({"error": "Incorrect old password."}, status=status.HTTP_400_BAD_REQUEST)

            if data["password"] != data["confirm_password"]:
                return Response({"error": "New passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(data["password"])

        user.save()
        return Response({"message": "Profile updated successfully"})


class UploadProfilePictureView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if "profile_picture" not in request.FILES:
            return Response({"error": "No profile picture provided"}, status=status.HTTP_400_BAD_REQUEST)

        profile_picture = request.FILES["profile_picture"]

        profile, _ = Profile.objects.get_or_create(user=user)

        # Save directly to S3
        file_path = f"profile_pictures/{user.username}.jpg"
        saved_path = default_storage.save(file_path, ContentFile(profile_picture.read()))

        # Update the profile picture URL
        profile.profile_picture = saved_path
        profile.save()

        # Generate Full S3 URL
        profile_picture_url = f"{request.build_absolute_uri(profile.profile_picture.url)}"

        return Response({"message": "Profile picture updated successfully", "profile_picture_url": profile_picture_url})

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User registered successfully"}, status=201)
        return Response(serializer.errors, status=400)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)

        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            })
        return Response({"error": "Invalid credentials"}, status=400)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
        })
    
class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user

        # Delete all user-related images
        UploadedImage.objects.filter(user=user).delete()

        # Delete all user-related albums
        Album.objects.filter(user=user).delete()

        # Delete the user account
        user.delete()

        return Response({"message": "Account deleted successfully"}, status=204)
