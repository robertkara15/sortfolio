from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from .views import (
    RegisterView, 
    LoginView, 
    ProfileView, 
    DeleteAccountView, 
    ProfileView, 
    UserProfileView, 
    UpdateProfileView, 
    UploadProfilePictureView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'), 
    path('profile/', ProfileView.as_view(), name='profile'),
    path('delete-account/', DeleteAccountView.as_view(), name='delete-account'),
    path("profile/<str:user_id>/", UserProfileView.as_view(), name="user-profile"),
    path("update-profile/", UpdateProfileView.as_view(), name="update-profile"),
    path("update-profile-picture/", UploadProfilePictureView.as_view(), name="update-profile-picture"),
    path("me/", ProfileView.as_view(), name="current-user"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
