# This module defines the API views for handling image-related operations.
# It includes endpoints for image uploads, album management, tag generation,
# analytics, and public exploration of images and albums.

import os
import boto3
from django.shortcuts import render
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from .models import UploadedImage, Album
from .serializers import UploadedImageSerializer, AlbumSerializer, UserSerializer
from .aws_rekognition import analyze_image 
from rest_framework import status
from django.db import models
from collections import Counter
from django.contrib.auth.models import User, AnonymousUser
from rest_framework.permissions import AllowAny
from rest_framework.generics import ListAPIView
from django.db.models import Q
from django.contrib.auth.models import User
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
from users.models import Profile 

# AWS Rekognition and S3 clients
# These clients are used for interacting with AWS services for image analysis and storage.

# Converting tags into vector embeddings
model = SentenceTransformer('all-MiniLM-L6-v2')

CSV_FILE_PATH = os.path.join(os.path.dirname(__file__), "AmazonRekognitionAllLabels.csv")

def load_rekognition_tags():
    try:
        df = pd.read_csv(CSV_FILE_PATH)
        return df.iloc[:, 0].dropna().unique().tolist()
    except Exception as e:
        print(f"Error loading Rekognition tags: {e}")
        return []

rekognition_tags = load_rekognition_tags()
rekognition_embeddings = {tag: model.encode(tag) for tag in rekognition_tags}

# AWS S3 client
s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION
)

# AWS Rekognition client
rekognition_client = boto3.client(
    "rekognition",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION
)

