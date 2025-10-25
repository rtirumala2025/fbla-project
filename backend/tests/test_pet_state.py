import unittest
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from services.pet_intelligence import PetIntelligence

class TestPetState(unittest.TestCase):
    def setUp(self):
        self.pet = PetIntelligence()
        self.sample_state = {
            "happiness": 50,
            "energy": 80,
            "hunger": 30,
            "cleanliness": 90,
            "last_updated": datetime.utcnow().isoformat(),
            "mood": "happy",
            "level": 1,
            "experience": 0
        }

    def test_initial_state(self):
        """Test that pet initializes with default state"""
        self.assertEqual(self.pet.state["happiness"], 50)
        self.assertEqual(self.pet.state["mood"], "neutral")
        self.assertEqual(self.pet.state["level"], 1)

    def test_feed_pet(self):
        """Test feeding the pet updates hunger and happiness"""
        initial_hunger = self.pet.state["hunger"]
        initial_happiness = self.pet.state["happiness"]
        
        result = self.pet.feed("kibble")
        
        self.assertLess(self.pet.state["hunger"], initial_hunger)
        self.assertGreater(self.pet.state["happiness"], initial_happiness)
        self.assertTrue(result["success"])

    def test_play_with_pet(self):
        """Test playing with pet updates energy and happiness"""
        initial_energy = self.pet.state["energy"]
        initial_happiness = self.pet.state["happiness"]
        
        result = self.pet.play("fetch")
        
        self.assertLess(self.pet.state["energy"], initial_energy)
        self.assertGreater(self.pet.state["happiness"], initial_happiness)
        self.assertTrue(result["success"])

    @patch('datetime.datetime')
    def test_state_decay(self, mock_datetime):
        """Test pet stats decay over time"""
        # Set initial state
        self.pet.state = self.sample_state.copy()
        
        # Move time forward by 2 hours
        future_time = datetime.utcnow() + timedelta(hours=2)
        mock_datetime.utcnow.return_value = future_time
        
        # Trigger state update
        self.pet.update_state()
        
        # Stats should have decayed
        self.assertLess(self.pet.state["happiness"], 50)
        self.assertLess(self.pet.state["energy"], 80)
        self.assertGreater(self.pet.state["hunger"], 30)

    def test_level_up(self):
        """Test pet levels up when gaining enough experience"""
        self.pet.state["experience"] = 95  # Just below level up
        initial_level = self.pet.state["level"]
        
        # Add enough experience to level up
        self.pet.add_experience(10)
        
        self.assertEqual(self.pet.state["level"], initial_level + 1)
        self.assertEqual(self.pet.state["experience"], 5)  # Should reset with carryover

    def test_cooldown_mechanism(self):
        """Test action cooldowns are enforced"""
        # First action should succeed
        result1 = self.pet.feed("kibble")
        self.assertTrue(result1["success"])
        
        # Immediate second action should be on cooldown
        result2 = self.pet.feed("kibble")
        self.assertFalse(result2["success"])
        self.assertEqual(result2["message"], "Action is on cooldown")

if __name__ == "__main__":
    unittest.main()
