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
from .serializers import UploadedImageSerializer
from .aws_rekognition import analyze_image 
from rest_framework import status
from django.db import models

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

            # Analyze image with AWS Rekognition (get top 5 tags sorted by confidence)
            rekognition_response = rekognition_client.detect_labels(
                Image={"S3Object": {"Bucket": s3_bucket, "Name": s3_key}},
                MaxLabels=10
            )

            ai_tags = sorted(rekognition_response["Labels"], key=lambda x: x["Confidence"], reverse=True)[:5]
            top_tags = [label["Name"] for label in ai_tags]  # Extract top 5 tag names

            # Save image in DB without tags (tags will be added when user confirms)
            uploaded_image = UploadedImage.objects.create(
                user=request.user,
                image=s3_key,
                tags=[]  # No tags yet
            )

            return Response({
                "message": "Image uploaded successfully",
                "data": {
                    "id": uploaded_image.id,
                    "image_url": f"https://{s3_bucket}.s3.amazonaws.com/{s3_key}",
                    "tags": top_tags  # Send only the top 5 AI tags for selection
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
            return Response(image_data, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

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

            # Update image tags
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

            # Use AWS Rekognition to analyze image (without uploading)
            rekognition_response = rekognition_client.detect_labels(
                Image={"Bytes": image_file.read()},  # Analyze raw image bytes
                MaxLabels=10
            )

            ai_tags = sorted(rekognition_response["Labels"], key=lambda x: x["Confidence"], reverse=True)[:5]
            top_tags = [label["Name"] for label in ai_tags]  # Extract top 5 tag names

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
    permission_classes = [IsAuthenticated]

    def get(self, request, album_id):
        album = get_object_or_404(Album, id=album_id, user=request.user)

        print(f"\n--- DEBUG: Fetching Images for Album '{album.name}' ---")
        print(f"Album Tags: {album.tags}")

        all_images = UploadedImage.objects.filter(user=request.user)
        print("\n--- ALL USER IMAGES BEFORE FILTERING ---")
        for img in all_images:
            print(f"Image ID: {img.id}, Tags: {img.tags}")

        # ✅ Find matching images based on tags
        matching_images = [
            img for img in all_images if any(tag in album.tags for tag in img.tags)
        ]

        # ✅ Ensure these images are actually stored in the album
        album.images.set(matching_images)  # <--- Stores the images in album.images

        print("\n--- MATCHED IMAGES ---")
        if matching_images:
            for img in matching_images:
                print(f"✅ MATCH: Image ID: {img.id}, Tags: {img.tags}")
        else:
            print("⚠️ No images matched the album tags!")

        return Response({
            "album_name": album.name,
            "tags": album.tags,
            "images": [
                {
                    "id": img.id,
                    "image_url": f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{img.image}",
                    "tags": img.tags,
                }
                for img in matching_images
            ]
        }, status=200)







    def post(self, request, album_id):
        """ ✅ Allow adding images to an album """
        album = get_object_or_404(Album, id=album_id, user=request.user)
        image_ids = request.data.get("image_ids", [])

        if not image_ids:
            return Response({"error": "No image IDs provided"}, status=400)

        images = UploadedImage.objects.filter(id__in=image_ids, user=request.user)

        if not images.exists():
            return Response({"error": "No valid images found"}, status=400)

        album.images.add(*images)  # ✅ Add images to album

        # ✅ Debugging Log
        print(f"✅ Successfully added images to album '{album.name}': {[img.id for img in images]}")

        return Response({"message": "Images added to album successfully"}, status=200)

    def delete(self, request, album_id):
        """ ✅ Allow removing an image from an album """
        album = get_object_or_404(Album, id=album_id, user=request.user)
        image_id = request.data.get("image_id")

        if not image_id:
            return Response({"error": "Image ID is required"}, status=400)

        image = get_object_or_404(UploadedImage, id=image_id, user=request.user)

        if image not in album.images.all():
            return Response({"error": "Image not found in album"}, status=400)

        album.images.remove(image)  # ✅ Remove the image from the album
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

        print(f"🔍 Received album_id: {album_id}, image_id: {image_id}")
        print(f"📸 Album contains images: {[img.id for img in album.images.all()]}")

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

        print(f"✅ Cover image updated to: {album.cover_image.image}")

        return Response({
            "message": "Cover image updated successfully",
            "cover_image_url": f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{album.cover_image.image}"
        }, status=200)







    
class ImageDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, image_id):
        image = get_object_or_404(UploadedImage, id=image_id, user=request.user)
        data = {
            "id": image.id,
            "image_url": f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{image.image}",
            "tags": image.tags,
            "uploaded_at": image.uploaded_at.strftime("%Y-%m-%d %H:%M:%S"),
        }
        return Response(data, status=status.HTTP_200_OK)
    
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

        # ✅ Update album's tags
        album.tags = list(set(album.tags + tags_to_add))
        album.save()

        # ✅ Find all images that match the updated album tags
        matching_images = UploadedImage.objects.filter(user=request.user).filter(
            models.Q(tags__overlap=album.tags)
        )

        # ✅ Store these images in album.images
        album.images.set(matching_images)

        print(f"✅ Tags after saving album: {album.tags}")
        print(f"✅ Successfully linked {len(matching_images)} images to album '{album.name}'")

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

        # ✅ Flatten nested lists if needed
        tags_to_remove = [tag for sublist in tags_to_remove for tag in (sublist if isinstance(sublist, list) else [sublist])]

        # ✅ Remove only the selected tags from the album's tags
        album.tags = [tag for tag in album.tags if tag not in tags_to_remove]
        album.save()

        print(f"🗑️ Tags removed: {tags_to_remove}")
        print(f"✅ Updated Album Tags: {album.tags}")

        # ✅ Find images that still match at least one album tag
        updated_images = UploadedImage.objects.filter(user=request.user).filter(
            models.Q(tags__overlap=album.tags)
        )

        # ✅ Ensure only images that no longer match album tags are removed
        images_to_remove = album.images.exclude(id__in=updated_images.values_list('id', flat=True))
        album.images.remove(*images_to_remove)

        print(f"✅ Remaining Images in Album: {[img.id for img in updated_images]}")

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
