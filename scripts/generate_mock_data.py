#!/usr/bin/env python3
"""
Mock Data Generator for FBLA Demo Presentation

This script generates realistic sample data for:
- Budget Advisor transactions
- Pet interaction history
- Financial analytics
- User profiles

Usage:
    python scripts/generate_mock_data.py --output-dir ./demo-data
"""

import json
import argparse
from datetime import date, datetime, timedelta
from typing import List, Dict, Any
import random

# Sample categories for transactions
CATEGORIES = ["food", "transport", "entertainment", "shopping", "bills", "health", "education"]

# Sample pet names
PET_NAMES = ["Buddy", "Luna", "Max", "Bella", "Charlie", "Daisy", "Rocky", "Molly"]

# Sample breeds
BREEDS = {
    "dog": ["Golden Retriever", "Labrador", "German Shepherd", "Bulldog"],
    "cat": ["Persian", "Siamese", "Maine Coon", "British Shorthair"],
    "bird": ["Parrot", "Canary", "Finch", "Cockatiel"],
    "rabbit": ["Dutch", "Angora", "Lop", "Rex"]
}


def generate_transactions(
    count: int = 30,
    start_date: date = None,
    end_date: date = None,
    monthly_budget: float = 1000.0
) -> List[Dict[str, Any]]:
    """Generate realistic transaction data for budget advisor."""
    if start_date is None:
        start_date = date.today() - timedelta(days=30)
    if end_date is None:
        end_date = date.today()
    
    transactions = []
    current_date = start_date
    
    # Generate transactions with realistic patterns
    while current_date <= end_date and len(transactions) < count:
        # More transactions on weekends
        if current_date.weekday() >= 5:  # Saturday or Sunday
            num_transactions = random.randint(2, 4)
        else:
            num_transactions = random.randint(0, 2)
        
        for _ in range(num_transactions):
            category = random.choice(CATEGORIES)
            
            # Realistic amounts by category
            amounts = {
                "food": (10.0, 50.0),
                "transport": (5.0, 30.0),
                "entertainment": (15.0, 100.0),
                "shopping": (20.0, 150.0),
                "bills": (50.0, 300.0),
                "health": (25.0, 100.0),
                "education": (30.0, 200.0)
            }
            
            min_amount, max_amount = amounts.get(category, (10.0, 100.0))
            amount = round(random.uniform(min_amount, max_amount), 2)
            
            transactions.append({
                "amount": amount,
                "category": category,
                "date": current_date.isoformat(),
                "description": f"{category.title()} purchase"
            })
        
        current_date += timedelta(days=1)
    
    return transactions[:count]


def generate_budget_advisor_request(
    transactions: List[Dict[str, Any]] = None,
    monthly_budget: float = 1000.0
) -> Dict[str, Any]:
    """Generate a complete budget advisor request."""
    if transactions is None:
        transactions = generate_transactions(monthly_budget=monthly_budget)
    
    return {
        "transactions": transactions,
        "monthly_budget": monthly_budget
    }


def generate_pet_interactions(count: int = 20) -> List[Dict[str, Any]]:
    """Generate pet interaction history."""
    actions = ["feed", "play", "bathe", "rest", "train", "clean"]
    interactions = []
    
    base_date = datetime.now() - timedelta(days=7)
    
    for i in range(count):
        action = random.choice(actions)
        timestamp = base_date + timedelta(
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59)
        )
        
        # Generate realistic stat changes
        stat_changes = {
            "feed": {"hunger": +30, "happiness": +5, "coins": -10},
            "play": {"happiness": +25, "energy": -15, "coins": 0},
            "bathe": {"cleanliness": +40, "happiness": +10, "coins": -15},
            "rest": {"energy": +35, "health": +5, "coins": 0},
            "train": {"happiness": +15, "energy": -20, "coins": -20},
            "clean": {"cleanliness": +30, "health": +3, "coins": -5}
        }
        
        changes = stat_changes.get(action, {})
        
        interactions.append({
            "action": action,
            "timestamp": timestamp.isoformat(),
            "stat_changes": changes,
            "coins_spent": abs(changes.get("coins", 0))
        })
    
    return sorted(interactions, key=lambda x: x["timestamp"])


def generate_ai_chat_examples() -> List[Dict[str, Any]]:
    """Generate sample AI chat interactions for demo."""
    return [
        {
            "user_message": "How is my pet doing today?",
            "ai_response": "Your pet is feeling content! Current stats show:\n- Health: 75/100 (Good)\n- Hunger: 60/100 (Moderate)\n- Happiness: 70/100 (Happy)\n\nYour pet is in good shape! Consider playing together to boost happiness.",
            "context": "status_check"
        },
        {
            "user_message": "/feed",
            "ai_response": "Great! I've fed your pet. Hunger increased by 30 points. Your pet is now well-fed and happy! 🍽️\n\nCurrent coins: 490",
            "context": "command_action"
        },
        {
            "user_message": "I want to save coins. What should I do?",
            "ai_response": "Great goal! Here are some tips to save coins:\n\n1. **Focus on free actions:** Play and rest don't cost coins\n2. **Plan purchases:** Buy items when you really need them\n3. **Earn through games:** Mini-games provide coin rewards\n4. **Track spending:** Use analytics to see where coins go\n\nYour current balance is 490 coins. Would you like to set a savings goal?",
            "context": "financial_advice"
        },
        {
            "user_message": "Tell me about budgeting",
            "ai_response": "Budgeting is a key financial skill! Here's how it works:\n\n**The Basics:**\n- Track income (coins earned)\n- Track expenses (coins spent)\n- Plan for future purchases\n- Save for emergencies\n\n**In Your Pet World:**\n- Monitor coin balance\n- Plan pet care expenses\n- Save for special items\n- Use analytics to track patterns\n\nWould you like me to analyze your spending patterns?",
            "context": "educational"
        }
    ]


