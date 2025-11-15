# AI Features Demo Script - FBLA Presentation

> **Duration:** ~8-10 minutes  
> **Focus:** Showcase AI-powered features and intelligent interactions  
> **Setup:** Use seeded demo account with pre-populated data

---

## Pre-Demo Setup (5 minutes before)

### 1. Environment Verification
- [ ] Backend running on `http://localhost:8000`
- [ ] Frontend running on `http://localhost:5173`
- [ ] Supabase connection verified
- [ ] Demo account logged in: `fbla-demo@example.com` (or seeded account)
- [ ] Pet stats at moderate levels (not all maxed out)

### 2. Browser Tabs Prepared
- [ ] Dashboard (`/dashboard`) - Main pet care interface
- [ ] AI Chat (`/dashboard` with chat open) - AI companion interface
- [ ] Analytics (`/analytics`) - Financial insights
- [ ] Budget Advisor (API endpoint ready) - Budget analysis feature

### 3. Test Data Ready
- [ ] Sample transactions for budget advisor
- [ ] Pet with varied stats (hunger: 40, happiness: 60, etc.)
- [ ] Wallet balance: 500+ coins

---

## Segment 1: AI Chat Companion (2:00 - 4:00)

### Introduction
**Narrator:** "Our AI companion uses advanced language models to provide personalized pet care guidance. Let me show you how it understands context and provides actionable advice."

### Demo Flow

#### 1.1 Natural Language Interaction
**Driver Actions:**
1. Open AI Chat sidebar on dashboard
2. Type: "How is my pet doing today?"
3. Wait for AI response

**Expected Response:**
- AI analyzes current pet stats
- Provides mood assessment (e.g., "Your pet is feeling content but could use some attention")
- Suggests specific actions based on stats

**Narrator Talking Points:**
- "The AI understands natural language queries"
- "It analyzes real-time pet statistics"
- "Provides contextual recommendations"

#### 1.2 Command-Based Actions
**Driver Actions:**
1. Type: "/feed"
2. Show pet stats update
3. Type: "/status"
4. Show detailed status report

**Expected Response:**
- `/feed` command triggers feeding action
- Stats update in real-time
- `/status` provides comprehensive pet state

**Narrator Talking Points:**
- "Supports both natural language and commands"
- "Real-time state synchronization"
- "Context-aware responses"

#### 1.3 Emotional Intelligence
**Driver Actions:**
1. Type: "My pet seems sad, what should I do?"
2. Show AI's empathetic response
3. Type: "Tell me a fun fact about pets"
4. Show engaging, educational response

**Expected Response:**
- Empathetic understanding of pet's emotional state
- Actionable suggestions
- Educational content when appropriate

**Narrator Talking Points:**
- "AI demonstrates emotional intelligence"
- "Adapts tone based on context"
- "Educational value for financial literacy"

---

## Segment 2: Budget Advisor AI (4:00 - 6:30)

### Introduction
**Narrator:** "Our Budget Advisor uses AI to analyze spending patterns, detect trends, and provide personalized financial recommendations."

### Demo Flow

#### 2.1 Transaction Analysis
**Driver Actions:**
1. Navigate to Analytics page
2. Click "Budget Analysis" or use API endpoint
3. Submit sample transaction data:
   ```json
   {
     "transactions": [
       {"amount": 45.50, "category": "food", "date": "2024-01-15"},
       {"amount": 120.00, "category": "shopping", "date": "2024-01-16"},
       {"amount": 35.00, "category": "food", "date": "2024-01-17"},
       {"amount": 200.00, "category": "entertainment", "date": "2024-01-18"},
       {"amount": 50.00, "category": "transport", "date": "2024-01-19"}
     ],
     "monthly_budget": 1000.00
   }
   ```

**Expected Response:**
- Total spending calculation
- Category breakdown
- Spending trends (increasing/decreasing/stable)
- Overspending alerts (if applicable)
- Actionable suggestions

**Narrator Talking Points:**
- "AI analyzes spending patterns across categories"
- "Detects trends automatically"
- "Provides severity-based alerts"
- "Generates personalized recommendations"

#### 2.2 Overspending Detection
**Driver Actions:**
1. Submit transactions with overspending:
   ```json
   {
     "transactions": [
       {"amount": 600.00, "category": "food", "date": "2024-01-15"},
       {"amount": 400.00, "category": "shopping", "date": "2024-01-16"}
     ],
     "monthly_budget": 1000.00
   }
   ```

**Expected Response:**
- High-severity overspending alert for food category
- Specific excess amount ($100 over budget)
- Critical recommendation message
- Medium-severity alert for shopping

**Narrator Talking Points:**
- "AI identifies overspending with severity levels"
- "Provides specific excess amounts"
- "Prioritizes critical issues"
- "Actionable recommendations for each category"

#### 2.3 Trend Analysis
**Driver Actions:**
1. Show trend analysis results
2. Highlight increasing/decreasing trends
3. Explain percentage changes

**Expected Response:**
- Trend indicators: "increasing", "decreasing", "stable"
- Percentage change calculations
- Average transaction amounts
- Transaction counts per category

