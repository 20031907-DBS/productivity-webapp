# 🎯 Local AI Video Analyzer

A privacy-first productivity web application that analyzes YouTube videos using local AI models (Whisper + Qwen3) to help users determine if content matches their learning intentions.

## ✨ Features

### 🔐 User Authentication
- **User Registration & Login**: Secure account creation and authentication
- **Role-based Access**: User and Admin roles with different permissions
- **Session Management**: Persistent login with localStorage
- **Admin Panel**: Separate admin interface with hardcoded credentials

### 🎥 Video Analysis
- **YouTube Integration**: Analyze any YouTube video by URL
- **Local AI Processing**: Uses Whisper for transcription and Qwen3 for analysis
- **Learning Intention Matching**: Determines how well video content matches your learning goals
- **Privacy-First**: All processing happens locally, no data sent to external services

### 👑 Admin Dashboard
- **User Management**: Complete CRUD operations for user accounts
- **Role Management**: Promote/demote users between admin and regular user roles
- **User Statistics**: View user count, creation dates, and account details
- **Separate Access**: Independent admin panel with dedicated login

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop and mobile
- **React Router**: Proper URL routing with browser navigation support
- **Clean Interface**: Modern, intuitive design with smooth animations
- **Real-time Feedback**: Loading states, error handling, and success messages

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express API    │    │   MongoDB       │
│                 │◄──►│                 │◄──►│   Database      │
│  - Auth Context │    │  - Auth Routes  │    │  - Users        │
│  - Admin Panel  │    │  - Admin Routes │    │  - Analyses     │
│  - Video UI     │    │  - Analysis API │    │  - Sessions     │
│  - React Router │    │  - Middleware   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Local AI      │
                       │                 │
                       │  - Whisper      │
                       │  - Qwen3 (8B)   │
                       │  - Ollama       │
                       └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Ollama (for local AI models)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd productivity-webapp
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection string and other config
   ```

5. **Install and setup Ollama**
   ```bash
   # Install Ollama (visit https://ollama.ai)
   ollama pull qwen3:8b
   ollama serve
   ```

6. **Start the application**
   ```bash
   # Terminal 1 - Backend (port 3001)
   npm run dev
   
   # Terminal 2 - Frontend (port 3000)
   cd client
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | User registration | Public |
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/register-admin` | Admin registration (dev only) | Public |

### Admin Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/admin/users` | Get all users | Admin |
| POST | `/api/admin/users` | Create new user | Admin |
| PUT | `/api/admin/users/:id` | Update user | Admin |
| DELETE | `/api/admin/users/:id` | Delete user | Admin |

### Analysis Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/analyze` | Analyze YouTube video | Authenticated |

## 🎯 Usage

### For Regular Users

1. **Access the app**: Navigate to `http://localhost:3000`
2. **Register/Login**: Create an account or sign in
3. **Analyze Videos**: 
   - Paste a YouTube URL
   - Enter your learning intention
   - Get AI-powered analysis results

### For Administrators

1. **Access Admin Panel**: 
   - Click "🔐 Admin Panel Access" on login screen
   - Or navigate directly to `http://localhost:3000/admin-panel`
2. **Login with hardcoded credentials**:
   - Username: `superadmin`
   - Password: `admin123`
3. **Manage Users**:
   - View all registered users
   - Create, edit, or delete user accounts
   - Change user roles (admin/user)

## 🔧 Configuration

### Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/productivity-webapp

# Server
PORT=3001
NODE_ENV=development

# AI Models
WHISPER_MODEL=base
OLLAMA_MODEL=qwen3:8b

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Admin Credentials

For development, admin access uses hardcoded credentials:
- **Username**: `superadmin`
- **Password**: `admin123`

*Note: Change these in production by updating the `ADMIN_CREDENTIALS` object in `AdminLogin.js`*

## 🛠️ Tech Stack

### Frontend
- **React 19**: Modern React with hooks and context
- **React Router**: Client-side routing
- **CSS3**: Custom styling with animations
- **Axios**: HTTP client for API calls

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: Database with Mongoose ODM
- **bcryptjs**: Password hashing
- **CORS**: Cross-origin resource sharing

### AI & Processing
- **Ollama**: Local AI model management
- **Whisper**: Speech-to-text transcription
- **Qwen3**: Large language model for analysis
- **ytdl-core**: YouTube video processing

## 📱 Routes

### Public Routes
- `/` - Redirects to dashboard
- `/dashboard` - Main application (login required)
- `/admin-panel` - Admin panel with separate authentication

### Dashboard Sub-routes
- `/dashboard` - Video analyzer interface
- `/dashboard/admin` - Admin dashboard (admin users only)

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **Role-based Access**: Admin/user role separation
- **Input Validation**: Server-side validation for all inputs
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Configured for specific origins
- **Local Processing**: No external AI service dependencies

## 🚧 Development

### Project Structure
```
productivity-webapp/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   └── App.js          # Main app component
├── routes/                 # Express routes
├── models/                 # MongoDB models
├── services/               # Business logic
├── config/                 # Configuration files
└── server.js              # Express server
```

### Available Scripts

**Backend:**
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

**Frontend:**
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Ollama** for local AI model management
- **OpenAI Whisper** for speech recognition
- **Qwen Team** for the language model
- **React Team** for the amazing framework
