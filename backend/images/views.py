import os
import boto3
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .models import UploadedImage
from .serializers import UploadedImageSerializer
from .aws_rekognition import analyze_image  # Import AWS Rekognition

# AWS S3 client
s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION
)

class ImageUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        try:
            image_file = request.FILES.get("image")
            if not image_file:
                return Response({"error": "No image provided"}, status=400)

            # Define S3 path
            s3_key = f"user_{request.user.id}/uploads/{image_file.name}"
            s3_bucket = settings.AWS_STORAGE_BUCKET_NAME

            # Upload image to S3
            s3_client.upload_fileobj(image_file, s3_bucket, s3_key)

            # Analyze image with AWS Rekognition
            ai_tags = analyze_image(s3_bucket, s3_key)

            # Get user-provided tags
            user_tags = request.data.get("tags", "[]")
            user_tags = eval(user_tags) if isinstance(user_tags, str) else user_tags

            # Merge AI-generated and user tags (max 5)
            final_tags = list(set(ai_tags + user_tags))[:5]

            # Save image info to database
            uploaded_image = UploadedImage.objects.create(
                user=request.user,
                image=s3_key,  # Store S3 key instead of local path
                tags=final_tags
            )

            return Response({
                "message": "Image uploaded successfully",
                "data": {
                    "id": uploaded_image.id,
                    "image_url": f"https://{s3_bucket}.s3.amazonaws.com/{s3_key}",
                    "tags": final_tags
                },
            }, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=500)


class UserImagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user_images = UploadedImage.objects.filter(user=request.user)

            image_data = [
                {
                    "id": image.id,
                    "image_url": f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{image.image}",
                    "tags": image.tags,
                }
                for image in user_images
            ]
            return Response(image_data)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

class AddTagsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tags_data = request.data.get("tags", {})
        for image_name, tags in tags_data.items():
            image = UploadedImage.o
