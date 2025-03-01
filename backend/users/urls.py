from django.urls import path
from .views import RegisterView, LoginView, ProfileView, DeleteAccountView, ProfileView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'), 
    path('profile/', ProfileView.as_view(), name='profile'),
    path('delete-account/', DeleteAccountView.as_view(), name='delete-account'),
    path("me/", ProfileView.as_view(), name="current-user"),
]