**Narrator Talking Points:**
- "AI tracks spending trends over time"
- "Identifies patterns in user behavior"
- "Helps predict future spending"
- "Educational for financial literacy"

---

## Segment 3: AI-Powered Pet Interactions (6:30 - 8:00)

### Introduction
**Narrator:** "The AI companion learns from interactions and provides proactive guidance based on pet state."

### Demo Flow

#### 3.1 Proactive Notifications
**Driver Actions:**
1. Let pet stats decay (wait 30 seconds or manually lower stats)
2. Show AI notifications appearing
3. Click on notification to see AI's recommendation

**Expected Response:**
- Notification: "Your pet is getting hungry! Consider feeding soon."
- AI provides specific action suggestions
- Health forecast with risk assessment

**Narrator Talking Points:**
- "AI proactively monitors pet health"
- "Provides timely interventions"
- "Prevents negative outcomes"
- "Teaches responsibility through guidance"

#### 3.2 Context-Aware Suggestions
**Driver Actions:**
1. Type: "I want to save coins"
2. Show AI's budget-conscious suggestions
3. Type: "What's the best way to care for my pet?"
4. Show comprehensive care guide

**Expected Response:**
- Budget-aware recommendations
- Prioritized action list
- Educational content about pet care
- Financial literacy connections

**Narrator Talking Points:**
- "AI adapts to user goals"
- "Balances pet care with financial responsibility"
- "Educational value for students"
- "Real-world financial skills"

#### 3.3 Health Forecasting
**Driver Actions:**
1. Type: "/status"
2. Show health forecast section
3. Explain trend analysis
4. Show risk assessment

**Expected Response:**
- Health trend: "improving", "stable", "declining"
- Risk level: "low", "medium", "high"
- Recommended follow-up actions
- Time-based predictions

**Narrator Talking Points:**
- "AI predicts future health outcomes"
- "Helps users plan ahead"
- "Teaches cause-and-effect thinking"
- "Connects actions to consequences"

---

## Segment 4: Integration & Intelligence (8:00 - 9:30)

### Introduction
**Narrator:** "All AI features work together to provide a cohesive, intelligent experience."

### Demo Flow

#### 4.1 Cross-Feature Intelligence
**Driver Actions:**
1. Make a purchase in the shop
2. Check AI chat for spending analysis
3. Show how AI connects shop purchases to budget
4. Navigate to analytics to see updated insights

**Expected Response:**
- AI acknowledges recent purchase
- Provides budget context
- Suggests earning opportunities
- Analytics reflect new transaction

**Narrator Talking Points:**
- "AI connects all system components"
- "Provides unified experience"
- "Teaches financial connections"
- "Real-world application of concepts"

#### 4.2 Session Memory
**Driver Actions:**
1. Have a conversation with AI
2. Ask follow-up questions referencing previous messages
3. Show AI maintains context

**Expected Response:**
- AI remembers previous conversation
- Provides contextual responses
- Maintains session continuity
- Learns from interaction history

**Narrator Talking Points:**
- "AI maintains conversation context"
- "Personalized experience"
- "Adaptive learning"
- "Enhanced user engagement"

---

## Segment 5: Technical Highlights (9:30 - 10:00)

### Quick Technical Overview
**Narrator:** "Let me highlight the technical implementation."

### Key Points to Cover:
1. **API Endpoints:**
   - `POST /api/ai/chat` - Conversational AI
   - `POST /api/pet/interact` - Command-based interactions
   - `POST /api/budget-advisor/analyze` - Budget analysis

2. **AI Service Architecture:**
   - OpenRouter integration for LLM access
   - Fallback to deterministic responses
   - Context management and session handling
   - Error handling and retries

3. **Data Flow:**
   - Frontend → Backend → AI Service → Database
   - Real-time state synchronization
   - Caching for performance

4. **Educational Value:**
   - Financial literacy through AI guidance
   - Pattern recognition and analysis
   - Decision-making support
   - Real-world skill development

---

## Backup Plan

### If AI Services Fail:
1. **Use Fallback Responses:**
   - System has deterministic fallbacks
   - Pre-written responses maintain functionality
   - Demo can continue smoothly

2. **Show API Documentation:**
   - Open `http://localhost:8000/docs`
   - Demonstrate endpoint structure
   - Show request/response examples

3. **Use Pre-recorded Video:**
   - Reference `docs/demo-video.mp4`
   - Show AI features in action
   - Narrate over video

---

## Sample User Interactions Script

### Interaction 1: Initial Greeting
**User:** "Hello, how are you?"
**AI:** "Hello! I'm doing great, thank you for asking! I'm here to help you take care of your pet. How can I assist you today?"

### Interaction 2: Pet Status Check
**User:** "How is my pet doing?"
**AI:** "Your pet is currently feeling content! Here's the status:
- Health: 75/100 (Good)
- Hunger: 60/100 (Moderate)
- Happiness: 70/100 (Happy)
- Cleanliness: 80/100 (Clean)
- Energy: 65/100 (Moderate)

