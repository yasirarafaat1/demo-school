# School Demo - Backend

Node.js + Express API for School Management System.

## Setup

1. Copy environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your actual values:
- `PORT`: Server port (default: 5000)
- `FRONTEND_URL`: Frontend URL for CORS
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `RESEND_API_KEY`: Resend API key for emails
- School information variables

3. Install dependencies:
```bash
npm install
```

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Send Fee Email
```
POST /api/send-fee-email
```

### Database Operations
```
POST /api/database/:table
```
Operations: `select`, `insert`, `update`, `delete`

## Deployment

Deploy to any Node.js hosting service:
- Vercel (Serverless Functions)
- Heroku
- AWS EC2 + PM2
- DigitalOcean
- Railway

### Environment Variables for Deployment

Set these in your hosting platform:
- `PORT`: Server port
- `NODE_ENV`: production
- `FRONTEND_URL`: Your deployed frontend URL
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `RESEND_API_KEY`: Resend API key
- `SCHOOL_*`: School information

## Features

- RESTful API
- Email notifications (Resend)
- Database operations (Supabase)
- Rate limiting
- CORS configuration
- Security headers
- Error handling
