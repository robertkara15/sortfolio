from django.urls import path
from .views import ImageUploadView, UserImagesView, FinalizeImageUploadView, GenerateTagsView, CreateAlbumView, UserAlbumsView, AlbumImagesView, ImageDetailView, DeleteAlbumView, SetAlbumCoverView, AddTagsToAlbumView, RemoveTagsFromAlbumView, UserTagsView, DeleteImageView, ImageDetailView, EditImageTagsView, AnalyticsView

urlpatterns = [
    path('upload/', ImageUploadView.as_view(), name='image-upload'),
    path('my-images/', UserImagesView.as_view(), name='user-images'),
    path('finalize-upload/', FinalizeImageUploadView.as_view(), name='finalize-upload'),
    path('generate-tags/', GenerateTagsView.as_view(), name='generate-tags'),
    path('create-album/', CreateAlbumView.as_view(), name='create-album'),
    path('albums/', UserAlbumsView.as_view(), name='user-albums'),
    path('album/<int:album_id>/', AlbumImagesView.as_view(), name='album-images'),
    path('image/<int:image_id>/', ImageDetailView.as_view(), name='image-detail'),
    path('delete-album/<int:album_id>/', DeleteAlbumView.as_view(), name='delete-album'),
    path('album/<int:album_id>/set-cover/', SetAlbumCoverView.as_view(), name='set-album-cover'),
    path("album/<int:album_id>/add-tags/", AddTagsToAlbumView.as_view(), name="add-tags"),
    path("album/<int:album_id>/remove-tags/", RemoveTagsFromAlbumView.as_view(), name="remove-tags"),
    path("user-tags/", UserTagsView.as_view(), name="user-tags"),
    path("delete-image/<int:image_id>/", DeleteImageView.as_view(), name="delete-image"),
    path("image/<int:image_id>/", ImageDetailView.as_view(), name="image-detail"),
    path("image/<int:image_id>/edit-tags/", EditImageTagsView.as_view(), name="edit-image-tags"),
    path("analytics/", AnalyticsView.as_view(), name="analytics"),
]

