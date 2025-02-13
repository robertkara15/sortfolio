from django.db import models
from django.conf import settings

def user_directory_path(instance, filename):
    """Store images inside `media/user_<id>/uploads/`"""
    return f'user_{instance.user.id}/uploads/{filename}'

class UploadedImage(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  # Each image belongs to a user
    image = models.ImageField(upload_to=user_directory_path)  # Store in user-specific folder
    tags = models.JSONField(default=list)  # Store metadata as a list of tags
    uploaded_at = models.DateTimeField(auto_now_add=True)  # Auto timestamp

    def __str__(self):
        return f"{self.user.username} - {self.image.name}"
