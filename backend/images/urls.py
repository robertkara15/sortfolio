from django.urls import path
from .views import ImageUploadView, UserImagesView, FinalizeImageUploadView, GenerateTagsView, CreateAlbumView, UserAlbumsView, AlbumImagesView, ImageDetailView

urlpatterns = [
    path('upload/', ImageUploadView.as_view(), name='image-upload'),
    path('my-images/', UserImagesView.as_view(), name='user-images'),
    path('finalize-upload/', FinalizeImageUploadView.as_view(), name='finalize-upload'),
    path('generate-tags/', GenerateTagsView.as_view(), name='generate-tags'),
    path('create-album/', CreateAlbumView.as_view(), name='create-album'),
    path('albums/', UserAlbumsView.as_view(), name='user-albums'),
    path('album/<int:album_id>/', AlbumImagesView.as_view(), name='album-images'),
    path('image/<int:image_id>/', ImageDetailView.as_view(), name='image-detail'),

]
