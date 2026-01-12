# School Demo - Frontend

React frontend for School Management System.

## Setup

1. Copy environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your actual values:
- `VITE_API_BASE_URL`: Backend API URL
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- School information variables

3. Install dependencies:
```bash
npm install
```

## Development

```bash
npm run dev
```

## Build for Production

```bash
npm run build
```

## Deployment

Deploy the `dist/` folder to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

### Environment Variables for Deployment

Set these in your hosting platform:
- `VITE_API_BASE_URL`: Your deployed backend URL
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VITE_SCHOOL_*`: School information

## Features

- Responsive design
- Student management
- Fee management
- Result management
- Gallery system
- Admin dashboard
- Email notifications
