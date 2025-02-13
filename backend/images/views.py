from django.shortcuts import render

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status, permissions
from .models import UploadedImage
from .serializers import UploadedImageSerializer

class ImageUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [permissions.IsAuthenticated]  # Require login

    def post(self, request, *args, **kwargs):
        data = request.data.copy()
        data['user'] = request.user.id  # Assign the logged-in user

        file_serializer = UploadedImageSerializer(data=data)

        if file_serializer.is_valid():
            file_serializer.save(user=request.user)  # ✅ Ensure user is assigned
            return Response({"message": "Image uploaded successfully", "data": file_serializer.data}, status=status.HTTP_201_CREATED)
        
        return Response(file_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserImagesView(APIView):
    permission_classes = [permissions.IsAuthenticated]  # Only logged-in users can access

    def get(self, request):
        images = UploadedImage.objects.filter(user=request.user)  # Fetch only the logged-in user's images
        serializer = UploadedImageSerializer(images, many=True)
        return Response(serializer.data)
