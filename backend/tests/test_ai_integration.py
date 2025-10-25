import unittest
from fastapi.testclient import TestClient
from main import app
import json
from unittest.mock import patch, MagicMock

class TestAIIntegration(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.test_session = "test_session_123"
        self.auth_headers = {
            "Authorization": "Bearer test_token",
            "Content-Type": "application/json"
        }

    @patch('services.ai_service.generate_response')
    def test_chat_endpoint(self, mock_generate):
        """Test the chat endpoint with a valid message"""
        test_message = "Hello, pet!"
        mock_response = {
            "response": "Hello there! How can I help you today?",
            "action": "chat",
            "metadata": {}
        }
        mock_generate.return_value = mock_response
        
        response = self.client.post(
            "/api/ai/chat",
            headers=self.auth_headers,
            json={
                "session_id": self.test_session,
                "message": test_message
            }
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["response"], mock_response["response"])
        mock_generate.assert_called_once()

    @patch('services.pet_intelligence.PetIntelligence')
    def test_pet_interaction(self, mock_pet):
        """Test pet interaction endpoint"""
        mock_instance = mock_pet.return_value
        mock_instance.interact.return_value = {
            "success": True,
            "message": "Action completed",
            "state": {"happiness": 60, "energy": 70}
        }
        
        response = self.client.post(
            "/api/pet/interact",
            headers=self.auth_headers,
            json={
                "session_id": self.test_session,
                "action": "feed",
                "item": "kibble"
            }
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])
        mock_instance.interact.assert_called_once_with("feed", "kibble")

    def test_session_persistence(self):
        """Test that session state persists between requests"""
        # First request
        response1 = self.client.post(
            "/api/ai/chat",
            headers=self.auth_headers,
            json={
                "session_id": self.test_session,
                "message": "I'm happy!"
            }
        )
        
        # Second request with same session
        response2 = self.client.post(
            "/api/pet/interact",
            headers=self.auth_headers,
            json={
                "session_id": self.test_session,
                "action": "play"
            }
        )
        
        # Both requests should be part of the same session
        self.assertEqual(response1.status_code, 200)
        self.assertEqual(response2.status_code, 200)

    def test_invalid_command(self):
        """Test handling of invalid commands"""
        response = self.client.post(
            "/api/pet/interact",
            headers=self.auth_headers,
            json={
                "session_id": self.test_session,
                "action": "invalid_action"
            }
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())

if __name__ == "__main__":
    unittest.main()
