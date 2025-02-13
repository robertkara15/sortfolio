from rest_framework import serializers
from .models import UploadedImage

class UploadedImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedImage
        fields = '__all__'
        extra_kwargs = {'user': {'read_only': True}}  # ✅ Prevents user from being required in the request
