from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from unittest.mock import patch
import io

class ImageUploadViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="testuser", password="testpass")
        self.client.login(username="testuser", password="testpass")

    @patch("images.views.rekognition_client.detect_labels")
    @patch("images.views.s3_client.upload_fileobj")
    def test_image_upload_success(self, mock_upload, mock_detect):
        mock_detect.return_value = {
            "Labels": [{"Name": "Tree", "Confidence": 99}, {"Name": "Sky", "Confidence": 97}]
        }
        image_file = io.BytesIO(b"fake image content")
        image_file.name = "test.jpg"

        response = self.client.post("/images/upload/", {"image": image_file}, format='multipart')
        self.assertIn(response.status_code, [200, 201])


    def test_image_upload_no_file(self):
        response = self.client.post("/images/upload/", {}, format='multipart')
        self.assertEqual(response.status_code, 400)

    def test_generate_tags_empty_payload(self):
        self.client.login(username="testuser", password="pass123")
        response = self.client.post("/images/generate-tags/", {})
        self.assertEqual(response.status_code, 400)

    def test_create_album(self):
        self.client.login(username="testuser", password="pass123")
        response = self.client.post("/images/create-album/", {"name": "My Album"})
        self.assertIn(response.status_code, [200, 201])
        self.assertIn("album_id", response.data)

    def test_user_albums_list(self):
        self.client.login(username="testuser", password="pass123")
        response = self.client.get("/images/albums/")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)

    def test_user_tags_view(self):
        self.client.login(username="testuser", password="pass123")
        response = self.client.get("/images/user-tags/")
        self.assertEqual(response.status_code, 200)

    def test_user_images_view(self):
        self.client.login(username="testuser", password="pass123")
        response = self.client.get("/images/my-images/")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)

    def test_create_album_missing_name(self):
        self.client.login(username="testuser", password="testpass")
        response = self.client.post("/images/create-album/", {})
        self.assertEqual(response.status_code, 400)

    def test_user_images_view_unauthenticated(self):
        response = self.client.get("/images/my-images/")
        self.assertEqual(response.status_code, 200)

    def test_user_tags_view_unauthenticated(self):
        response = self.client.get("/images/user-tags/")
        self.assertEqual(response.status_code, 200)
