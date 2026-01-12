# School Demo - Full Stack Application

Complete school management system with separate frontend and backend.

## Structure

```
School-demo/
├── frontend/          # React frontend (deployable separately)
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── .env.example
│   └── README.md
└── backend/           # Node.js backend (deployable separately)
    ├── server.js
    ├── api/
    ├── package.json
    ├── .env.example
    └── README.md
```

## Quick Start

### Frontend Only
```bash
cd frontend
cp .env.example .env
# Edit .env with your values
npm install
npm run dev
```

### Backend Only
```bash
cd backend
cp .env.example .env
# Edit .env with your values
npm install
npm run dev
```

## Deployment

### Frontend Deployment
- Deploy `frontend/` folder to Vercel, Netlify, or any static hosting
- Set environment variables in hosting platform

### Backend Deployment
- Deploy `backend/` folder to Vercel, Heroku, or any Node.js hosting
- Set environment variables in hosting platform

## Environment Variables

Both frontend and backend have their own `.env.example` files with detailed explanations.

## Features

- Student Management
- Fee Management
- Result Management
- Gallery System
- Email Notifications
- Admin Dashboard
- Responsive Design

## Technologies

- **Frontend**: React, Vite, Bootstrap, React Router
- **Backend**: Node.js, Express, Supabase, Resend
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend
