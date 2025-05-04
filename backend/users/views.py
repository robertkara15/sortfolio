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
import boto3
from rest_framework.parsers import MultiPartParser, FormParser
import json
import traceback

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        """ Fetches profile details for any user, allowing 'me' for the logged-in user """
        try:
            if user_id == "me":
                user = request.user
            else:
                user = get_object_or_404(User, id=user_id)
                
            profile, _ = Profile.objects.get_or_create(user=user)

            # Ensure profile picture URL is correctly formatted
            if profile.profile_picture:
                profile_picture_url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{profile.profile_picture}"
            else:
                profile_picture_url = None

            # Ensure all fields are UTF-8 safe
            profile_data = {
                "id": user.id,
                "username": user.username.encode("utf-8", "ignore").decode("utf-8"),
                "first_name": user.first_name.encode("utf-8", "ignore").decode("utf-8"),
                "last_name": user.last_name.encode("utf-8", "ignore").decode("utf-8"),
                "image_count": UploadedImage.objects.filter(user=user).count(),
                "profile_picture": profile_picture_url,
            }

            # Validate JSON serialization
            json.dumps(profile_data)

            return Response(profile_data, status=200)

        except Exception as e:
            traceback.print_exc()  # Print full error details to Django logs
            return Response({"error": f"Unexpected error: {str(e)}"}, status=500)


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
        try:
            user = request.user

            if "profile_picture" not in request.FILES:
                return Response({"error": "No profile picture provided"}, status=status.HTTP_400_BAD_REQUEST)

            profile_picture = request.FILES["profile_picture"]
            
            # Define S3 path
            s3_key = f"profile_pictures/{user.username}.jpg"
            s3_bucket = settings.AWS_STORAGE_BUCKET_NAME

            # Upload to S3
            s3_client = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION,
            )

            try:
                s3_client.upload_fileobj(profile_picture, s3_bucket, s3_key)
            except Exception as s3_error:
                print(f"S3 Upload Error: {s3_error}")
                return Response({"error": "Failed to upload profile picture to S3"}, status=500)

            # Update the profile picture URL in the database
            profile, _ = Profile.objects.get_or_create(user=user)
            profile.profile_picture = s3_key  # Store only the S3 path
            profile.save()

            profile_picture_url = f"https://{s3_bucket}.s3.amazonaws.com/{s3_key}"

            return Response({
                "message": "Profile picture updated successfully",
                "profile_picture_url": profile_picture_url,
            })

        except Exception as e:
            traceback.print_exc()
            return Response({"error": f"Unexpected error: {str(e)}"}, status=500)



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