Your pet is in good shape! Consider playing together to boost happiness even more."

### Interaction 3: Feeding Command
**User:** "/feed"
**AI:** "Great! I've fed your pet. Hunger increased by 30 points. Your pet is now well-fed and happy! 🍽️

Current stats:
- Hunger: 90/100 (Well-fed)
- Coins remaining: 490

Your pet is looking satisfied!"

### Interaction 4: Budget Question
**User:** "I spent a lot on food this month. What should I do?"
**AI:** "I understand your concern about food spending. Let me help you analyze this:

Based on your recent transactions, you've spent $450 on food this month, which is 45% of your total budget. Here are some suggestions:

1. **Meal Planning:** Plan meals ahead to reduce impulse purchases
2. **Budget Tracking:** Set a weekly food budget and stick to it
3. **Smart Shopping:** Look for deals and buy in bulk when possible
4. **Cooking at Home:** Reduce restaurant spending

Would you like me to analyze your full budget to provide more specific recommendations?"

### Interaction 5: Educational Request
**User:** "Tell me about saving money"
**AI:** "Great question! Saving money is an important financial skill. Here are key concepts:

**The 50/30/20 Rule:**
- 50% for needs (food, housing, bills)
- 30% for wants (entertainment, shopping)
- 20% for savings

**Tips for Saving:**
1. Set savings goals (short-term and long-term)
2. Automate savings transfers
3. Track your spending to identify opportunities
4. Build an emergency fund (3-6 months of expenses)

In your virtual pet world, you can practice by:
- Setting aside coins for special items
- Planning purchases ahead
- Earning coins through mini-games
- Tracking spending in the analytics dashboard

Would you like to set a savings goal for your pet?"

### Interaction 6: Proactive Notification
**System:** (Pet hunger drops below 30)
**AI:** "⚠️ Alert: Your pet is getting hungry! Current hunger level is 25/100. 

I recommend feeding your pet soon to keep them healthy and happy. You can use the '/feed' command or click the Feed button on the dashboard.

Would you like me to help you feed your pet now?"

### Interaction 7: Trend Analysis Request
**User:** "Show me my spending trends"
**AI:** "Here's your spending analysis for the past month:

**Top Categories:**
1. Food: $450 (45% of total)
2. Shopping: $200 (20% of total)
3. Entertainment: $150 (15% of total)

**Trends:**
- Food spending: ⬆️ Increasing (+15% from last period)
- Shopping: ➡️ Stable
- Entertainment: ⬇️ Decreasing (-10% from last period)

**Recommendations:**
- Your food spending is trending upward. Consider meal planning to control costs.
- Great job reducing entertainment spending!
- Overall, you're on track, but watch food expenses.

Would you like a detailed budget analysis?"

---

## Presenter Tips

### Do's:
✅ Practice the flow at least twice before the demo  
✅ Have backup responses ready for common questions  
✅ Keep cursor movements deliberate and visible  
✅ Pause after each AI response to let judges read  
✅ Highlight educational value of each feature  
✅ Connect AI features to financial literacy goals  

### Don'ts:
❌ Don't rush through interactions  
❌ Don't skip error handling demonstrations  
❌ Don't forget to show both success and edge cases  
❌ Don't ignore questions about technical implementation  
❌ Don't forget to mention fallback mechanisms  

---

## Q&A Preparation

### Common Questions & Answers:

**Q: What AI model are you using?**  
A: "We use OpenRouter with Llama 4, which provides excellent performance while maintaining cost efficiency. We also have deterministic fallbacks for reliability."

**Q: How does the AI learn from user interactions?**  
A: "The AI maintains session context and analyzes pet state patterns. While it doesn't permanently learn between sessions, it provides personalized responses based on current context and historical patterns."

**Q: How accurate is the budget analysis?**  
A: "Our budget advisor uses statistical analysis to detect trends and patterns. It analyzes transaction data, calculates category spending, and identifies overspending with severity levels. The recommendations are based on established financial principles."

**Q: Can the AI handle errors gracefully?**  
A: "Yes, we have comprehensive error handling with retry logic and fallback responses. If the AI service is unavailable, the system provides deterministic responses to maintain functionality."

**Q: How does this teach financial literacy?**  
A: "The AI provides real-time feedback on spending decisions, explains financial concepts, and helps students understand cause-and-effect relationships between actions and financial outcomes."

---

## Success Metrics to Highlight

1. **Response Time:** AI responses typically under 2 seconds
2. **Accuracy:** Budget analysis correctly identifies trends and overspending
3. **Educational Value:** AI explanations help students understand financial concepts
4. **Reliability:** Fallback mechanisms ensure 100% uptime
5. **User Engagement:** Context-aware responses increase interaction quality

---

## Closing Statement

**Narrator:** "Our AI features transform the virtual pet experience into an educational tool that teaches financial literacy through intelligent guidance, personalized recommendations, and real-time analysis. The system demonstrates how AI can enhance learning while maintaining reliability and user engagement."

---

**End of Demo Script**

