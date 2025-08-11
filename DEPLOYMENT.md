# Deployment Guide

This guide covers deployment for the Who's Night? application, focusing on the modern Supabase architecture for both web and mobile deployment.

## Web Application Deployment

The recommended way to deploy the Who's Night? web application is to use a modern hosting provider like Vercel or Netlify, which integrates directly with your Git repository.

### Environment Variables
You must configure the following environment variables in your hosting provider's dashboard:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_anon_key
```

### Recommended: Vercel + Supabase
1. **Connect GitHub repo to Vercel.**
2. **Set the environment variables** listed above in the Vercel project settings.
3. **Deploy automatically** on every `git push`.

### Alternative: Netlify
1. **Connect GitHub repo to Netlify.**
2. **Set the environment variables** in the Netlify site settings.
3. The `netlify.toml` file in this repository is pre-configured for deployment.

## Backend Deployment (Supabase)

The entire backend is handled by Supabase. The necessary setup steps are:
1. **Deploy Edge Functions:** `supabase functions deploy`
2. **Run Database Migrations:** `supabase db push`
3. **Configure RLS Policies:** Ensure the RLS policies in the `supabase/migrations` folder are active.
4. **Set up Auth:** Configure Supabase Auth settings, including email templates and third-party providers if any.

## iOS App Store Deployment

For detailed instructions on how to build, configure, and deploy the app to the iOS App Store, please see the `iOS-SETUP.md` file. It is the single source of truth for the entire iOS release process.