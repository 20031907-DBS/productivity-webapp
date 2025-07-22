# productivity-webapp

### System Architecture


┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express API    │    │   MongoDB       │
│                 │◄──►│                 │◄──►│   Database      │
│  - Components   │    │  - Routes       │    │  - Users        │
│  - State Mgmt   │    │  - Middleware   │    │  - Analyses     │
│  - Auth Context │    │  - Services     │    │  - Sessions     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  External APIs  │
                       │                 │
                       │  - Ollama AI    │
                       │  - YouTube API  │
                       │  - Google OAuth │
                       └─────────────────┘



### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/google` | Google OAuth |

### Analysis Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analysis/analyze` | Analyze video |
| GET | `/api/analysis/history` | Get user history |
| GET | `/api/analysis/:id` | Get specific analysis |
| DELETE | `/api/analysis/:id` | Delete analysis |
| GET | `/api/analysis/stats/summary` | Get user statistics |


### Local Development Setup

1. **Clone the repository**
   
   git clone https://github.com/yourusername/youtube-learning-analyzer.git
   cd youtube-learning-analyzer
   

2. **Install backend dependencies**
   
   npm install
   

3. **Install frontend dependencies**
   
   cd client
   npm install
   cd ..
   

4. **Set up environment variables**
  
   cp .env.example .env
   # Edit .env with your configuration
   

5. **Install and setup Ollama**
   
   # Install Ollama (visit https://ollama.ai)
   ollama pull deepseek-r1:1.5b
   ollama serve
   

6. **Start the application**
   
   # Terminal 1 - Backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd client
   npm start
