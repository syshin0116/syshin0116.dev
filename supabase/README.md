# Supabase Integration

This directory contains SQL schema files and migration scripts for Supabase integration.

## Quick Start

### 1. Create Supabase Project

Sign up at https://supabase.com and create a new project.

### 2. Set Up Database Schema

Run the SQL in `schema.sql` in your Supabase SQL Editor:
- Creates tables: `projects_timeline`, `projects_detail`, `events`
- Sets up indexes and Row Level Security
- Enables auto-update triggers

### 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and add your credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Seed Data

Migrate data from static files to Supabase:
```bash
npx tsx scripts/seed-supabase.ts
```

## Files

- **`schema.sql`**: Database schema definition
- **`../scripts/seed-supabase.ts`**: Data migration script

## Documentation

For detailed setup instructions, see [SUPABASE_SETUP.md](../docs/SUPABASE_SETUP.md)

## Features

✅ PostgreSQL database with typed schema  
✅ Row Level Security for public read access  
✅ Auto-update timestamps  
✅ Optimized indexes for queries  
✅ Fallback to static data if not configured  
✅ Type-safe queries with TypeScript
