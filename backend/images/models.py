from django.db import models
from django.conf import settings

def user_directory_path(instance, filename):
    """Store images inside `media/user_<id>/uploads/`"""
    return f'user_{instance.user.id}/uploads/{filename}'

class UploadedImage(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  # Each image belongs to a user
    image = models.CharField(max_length=255)  # Store S3 key instead of local path
    tags = models.JSONField(default=list)  # Store metadata as a list of tags
    uploaded_at = models.DateTimeField(auto_now_add=True)  # Auto timestamp

    def __str__(self):
        return f"{self.user.username} - {self.image}"

class Album(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    cover_image = models.ForeignKey(UploadedImage, on_delete=models.SET_NULL, null=True, blank=True)
    images = models.ManyToManyField(UploadedImage, related_name="albums")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Album: {self.name} by {self.user.username}"
