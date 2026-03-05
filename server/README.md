# ============================================
# BACKEND README
# Social Media Management Platform API
# ============================================

## Overview

This is the backend API for the Social Media Management Platform. Built with Node.js, Express, TypeScript, and Prisma.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **AI**: OpenAI API
- **File Upload**: Multer

## Getting Started

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `OPENAI_API_KEY` - OpenAI API key for AI features

### 3. Set Up Database

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Posts
- `GET /api/posts` - List all posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/publish` - Publish post
- `POST /api/posts/:id/schedule` - Schedule post

### AI Assistant
- `POST /api/ai/generate` - Generate content
- `POST /api/ai/analyze` - Analyze content
- `POST /api/ai/suggestions` - Get suggestions

### Analytics
- `GET /api/analytics/overview` - Overview stats
- `GET /api/analytics/engagement` - Engagement data
- `GET /api/analytics/platforms` - Platform distribution
- `GET /api/analytics/top-posts` - Top performing posts

### Templates
- `GET /api/templates` - List templates
- `GET /api/templates/:id` - Get template

### Team
- `GET /api/team/members` - List team members
- `GET /api/team/messages` - Get messages
- `POST /api/team/messages` - Send message
- `GET /api/team/conversations` - Get conversations

### Upload
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/media` - Upload multiple files

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── middleware/
│   │   ├── auth.ts        # Authentication middleware
│   │   └── errorHandler.ts # Error handling
│   ├── routes/
│   │   ├── auth.ts        # Auth routes
│   │   ├── posts.ts       # Posts routes
│   │   ├── ai.ts          # AI routes
│   │   ├── analytics.ts   # Analytics routes
│   │   ├── templates.ts   # Templates routes
│   │   ├── team.ts        # Team routes
│   │   └── upload.ts      # Upload routes
│   └── server.ts          # Entry point
├── uploads/               # Uploaded files
├── .env.example           # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## Development Notes

- Routes currently use in-memory storage for development
- Replace with Prisma database calls for production
- OpenAI integration is mocked - uncomment code when API key is ready
