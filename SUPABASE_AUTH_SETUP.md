# Quick Setup Guide: Supabase Authentication

This guide will help you set up Supabase authentication with Google and GitHub OAuth in under 10 minutes.

## Prerequisites

- A Supabase account (free tier is fine)
- A Google Cloud Console account
- A GitHub account

## Step 1: Create Supabase Project (2 minutes)

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in project details:
   - Project name: Your choice
   - Database password: Generate a strong password
   - Region: Choose closest to your users
4. Click "Create new project" and wait for setup to complete

## Step 2: Configure Google OAuth (3 minutes)

### In Google Cloud Console:

1. Go to https://console.cloud.google.com
2. Create a new project or select existing one
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add these URIs:
   - **Authorized JavaScript origins:**
     - `http://localhost:3000`
     - `https://yourdomain.com` (your production domain)
   - **Authorized redirect URIs:**
     - Find your Supabase redirect URL in next step
7. Save and copy the **Client ID** and **Client Secret**

### In Supabase Dashboard:

1. Go to Authentication → Providers → Google
2. Enable Google provider
3. Copy the **Callback URL (for OAuth)** (looks like: `https://xxx.supabase.co/auth/v1/callback`)
4. Add this URL to your Google Cloud Console redirect URIs
5. Paste your Google Client ID and Client Secret
6. Click "Save"

## Step 3: Configure GitHub OAuth (2 minutes)

### In GitHub:

1. Go to https://github.com/settings/developers
2. Click "OAuth Apps" → "New OAuth App"
3. Fill in:
   - Application name: Your app name
   - Homepage URL: `http://localhost:3000` (or your domain)
   - Authorization callback URL: (Use the same Supabase callback URL from Step 2)
4. Click "Register application"
5. Copy the **Client ID**
6. Click "Generate a new client secret" and copy it

### In Supabase Dashboard:

1. Go to Authentication → Providers → GitHub
2. Enable GitHub provider
3. Paste your GitHub Client ID and Client Secret
4. Click "Save"

## Step 4: Configure Your Application (1 minute)

1. Get your Supabase credentials:
   - Go to Project Settings → API
   - Copy **Project URL**
   - Copy **anon/public** key

2. Create `.env.local` file in your project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Google (for One-Touch login)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

3. Replace the placeholder values with your actual credentials

## Step 5: Test (2 minutes)

1. Start your development server:
```bash
npm run dev
```

2. Visit http://localhost:3000/login

3. Test each authentication method:
   - Click "Continue with Google" → Should redirect to Google
   - Click "Continue with GitHub" → Should redirect to GitHub
   - After signing in once with Google, refresh the page → One-Touch should appear

4. After successful login:
   - You should see your avatar in the navbar
   - Click avatar → Should show user menu with sign out option

## Troubleshooting

### "Invalid redirect URI" error
- Make sure the redirect URI in your OAuth app exactly matches your Supabase callback URL
- Check for trailing slashes or typos

### Google One-Touch not showing
- Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set correctly
- Make sure authorized JavaScript origins include your domain
- One-Touch only shows after first successful Google sign-in

### Session not persisting
- Check that all environment variables are set
- Make sure `middleware.ts` is configured correctly
- Clear browser cookies and try again

### Still having issues?
- Check browser console for errors
- Check Supabase logs: Dashboard → Logs → Auth
- Verify all redirect URIs are correctly configured
- Make sure you're using HTTPS in production

## Production Deployment

Before deploying to production:

1. Add production domain to Google OAuth authorized origins
2. Add production domain to GitHub OAuth homepage URL
3. Set environment variables in your hosting platform (Vercel, Netlify, etc.)
4. Test authentication on production domain
5. Enable email verification (optional) in Supabase auth settings

## Need Help?

- Detailed documentation: See `docs/SUPABASE_AUTH_IMPLEMENTATION.md`
- Supabase Docs: https://supabase.com/docs/guides/auth
- Next.js Auth Docs: https://nextjs.org/docs/app/building-your-application/authentication

---

✅ **Setup Complete!** You now have a fully functional authentication system with Google and GitHub OAuth, including Google One-Touch login.
