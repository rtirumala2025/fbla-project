# Companion Pet Backend API

Simple FastAPI backend for handling AI responses and complex business logic.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. Run server:
```bash
python server.py
# Or with hot reload:
uvicorn server:app --reload
```

Server will run on http://localhost:8000

## API Documentation

Once running, visit:
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

