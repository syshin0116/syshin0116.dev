# Supabase Setup Guide

This guide will help you set up Supabase for the AppHub project.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js 18+ installed
- Environment variables configured

## Step 1: Create a Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in the project details:
   - **Name**: AppHub (or your preferred name)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose the region closest to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (this may take a few minutes)

## Step 2: Get Your API Credentials

Once your project is ready:

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (⚠️ Keep this secret!)

## Step 3: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Update `.env.local` with your Supabase credentials:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

⚠️ **Important**: Never commit `.env.local` to version control. It's already in `.gitignore`.

## Step 4: Create Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Copy the contents of `supabase/schema.sql` and paste it into the editor
4. Click "Run" to execute the SQL

This will create:
- Three tables: `projects_timeline`, `projects_detail`, and `events`
- Indexes for optimized queries
- Row Level Security (RLS) policies for public read access
- Auto-update triggers for `updated_at` timestamps

### Tables Created

#### `projects_timeline`
Stores timeline information for all projects.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (project ID) |
| title | TEXT | Project title |
| period | TEXT | Period string (e.g., "2024.03 ~ 진행 중") |
| year | INTEGER | Year of the project |
| period_type | ENUM('Q', 'H') | Quarter or Half-year |
| period_number | INTEGER | Period number (1-4 for Q, 1-2 for H) |
| is_completed | BOOLEAN | Whether the project is completed |
| description | TEXT | Project description |
| tags | TEXT[] | Array of tags |
| category | ENUM('company', 'personal') | Project category |

#### `projects_detail`
Stores detailed information for each project.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (references projects_timeline.id) |
| title | TEXT | Project title |
| subtitle | TEXT | Project subtitle |
| period | TEXT | Period string |
| duration | TEXT | Duration string |
| role | TEXT | Your role in the project |
| team | TEXT | Team information |
| description | TEXT | Detailed description |
| tech_stack | JSONB | Technology stack (nested object) |
| achievements | JSONB | Project achievements |
| key_features | JSONB | Key features |
| key_responsibilities | JSONB | Key responsibilities |
| business_goals | JSONB | Business goals |
| architecture_evolution | JSONB | Architecture evolution |
| challenges | JSONB | Challenges faced |
| learnings | TEXT[] | Learnings from the project |

#### `events`
Stores timeline events.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| year | INTEGER | Year of the event |
| period_type | ENUM('Q', 'H') | Quarter or Half-year |
| period_number | INTEGER | Period number |
| is_checked | BOOLEAN | Whether the event is completed |
| events | JSONB | Array of event objects |

## Step 5: Seed Initial Data

After creating the schema, you can seed the database with data from your static files:

1. Make sure your `.env.local` is configured
2. Run the seed script:
   ```bash
   npx tsx scripts/seed-supabase.ts
   ```

The script will:
- Load data from `data/projects.ts` and `data/events.ts`
- Insert data into Supabase tables
- Verify the data was inserted correctly

### Expected Output

```
🚀 Starting Supabase data migration...
   URL: https://xxxxx.supabase.co

📦 Seeding projects_timeline table...
✅ Successfully seeded 15 projects to timeline

📦 Seeding projects_detail table...
✅ Successfully seeded 13 project details

📦 Seeding events table...
✅ Successfully seeded 2 events

🔍 Verifying seeded data...

📊 Database Statistics:
  - Projects Timeline: 15 records
  - Projects Detail: 13 records
  - Events: 2 records

✨ Migration completed successfully!

💡 Next steps:
  1. Verify data in Supabase dashboard
  2. Update your components to fetch from Supabase
  3. Test the application
```

## Step 6: Verify Data in Supabase

1. Go to **Table Editor** in your Supabase dashboard
2. Check each table to verify data was inserted correctly:
   - `projects_timeline` should have ~15 records
   - `projects_detail` should have ~13 records
   - `events` should have ~2 records

## Step 7: Test the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/projects
3. Verify that projects are loading from Supabase

The application will automatically fall back to static data if Supabase is not configured.

## Architecture

### Data Flow

