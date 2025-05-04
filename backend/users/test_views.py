from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

class UserViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="testuser", password="pass123")

    def test_user_registration(self):
        data = {"username": "newuser", "email": "new@a.com", "password": "pass456"}
        response = self.client.post("/users/register/", data)
        self.assertEqual(response.status_code, 201)

    def test_user_login(self):
        response = self.client.post("/users/login/", {"username": "testuser", "password": "pass123"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)

    def test_get_profile_as_self(self):
        self.client.login(username="testuser", password="pass123")
        response = self.client.get("/users/profile/me/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "testuser")

    def test_update_profile(self):
        self.client.login(username="testuser", password="pass123")
        response = self.client.post("/users/update-profile/", {"username": "updateduser"})
        self.assertEqual(response.status_code, 200)

    def test_upload_profile_picture(self):
        from io import BytesIO
        from django.core.files.uploadedfile import SimpleUploadedFile

        self.client.login(username="testuser", password="pass123")
        image = SimpleUploadedFile("pic.jpg", b"fake image content", content_type="image/jpeg")
        response = self.client.post("/users/update-profile-picture/", {"profile_picture": image})
        self.assertEqual(response.status_code, 200)

    def test_delete_account(self):
        self.client.login(username="testuser", password="pass123")
        response = self.client.delete("/users/delete-account/")
        self.assertEqual(response.status_code, 204)

    def test_user_profile_by_id(self):
        self.client.login(username="testuser", password="pass123")
        user_id = self.user.id
        response = self.client.get(f"/users/profile/{user_id}/")
        self.assertEqual(response.status_code, 200)

    def test_user_profile_invalid_id(self):
        self.client.login(username="testuser", password="pass123")
        response = self.client.get("/users/profile/99999/") 
        self.assertEqual(response.status_code, 500)

    def test_upload_profile_picture_no_file(self):
        self.client.login(username="testuser", password="pass123")
        response = self.client.post("/users/update-profile-picture/", {}) 
        self.assertEqual(response.status_code, 400)

    def test_update_profile_invalid_data(self):
        self.client.login(username="testuser", password="pass123")
        response = self.client.post("/users/update-profile/", {})
        self.assertEqual(response.status_code, 200)

    def test_delete_account_unauthenticated(self):
        response = self.client.delete("/users/delete-account/")
        self.assertEqual(response.status_code, 401)
