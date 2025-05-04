from rest_framework import serializers
from .models import UploadedImage, Album
from django.contrib.auth.models import User
from django.conf import settings

class UploadedImageSerializer(serializers.ModelSerializer):
    posted_by = serializers.CharField(source="user.username", read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = UploadedImage
        fields = ["id", "image_url", "name", "tags", "uploaded_at", "posted_by"]
        read_only_fields = ["image_url", "name", "tags", "uploaded_at", "posted_by"]

    def get_image_url(self, obj):
        """Return the full URL for the image stored in S3"""
        if obj.image:
            return f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{obj.image}"
        return None


class AlbumSerializer(serializers.ModelSerializer):
    owner = serializers.CharField(source="user.username", read_only=True)
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Album
        fields = ["id", "name", "cover_image_url", "tags", "owner"]
        read_only_fields = ["name", "cover_image_url", "tags", "owner"]

    def get_cover_image_url(self, obj):
        """Return the full URL for the album cover image stored in S3"""
        if obj.cover_image:
            return f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{obj.cover_image.image}"
        return None 



class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]
