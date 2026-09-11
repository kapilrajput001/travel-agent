# ✈️ TravelBot AI — IBM Granite Travel Planner Agent

An AI-powered travel planning agent built with **IBM Granite** (via IBM WatsonX) and **Node.js/Express** backend with a responsive HTML/CSS/JS frontend.

## 🌟 Features

- **💬 AI Chat** — Conversational travel assistant with full context history
- **🗺️ Itinerary Planner** — Generate detailed day-by-day travel itineraries
- **🌍 Destination Explorer** — AI-powered destination suggestions based on preferences
- **🌤️ Weather Advisor** — Climate insights and best time-to-visit guidance
- **🎒 Packing List Generator** — Personalized packing lists by destination & activities
- **💰 Budget Optimization** — Smart budget breakdowns and cost-saving tips

## 🏗️ Architecture

```
Travel Agent/
├── backend/
│   ├── server.js              # Express.js main server
│   ├── services/
│   │   └── ibmGranite.js      # IBM WatsonX + Granite AI service
│   └── routes/
│       ├── chat.js            # /api/chat — conversational AI
│       ├── itinerary.js       # /api/itinerary — trip planning
│       ├── destinations.js    # /api/destinations — explore places
│       └── weather.js         # /api/weather — weather insights
├── frontend/
│   ├── index.html             # Main SPA page
│   ├── style.css              # Complete responsive stylesheet
│   └── app.js                 # Frontend JavaScript (API calls, UI)
├── package.json
└── config.env                 # Environment variables template
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `config.env` to `.env` (the app reads `.env` automatically):

```bash
# Windows PowerShell
Copy-Item config.env .env

# Linux/Mac
cp config.env .env
```

The `.env` file is pre-configured with your IBM credentials:
- `IBM_API_KEY` — Your IBM Cloud API key
- `IBM_PROJECT_ID` — Your WatsonX project ID
- `IBM_MODEL_ID` — `ibm/granite-4-h-small`
- `IBM_API_URL` — WatsonX inference endpoint
- `PORT` — Server port (default: 3000)

### 3. Start the Server

```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

### 4. Open the App

Visit **http://localhost:3000** in your browser 🎉

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check + model info |
| POST | `/api/chat` | Chat with conversation history |
| POST | `/api/chat/quick` | Single-turn chat |
| POST | `/api/itinerary/generate` | Full itinerary generation |
| POST | `/api/itinerary/optimize` | Optimize existing itinerary |
| POST | `/api/itinerary/packing-list` | Generate packing list |
| POST | `/api/destinations/suggest` | AI destination suggestions |
| GET | `/api/destinations/popular` | Popular destinations |
| POST | `/api/destinations/info` | Detailed destination info |
| POST | `/api/weather/advice` | Weather travel advice |
| POST | `/api/weather/best-time` | Best time to visit |

## 💡 Example API Usage

### Chat

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Plan a 5-day trip to Paris"}]}'
```

### Generate Itinerary

```bash
curl -X POST http://localhost:3000/api/itinerary/generate \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Tokyo, Japan",
    "days": 7,
    "budget": 3000,
    "travelers": 2,
    "travelStyle": "cultural",
    "preferences": ["food & cuisine", "history & culture"]
  }'
```

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| AI Model | IBM Granite 4 (`ibm/granite-4-h-small`) |
| AI Platform | IBM WatsonX (IBM Cloud) |
| Backend | Node.js + Express.js |
| Auth | IBM IAM Token (auto-refreshed) |
| Cache | node-cache (IAM token caching) |
| Security | Helmet.js + rate-limiting |
| Frontend | Vanilla HTML5 / CSS3 / JavaScript |
| Fonts | Google Fonts — Inter |

## 📋 Problem Statement

**Problem Statement #5 — Travel Planner Agent**

This solution addresses the challenge of building an AI-powered travel planning assistant that:
- ✅ Uses real-time AI suggestions for destinations, itineraries, and transport
- ✅ Understands user preferences, budgets, and constraints
- ✅ Provides personalized travel plans
- ✅ Offers weather insights and local guides
- ✅ Powered by **IBM Granite** (mandatory IBM Cloud Lite service)
- ✅ Fully integrated chat interface with conversational memory
