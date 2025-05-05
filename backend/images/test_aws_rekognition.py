# This module contains unit tests for the AWS Rekognition integration.
# It tests the "analyze_image" function to ensure correct behaviour for both
# successful label detection and error handling using mocked AWS responses.

from django.test import TestCase
from unittest.mock import patch
from images.aws_rekognition import analyze_image

class AWSRekognitionTest(TestCase):

    @patch("images.aws_rekognition.rekognition.detect_labels")
    def test_analyze_image_success(self, mock_detect):
        mock_detect.return_value = {"Labels": [{"Name": "Dog"}, {"Name": "Beach"}]}
        labels = analyze_image("dummy-bucket", "dummy-key")
        self.assertEqual(labels, ["Dog", "Beach"])

    @patch("images.aws_rekognition.rekognition.detect_labels")
    def test_analyze_image_failure(self, mock_detect):
        mock_detect.side_effect = Exception("Mocked failure")
        labels = analyze_image("dummy-bucket", "dummy-key")
        self.assertEqual(labels, [])
