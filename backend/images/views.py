from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated 
from rest_framework import status, permissions  

from .models import UploadedImage
from .serializers import UploadedImageSerializer
from django.conf import settings



class AddTagsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tags_data = request.data.get("tags", {})
        for image_name, tags in tags_data.items():
            image = UploadedImage.objects.filter(image__contains=image_name, user=request.user).first()
            if image:
                image.tags = tags
                image.save()
        return Response({"message": "Tags updated successfully!"})


class ImageUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [permissions.IsAuthenticated]  # Require login

    def post(self, request, *args, **kwargs):
        data = request.data.copy()
        data['user'] = request.user.id  # Assign the logged-in user

        file_serializer = UploadedImageSerializer(data=data)

        if file_serializer.is_valid():
            file_serializer.save(user=request.user)  # Ensure user is assigned
            return Response({"message": "Image uploaded successfully", "data": file_serializer.data}, status=status.HTTP_201_CREATED)
        
        return Response(file_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserImagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user_images = UploadedImage.objects.filter(user=request.user)  # Fetch user images
            
            image_data = [
                {
                    "id": image.id,
                    "image_url": request.build_absolute_uri(settings.MEDIA_URL + str(image.image)),  # Full URL
                    "tags": image.tags,  # Ensure this field exists in models.py
                }
                for image in user_images
            ]
            return Response(image_data)

        except Exception as e:
            return Response({"error": str(e)}, status=500) 