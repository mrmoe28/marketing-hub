# Clientbase

Production-ready Next.js app for importing past customers, organizing client folders, segmenting audiences, AI-writing human emails, and sending campaigns at scale.

## Features

- **CSV Import**: Upload customer lists with smart column mapping
- **Client Management**: Organize with tags, segments, and per-client file folders
- **AI Email Writing**: Claude-powered humanized email copy
- **Campaign Management**: Draft, schedule, and send email campaigns
- **Tracking**: Opens, clicks, and unsubscribe handling
- **Storage**: Vercel Blob (default) with swappable S3/Supabase

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Prisma + PostgreSQL (Neon/Supabase/local)
- Tailwind CSS + shadcn/ui
- Resend (email) + Anthropic Claude (AI)
- Vercel Blob (storage)

## Setup

1. Clone and install:
```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your keys

3. Set up database:
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

4. Run dev server:
```bash
npm run dev
```

Visit `http://localhost:3000`

## Environment Variables

See `.env.example` for full list. Required:
- `DATABASE_URL` - Postgres connection string
- `RESEND_API_KEY` - For sending emails
- `ANTHROPIC_API_KEY` - For AI email writing
- `APP_URL` - Your app URL (for tracking links)
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format with Prettier
- `npm run db:migrate` - Run Prisma migrations
- `npm run db:seed` - Seed database
- `npm run db:studio` - Open Prisma Studio
