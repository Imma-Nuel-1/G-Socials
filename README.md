# Social Media Management Platform

A comprehensive full-stack social media management platform built with React, TypeScript, Express, and Prisma. This application helps users manage their social media presence across multiple platforms with AI-powered content generation, scheduling, analytics, and team collaboration features.

## 🚀 Features

- **Overview Dashboard** - Real-time metrics and engagement tracking
- **Content Calendar** - Visual scheduling and content planning
- **AI Assistant** - AI-powered content generation and suggestions
- **Analytics** - Comprehensive performance tracking and insights
- **Template Editor** - Visual template creation with layer management
- **Team Collaboration** - Real-time messaging and team coordination

## 🛠️ Tech Stack

### Frontend (client/)
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS 4** - Styling
- **Radix UI** - Headless components
- **Recharts** - Data visualization
- **Lucide React** - Icons

### Backend (server/)
- **Node.js + Express** - Server framework
- **Prisma** - ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **OpenAI** - AI integration

## 📁 Project Structure

```
social-media-manager/
├── client/                      # Frontend React Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx          # Main app with providers
│   │   │   └── components/
│   │   │       ├── layout/      # Layout components (Sidebar)
│   │   │       ├── views/       # Page-level view components
│   │   │       ├── ui/          # Reusable UI components (Shadcn/ui)
│   │   │       └── figma/       # Figma-specific components
│   │   │
│   │   ├── constants/           # Application constants
│   │   │   ├── platforms.ts     # Platform configurations
│   │   │   ├── tones.ts         # AI tone options
│   │   │   ├── navigation.ts    # Menu items & views
│   │   │   └── api.ts           # API endpoints
│   │   │
│   │   ├── context/             # React contexts
│   │   │   └── AppContext.tsx   # Global app state
│   │   │
│   │   ├── data/                # Mock data for development
│   │   │   ├── posts.ts         # Post data
│   │   │   ├── analytics.ts     # Analytics data
│   │   │   ├── templates.ts     # Template data
│   │   │   └── team.ts          # Team & messages data
│   │   │
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── usePosts.ts      # Post management
│   │   │   ├── useAuth.ts       # Authentication
│   │   │   └── useAnalytics.ts  # Analytics data
│   │   │
│   │   ├── services/            # API services
│   │   │   ├── api.ts           # Base API client
│   │   │   ├── postService.ts   # Post operations
│   │   │   ├── aiService.ts     # AI content generation
│   │   │   └── authService.ts   # Authentication
│   │   │
│   │   ├── types/               # TypeScript definitions
│   │   ├── utils/               # Utility functions
│   │   ├── styles/              # Global styles
│   │   └── main.tsx             # App entry point
│   │
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── server/                      # Backend Express API
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   ├── src/
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.ts          # JWT authentication
│   │   │   └── errorHandler.ts  # Error handling
│   │   ├── routes/              # API routes
│   │   │   ├── auth.ts          # Authentication
│   │   │   ├── posts.ts         # Post management
│   │   │   ├── ai.ts            # AI generation
│   │   │   ├── analytics.ts     # Analytics data
│   │   │   ├── templates.ts     # Template management
│   │   │   ├── team.ts          # Team messaging
│   │   │   └── upload.ts        # File uploads
│   │   └── server.ts            # Server entry point
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
│
├── guidelines/                  # Project guidelines
├── package.json                 # Root workspace package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Install all dependencies (root, client, and server)
npm run install:all
```

### Development

```bash
# Run frontend only
npm run dev:client

# Run backend only
npm run dev:server

# Run both simultaneously
npm run dev:all
```

### Build for Production

```bash
npm run build
```

## ⚙️ Environment Variables

### Server (.env)

Create a `.env` file in the `server/` directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/social_media_db

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# OpenAI (for AI features)
OPENAI_API_KEY=sk-your-openai-api-key

# Server
PORT=3001
NODE_ENV=development

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

## 📝 Available Scripts

### Root Level

| Script | Description |
|--------|-------------|
| `npm run dev` | Run frontend development server |
| `npm run dev:client` | Run frontend only |
| `npm run dev:server` | Run backend only |
| `npm run dev:all` | Run both frontend and backend |
| `npm run build` | Build both client and server |
| `npm run install:all` | Install all dependencies |
| `npm run clean` | Remove all node_modules |

### Client

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

### Server

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm run start` | Run production server |
| `npm run db:migrate` | Run database migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:studio` | Open Prisma Studio |

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Posts
- `GET /api/posts` - List all posts
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/publish` - Publish post
- `POST /api/posts/:id/schedule` - Schedule post

### AI
- `POST /api/ai/generate` - Generate content
- `POST /api/ai/analyze` - Analyze content
- `POST /api/ai/suggestions` - Get suggestions

### Analytics
- `GET /api/analytics/overview` - Overview stats
- `GET /api/analytics/engagement` - Engagement data
- `GET /api/analytics/platforms` - Platform distribution

### Templates
- `GET /api/templates` - List templates
- `GET /api/templates/:id` - Get template

### Team
- `GET /api/team/members` - List team members
- `GET /api/team/messages` - Get messages
- `POST /api/team/messages` - Send message

## 📄 License

MIT