# Image upload and processing views
# These views handle image uploads, tag generation, and finalising uploads with user-selected tags.

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

            # Analyse image with AWS Rekognition (top 5 tags sorted by confidence)
            rekognition_response = rekognition_client.detect_labels(
                Image={"S3Object": {"Bucket": s3_bucket, "Name": s3_key}},
                MaxLabels=10
            )
            ai_tags = sorted(rekognition_response["Labels"], key=lambda x: x["Confidence"], reverse=True)[:5]
            top_tags = [label["Name"] for label in ai_tags]

            # Save image without tags (tags will be added when user confirms)
            uploaded_image = UploadedImage.objects.create(
                user=request.user,
                image=s3_key,
                tags=[],
                name=image_file.name
            )

            return Response({
                "message": "Image uploaded successfully",
                "data": {
                    "id": uploaded_image.id,
                    "image_url": f"https://{s3_bucket}.s3.amazonaws.com/{s3_key}",
                    "tags": top_tags
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
                    "name": image.name,
                    "uploaded_at": image.uploaded_at.strftime("%Y-%m-%d %H:%M:%S"),
                }
                for image in user_images
            ]
            return Response(image_data, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
# User-specific views
# These views provide endpoints for retrieving images and albums specific to a user.

class UserSpecificImagesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        user_images = UploadedImage.objects.filter(user=user)

        if not user_images.exists():
            return Response({"error": "No images found for this user."}, status=404)

        image_data = [
            {
                "id": img.id,
                "image_url": f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{img.image}",
                "tags": img.tags,
                "posted_by": img.user.username,
            }
            for img in user_images
        ]
        return Response(image_data, status=200)

class UserSpecificAlbumsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        albums = Album.objects.filter(user=user)

        if not albums.exists():
            return Response({"error": "No albums found for this user."}, status=404)

        album_data = [
            {
                "id": album.id,
                "name": album.name,
                "owner": album.user.username,
                "cover_image_url": f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{album.cover_image.image}"
                if album.cover_image else None,
            }
            for album in albums
        ]
        return Response(album_data, status=200)

# Album management views
# These views handle album creation, updating tags, setting cover images, and managing album contents.

class FinalizeImageUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            image_id = request.data.get("image_id")
            selected_tags = request.data.get("tags", [])

            if not image_id:
                return Response({"error": "Image ID is required"}, status=400)

            image = UploadedImage.objects.filter(id=image_id, user=request.user).first()
            if not image:
                return Response({"error": "Image not found or unauthorized"}, status=404)

            image.tags = selected_tags
            image.save()

            return Response({"message": "Tags updated successfully!", "tags": image.tags}, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

class GenerateTagsView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        try:
            image_file = request.FILES.get("image")
            if not image_file:
                return Response({"error": "No image provided"}, status=400)

            rekognition_response = rekognition_client.detect_labels(
                Image={"Bytes": image_file.read()},
                MaxLabels=10
            )

            ai_tags = sorted(rekognition_response["Labels"], key=lambda x: x["Confidence"], reverse=True)[:5]
            top_tags = [label["Name"] for label in ai_tags] 

            return Response({
                "message": "Tags generated successfully",
                "tags": top_tags
            }, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
class CreateAlbumView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        name = request.data.get("name")
        cover_image_id = request.data.get("cover_image_id")

        if not name:
            return Response({"error": "Album name is required"}, status=status.HTTP_400_BAD_REQUEST)

        cover_image = UploadedImage.objects.filter(id=cover_image_id, user=request.user).first() if cover_image_id else None

        album = Album.objects.create(user=request.user, name=name, cover_image=cover_image)
        return Response({"message": "Album created", "album_id": album.id}, status=status.HTTP_201_CREATED)

class UserAlbumsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        albums = Album.objects.filter(user=request.user)
        data = [
            {
                "id": album.id,
                "name": album.name,
                "cover_image_url": f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{album.cover_image.image}" if album.cover_image else None
            } 
            for album in albums
        ]
        return Response(data, status=status.HTTP_200_OK)

class AlbumImagesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, album_id):
        album = get_object_or_404(Album, id=album_id)
        all_images = UploadedImage.objects.filter(user=album.user)

        # Get existing manually-added images 
        existing_images = set(album.images.all())

        # Get tag-matching images
        tag_matched = set(
            img for img in all_images if any(tag in album.tags for tag in img.tags)
        )

        # Combine both sets (preserve manual + auto-tagged)
        combined_images = list(existing_images.union(tag_matched))

        # Update album.images (only if needed)
        album.images.set(combined_images)

        return Response({
            "id": album.id,
            "album_name": album.name,
            "owner_username": album.user.username,
            "tags": album.tags,
            "images": [
                {
                    "id": img.id,
                    "image_url": f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{img.image}",
                    "tags": img.tags,
                }
                for img in combined_images
            ]
        }, status=200)

    def post(self, request, album_id):
        album = get_object_or_404(Album, id=album_id, user=request.user)
        image_ids = request.data.get("image_ids", [])

        if not image_ids:
            return Response({"error": "No image IDs provided"}, status=400)

        images = UploadedImage.objects.filter(id__in=image_ids, user=request.user)

        if not images.exists():
            return Response({"error": "No valid images found"}, status=400)

        album.images.add(*images)

        print(f"Successfully added images to album '{album.name}': {[img.id for img in images]}")

        return Response({"message": "Images added to album successfully"}, status=200)

    def delete(self, request, album_id):
        album = get_object_or_404(Album, id=album_id, user=request.user)
        image_id = request.data.get("image_id")

        if not image_id:
            return Response({"error": "Image ID is required"}, status=400)

        image = get_object_or_404(UploadedImage, id=image_id, user=request.user)

        if image not in album.images.all():
            return Response({"error": "Image not found in album"}, status=400)

        album.images.remove(image)
        return Response({"message": "Image removed from album successfully"}, status=200)


class UserTagsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_images = UploadedImage.objects.filter(user=request.user)

        # Extract unique tags from the user's images
        unique_tags = sorted(set(tag for image in user_images for tag in image.tags))

        return Response({"tags": unique_tags}, status=200)


class SetAlbumCoverView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, album_id):
        album = get_object_or_404(Album, id=album_id, user=request.user)
        image_id = request.data.get("image_id")

        print(f"Received album_id: {album_id}, image_id: {image_id}")
        print(f"Album contains images: {[img.id for img in album.images.all()]}")

        if not image_id:
            return Response({"error": "Image ID is required"}, status=400)

        try:
            image = UploadedImage.objects.get(id=image_id, user=request.user)
        except UploadedImage.DoesNotExist:
            return Response({"error": "Image not found"}, status=404)

        if image not in album.images.all():
            return Response({"error": "Image is not in the album"}, status=400)

        album.cover_image = image
        album.save()

        print(f"Cover image updated to: {album.cover_image.image}")

        return Response({
            "message": "Cover image updated successfully",
            "cover_image_url": f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{album.cover_image.image}"
        }, status=200)

class ImageDetailView(APIView):
    permission_classes = [AllowAny] 

    def get(self, request, image_id):
        image = get_object_or_404(UploadedImage, id=image_id) 

        data = {
            "id": image.id,
            "image_url": f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{image.image}",
            "name": image.name,
            "tags": image.tags,
            "uploaded_at": image.uploaded_at.strftime("%Y-%m-%d %H:%M:%S"),
            "posted_by": image.user.username,
        }
        return Response(data, status=status.HTTP_200_OK)
    
class EditImageNameView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, image_id):
        image = get_object_or_404(UploadedImage, id=image_id, user=request.user)
        new_name = request.data.get("name", "").strip()

        if not new_name:
            return Response({"error": "Image name cannot be empty."}, status=400)

        image.name = new_name
        image.save()

        return Response({"message": "Image name updated successfully", "name": image.name}, status=200)

class DeleteAlbumView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, album_id):
        album = get_object_or_404(Album, id=album_id, user=request.user)
        album.delete()
        return Response({"message": "Album deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
    
import logging

logger = logging.getLogger(__name__)

class AddTagsToAlbumView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, album_id):
        album = get_object_or_404(Album, id=album_id, user=request.user)
        tags_to_add = request.data.get("tags", [])

        if not isinstance(tags_to_add, list):
            return Response({"error": "Tags should be a list"}, status=400)

        # Update album's tags
        album.tags = list(set(album.tags + tags_to_add))
        album.save()

        # Find all images that match the updated album tags
        matching_images = UploadedImage.objects.filter(user=request.user).filter(
            models.Q(tags__overlap=album.tags)
        )

        # Combine with existing manually-added images
        existing_images = set(album.images.all())
        combined_images = list(existing_images.union(matching_images))

        # Update album
        album.images.set(combined_images)

        print(f"Tags after saving album: {album.tags}")
        print(f"Successfully linked {len(matching_images)} images to album '{album.name}'")

        return Response({
            "message": "Tags added successfully",
            "tags": album.tags,
            "images": [
                {"id": img.id, "image_url": f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{img.image}", "tags": img.tags}
                for img in matching_images
            ]
        }, status=200)

class RemoveTagsFromAlbumView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, album_id):
        album = get_object_or_404(Album, id=album_id, user=request.user)
        tags_to_remove = request.data.get("tags", [])

        if not isinstance(tags_to_remove, list):
            return Response({"error": "Tags should be a list"}, status=400)

        # Flatten nested lists if needed
        tags_to_remove = [tag for sublist in tags_to_remove for tag in (sublist if isinstance(sublist, list) else [sublist])]

        # Remove only the selected tags from the album's tags
        album.tags = [tag for tag in album.tags if tag not in tags_to_remove]
        album.save()

        print(f"Tags removed: {tags_to_remove}")
        print(f"Updated Album Tags: {album.tags}")

        # Find images that still match at least one album tag
        updated_images = UploadedImage.objects.filter(user=request.user).filter(
            models.Q(tags__overlap=album.tags)
        )

        # Ensure only images that no longer match album tags are removed
        images_to_remove = album.images.exclude(id__in=updated_images.values_list('id', flat=True))
        album.images.remove(*images_to_remove)

        print(f"Remaining Images in Album: {[img.id for img in updated_images]}")

        return Response({
            "message": "Tags removed successfully",
            "tags": album.tags,
            "images": [
                {
                    "id": img.id, 
                    "image_url": f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{img.image}", 
                    "tags": img.tags
                }
                for img in updated_images
            ]
        }, status=200)

class DeleteImageView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, image_id):
        image = get_object_or_404(UploadedImage, id=image_id, user=request.user)

        albums = Album.objects.filter(images=image)
        for album in albums:
            album.images.remove(image)

            if album.cover_image == image:
                album.cover_image = None
                album.save()

        try:
            s3_client.delete_object(
                Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                Key=image.image
            )
        except Exception as e:
            print(f"Failed to delete image from S3: {e}")

        image.delete()

        return Response({"message": "Image deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

class EditImageTagsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, image_id):
        image = get_object_or_404(UploadedImage, id=image_id, user=request.user)
        updated_tags = request.data.get("tags", [])

        if not updated_tags:
            return Response({"error": "An image must have at least one tag."}, status=400)
        
        formatted_tags = list(set(tag.capitalize() for tag in updated_tags))

        image.tags = formatted_tags
        image.save()

        return Response({"message": "Tags updated successfully", "tags": image.tags}, status=200)

# Analytics views
# These views provide insights into user data, such as tag distribution and top tags.

class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_images = UploadedImage.objects.filter(user=request.user)

        total_images = user_images.count()

        all_tags = [tag for image in user_images for tag in image.tags]
        tag_counts = Counter(all_tags)

        top_tags = tag_counts.most_common(5)
        tag_distribution = [{"tag": tag, "count": count} for tag, count in tag_counts.items()]

        return Response({
            "total_images": total_images,
            "top_tags": top_tags,
            "tag_distribution": tag_distribution,
        }, status=200)

class PublicUsersView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        search_query = request.query_params.get("search", "")

        users = User.objects.filter(username__icontains=search_query)
        users_data = []

        for user in users:
            profile, _ = Profile.objects.get_or_create(user=user)
            
            profile_picture_url = (
                f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{profile.profile_picture}"
                if profile.profile_picture else None
            )

            users_data.append({
                "id": user.id,
                "username": user.username,
                "profile_picture": profile_picture_url,
            })

        return Response(users_data, status=200)


class PublicImagesView(ListAPIView):
    serializer_class = UploadedImageSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = UploadedImage.objects.all()

        if not isinstance(self.request.user, AnonymousUser):
            queryset = queryset.exclude(user=self.request.user)

        search_query = self.request.query_params.get("search", "")
        if search_query:
            queryset = queryset.filter(tags__icontains=search_query)

        return queryset

class PublicAlbumsView(ListAPIView):
    serializer_class = AlbumSerializer
    permission_classes = [AllowAny] 

    def get_queryset(self):
        queryset = Album.objects.all().select_related("user")

        if self.request.user and self.request.user.is_authenticated:
            queryset = queryset.exclude(user=self.request.user)

        search_query = self.request.query_params.get("search", "")
        if search_query:
            queryset = queryset.filter(name__icontains=search_query)

        return queryset


class UpdateAlbumTagsFromPromptView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, album_id):
        prompt = request.data.get("prompt", "")
        if not prompt:
            return Response({"error": "Prompt is required"}, status=400)

        album = get_object_or_404(Album, id=album_id, user=request.user)

        # Convert prompt to vector embedding
        prompt_vector = model.encode(prompt)

        def cosine_similarity(vec1, vec2):
            return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

        all_user_images = UploadedImage.objects.filter(user=request.user)
        existing_tags = set(tag for image in all_user_images for tag in image.tags)

        # Compute similarity between the prompt and tags
        tag_scores = [(tag, cosine_similarity(prompt_vector, emb)) for tag, emb in rekognition_embeddings.items()]
        tag_scores.sort(key=lambda x: x[1], reverse=True)

        # Determine which tags to include or exclude based on the prompt
        positive_tags = []
        negative_tags = []

        for tag, score in tag_scores[:15]:
            if f"no {tag.lower()}" in prompt.lower() or f"without {tag.lower()}" in prompt.lower():
                negative_tags.append(tag)
            else:
                positive_tags.append(tag)

        # Keep only tags that exist in the user's images
        new_album_tags = [tag for tag in positive_tags if tag in existing_tags and tag not in negative_tags]

        if not new_album_tags:
            return Response({"error": "No valid tags to update"}, status=400)

        album.tags = new_album_tags
        album.save()

        matching_images = UploadedImage.objects.filter(user=request.user, tags__overlap=new_album_tags)
        existing_images = set(album.images.all())
        combined_images = list(existing_images.union(matching_images))
        album.images.set(combined_images)

        return Response({
            "prompt": prompt,
            "updated_tags": new_album_tags,
            "excluded_tags": negative_tags,
            "album_id": album.id,
            "matched_images": UploadedImageSerializer(matching_images, many=True).data,
        })