```
┌─────────────────┐
│   Next.js App   │
│   (Server Side) │
└────────┬────────┘
         │
         │ uses
         │
┌────────▼────────────────┐
│ lib/supabase-queries.ts │
│                         │
│ - getProjectsTimeline() │
│ - getProjectDetail()    │
│ - getEvents()           │
└────────┬────────────────┘
         │
         │ calls
         │
┌────────▼────────┐      ┌──────────────────┐
│ lib/supabase.ts │─────▶│ Supabase Client  │
│                 │      │ (@supabase/...)  │
└─────────────────┘      └────────┬─────────┘
                                  │
                                  │
                         ┌────────▼────────┐
                         │   Supabase DB   │
                         │  (PostgreSQL)   │
                         └─────────────────┘
```

### Fallback Mechanism

The application includes a fallback mechanism:
- If Supabase credentials are not configured, it uses static data from `data/` folder
- This allows development without Supabase setup
- In production, always configure Supabase for dynamic data

## Security

### Row Level Security (RLS)

The database schema includes RLS policies:
- **Public Read Access**: Anyone can read projects and events
- **Authenticated Write Access**: Only authenticated users can modify data (commented out by default)

To enable authentication:
1. Uncomment the authentication policies in `supabase/schema.sql`
2. Set up Supabase Auth in your application
3. Implement authentication UI

### API Keys

- **`NEXT_PUBLIC_SUPABASE_URL`**: Safe to expose (client-side)
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Safe to expose (client-side, respects RLS)
- **`SUPABASE_SERVICE_ROLE_KEY`**: ⚠️ **KEEP SECRET** (bypasses RLS, server-side only)

## Troubleshooting

### Error: Missing Supabase credentials

**Problem**: Environment variables not loaded

**Solution**:
1. Verify `.env.local` exists and contains the correct values
2. Restart the development server after updating `.env.local`
3. Check that variable names match exactly (including `NEXT_PUBLIC_` prefix)

### Error: relation "projects_timeline" does not exist

**Problem**: Database schema not created

**Solution**:
1. Go to SQL Editor in Supabase dashboard
2. Run the contents of `supabase/schema.sql`
3. Verify tables were created in Table Editor

### Error: insert or update on table "projects_detail" violates foreign key constraint

**Problem**: Trying to insert project details without corresponding timeline entry

**Solution**:
1. Seed `projects_timeline` first
2. Then seed `projects_detail`
3. The seed script handles this order automatically

### Application shows static data instead of Supabase data

**Possible causes**:
1. Environment variables not configured
2. Supabase connection error
3. Tables are empty

**Solution**:
1. Check browser console and server logs for error messages
2. Verify environment variables are set correctly
3. Run the seed script to populate data
4. Check Supabase dashboard for any service issues

## Maintenance

### Updating Data

To update data in Supabase:

1. **Via Supabase Dashboard**:
   - Go to Table Editor
   - Click on a row to edit
   - Save changes

2. **Via Seed Script**:
   - Update `data/projects.ts` or `data/events.ts`
   - Run `npx tsx scripts/seed-supabase.ts`
   - The script uses `upsert` to update existing records

3. **Via API**:
   - Create API routes in `app/api/`
   - Use `supabaseAdmin` from `lib/supabase.ts` for server-side writes

### Backup

Supabase provides automatic daily backups. To create a manual backup:
1. Go to **Settings** → **Database** → **Backups**
2. Click "Create backup"

To download data:
```bash
# Export as SQL
npx supabase db dump -f backup.sql

# Export specific table
npx supabase db dump -t projects_timeline -f projects.sql
```

## Next Steps

- [ ] Set up Supabase Auth for user authentication
- [ ] Add admin panel for managing projects
- [ ] Implement image uploads with Supabase Storage
- [ ] Add real-time subscriptions for live updates
- [ ] Set up database backups and monitoring

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## Support

If you encounter any issues:
1. Check the [Supabase Community](https://github.com/orgs/supabase/discussions)
2. Review [common issues](https://github.com/supabase/supabase/issues)
3. Contact the project maintainer
