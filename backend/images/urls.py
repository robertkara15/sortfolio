from django.urls import path
from .views import ImageUploadView, UserImagesView, FinalizeImageUploadView

urlpatterns = [
    path('upload/', ImageUploadView.as_view(), name='image-upload'),
    path('my-images/', UserImagesView.as_view(), name='user-images'),
    path('finalize-upload/', FinalizeImageUploadView.as_view(), name='finalize-upload'),
]
