from django.db import models
from django.conf import settings

def user_directory_path(instance, filename):
    """Store images inside `media/user_<id>/uploads/`"""
    return f'user_{instance.user.id}/uploads/{filename}'

class UploadedImage(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    image = models.CharField(max_length=255)  
    tags = models.JSONField(default=list)  
    uploaded_at = models.DateTimeField(auto_now_add=True) 
    name = models.CharField(max_length=255, blank=True, null=True)  
    

    def __str__(self):
        return f"{self.user.username} - {self.image}"

class Album(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    cover_image = models.ForeignKey(UploadedImage, null=True, blank=True, on_delete=models.SET_NULL, related_name="cover_for_album")
    images = models.ManyToManyField(UploadedImage, related_name="albums")
    created_at = models.DateTimeField(auto_now_add=True)
    tags = models.JSONField(default=list)

    def __str__(self):
        return f"Album: {self.name} by {self.user.username}"
