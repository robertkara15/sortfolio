from django.test import TestCase
from django.contrib.auth.models import User
from images.models import UploadedImage, Album

class UploadedImageModelTest(TestCase):
    def test_uploaded_image_str(self):
        user = User.objects.create(username="tester")
        image = UploadedImage.objects.create(user=user, image="test.jpg", tags=["sky", "cloud"])
        self.assertEqual(str(image), "tester - test.jpg")
        self.assertEqual(image.tags, ["sky", "cloud"])

class AlbumModelTest(TestCase):
    def test_album_str(self):
        user = User.objects.create(username="tester")
        album = Album.objects.create(user=user, name="Nature")
        self.assertIn("Nature", str(album))