def generate_analytics_summary() -> Dict[str, Any]:
    """Generate analytics summary data."""
    return {
        "total_coins_earned": 1250.0,
        "total_coins_spent": 750.0,
        "current_balance": 500.0,
        "total_transactions": 45,
        "top_categories": [
            {"category": "food", "amount": 450.0, "count": 15},
            {"category": "shopping", "amount": 200.0, "count": 8},
            {"category": "entertainment", "amount": 100.0, "count": 5}
        ],
        "weekly_summary": {
            "coins_earned": 150.0,
            "coins_spent": 120.0,
            "net_change": 30.0
        },
        "trends": {
            "spending_trend": "increasing",
            "savings_trend": "stable",
            "activity_trend": "increasing"
        }
    }


def generate_demo_user_profile() -> Dict[str, Any]:
    """Generate a demo user profile."""
    return {
        "username": "fbla_demo_user",
        "email": "fbla-demo@example.com",
        "coins": 500,
        "level": 5,
        "pet": {
            "name": random.choice(PET_NAMES),
            "species": random.choice(["dog", "cat", "bird", "rabbit"]),
            "breed": random.choice(BREEDS["dog"]),  # Default to dog
            "health": random.randint(60, 90),
            "hunger": random.randint(50, 80),
            "happiness": random.randint(60, 85),
            "cleanliness": random.randint(70, 95),
            "energy": random.randint(55, 80)
        },
        "preferences": {
            "sound": True,
            "music": True,
            "notifications": True,
            "theme": "light"
        }
    }


def main():
    parser = argparse.ArgumentParser(description="Generate mock data for FBLA demo")
    parser.add_argument(
        "--output-dir",
        type=str,
        default="./demo-data",
        help="Output directory for generated data files"
    )
    parser.add_argument(
        "--transaction-count",
        type=int,
        default=30,
        help="Number of transactions to generate"
    )
    parser.add_argument(
        "--monthly-budget",
        type=float,
        default=1000.0,
        help="Monthly budget for transactions"
    )
    
    args = parser.parse_args()
    
    import os
    os.makedirs(args.output_dir, exist_ok=True)
    
    print("Generating mock data for FBLA demo...")
    
    # Generate transactions
    print("  - Generating transactions...")
    transactions = generate_transactions(
        count=args.transaction_count,
        monthly_budget=args.monthly_budget
    )
    
    # Generate budget advisor request
    print("  - Generating budget advisor request...")
    budget_request = generate_budget_advisor_request(
        transactions=transactions,
        monthly_budget=args.monthly_budget
    )
    
    # Generate pet interactions
    print("  - Generating pet interactions...")
    pet_interactions = generate_pet_interactions()
    
    # Generate AI chat examples
    print("  - Generating AI chat examples...")
    ai_chat_examples = generate_ai_chat_examples()
    
    # Generate analytics summary
    print("  - Generating analytics summary...")
    analytics_summary = generate_analytics_summary()
    
    # Generate user profile
    print("  - Generating user profile...")
    user_profile = generate_demo_user_profile()
    
    # Write all data to files
    print(f"\nWriting data to {args.output_dir}/...")
    
    files_to_write = {
        "transactions.json": transactions,
        "budget_advisor_request.json": budget_request,
        "pet_interactions.json": pet_interactions,
        "ai_chat_examples.json": ai_chat_examples,
        "analytics_summary.json": analytics_summary,
        "user_profile.json": user_profile
    }
    
    for filename, data in files_to_write.items():
        filepath = os.path.join(args.output_dir, filename)
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"  ✓ {filename}")
    
    # Generate a comprehensive demo data file
    demo_data = {
        "generated_at": datetime.now().isoformat(),
        "user_profile": user_profile,
        "transactions": transactions,
        "budget_advisor_request": budget_request,
        "pet_interactions": pet_interactions,
        "ai_chat_examples": ai_chat_examples,
        "analytics_summary": analytics_summary
    }
    
    demo_filepath = os.path.join(args.output_dir, "demo_data_complete.json")
    with open(demo_filepath, 'w') as f:
        json.dump(demo_data, f, indent=2)
    print(f"  ✓ demo_data_complete.json")
    
    print(f"\n✅ Mock data generation complete!")
    print(f"   All files saved to: {args.output_dir}/")
    print(f"\nUsage examples:")
    print(f"   - Budget Advisor: Use 'budget_advisor_request.json'")
    print(f"   - AI Chat Demo: Reference 'ai_chat_examples.json'")
    print(f"   - Analytics: Use 'analytics_summary.json'")
    print(f"   - Complete Demo: Use 'demo_data_complete.json'")


if __name__ == "__main__":
    main()

