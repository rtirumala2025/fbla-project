# Virtual Pet FBLA Project

A comprehensive virtual pet application that teaches financial literacy through interactive pet care, built with React, FastAPI, and AI integration.

## 🚀 Features
- 🐾 Adopt and care for virtual pets
- 💰 Learn financial management through gameplay
- 🤖 AI-powered pet emotions and recommendations (Llama 3 70B via OpenRouter)
- 🧠 MCP Context Management for persistent conversations
- 🎮 Interactive minigames
- 📊 Daily progress tracking and leaderboards

## 🛠️ Setup
1. Install dependencies:
   ```bash
   npm install
   pip install -r requirements.txt
   ```
2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase and OpenRouter API keys
   ```
3. Start development servers:
   - Frontend: `npm start`
   - Backend: `uvicorn backend.app:app --reload`

## 🏗️ Project Structure
```
backend/
├── app.py              # FastAPI application
├── routes/             # API routes
│   ├── auth.py        # Authentication endpoints
│   └── ai.py          # AI chat endpoints
├── services/          # Business logic
│   └── ai_service.py  # OpenRouter integration
├── mcp/               # Model Context Protocol
│   └── context_manager.py  # Session and context management
└── schemas/           # Pydantic models
    └── ai_schemas.py  # AI request/response models
```

## 🧪 Testing
Run the test suite with:
```bash
pytest backend/tests/
```

## 📈 Development Progress

### ✅ Completed
- [x] Firebase to Supabase migration
- [x] User authentication (JWT)
- [x] Basic pet management
- [x] AI integration with OpenRouter
- [x] MCP context management
- [x] Real-time chat interface

### 🧩 In Progress
- [ ] Pet growth and evolution system
- [ ] Financial literacy minigames
- [ ] Leaderboard implementation
- [ ] Advanced AI personality traits

### 📅 Upcoming
- [ ] Multi-pet support
- [ ] Social features
- [ ] Mobile app
- `frontend/` - React application
- `docs/` - Documentation and diagrams
- `presentation/` - Competition materials
- `scripts/` - Utility scripts
- `config/` - Configuration files
