# Who's Night? - Capacitor iOS App

A co-parenting coordination app built with React, TypeScript, and Supabase.

## Recent Fixes and Improvements

### Critical Issues Resolved ✅

1. **Event Creation Getting Stuck** 
   - Fixed event functionality migrating from Express API endpoints to direct Supabase database operations
   - Event creation, editing, and deletion now work properly in `date-assignment-sheet.tsx` and `calendar-view.tsx`

2. **Users Stuck in Onboarding Loop**
   - Resolved database field name mismatch (`familyId` → `family_id`) in auth-provider
   - Users with complete profiles now skip onboarding automatically

3. **Missing User Features**
   - Added logout functionality to Home page header
   - Implemented family code display with copy-to-clipboard
   - Removed manual role selector; now uses authenticated user's actual role

4. **Authentication System**
   - Fully migrated from Express API to Supabase Auth
   - Fixed duplicate email registration with proper error handling
   - Added Supabase configuration for email confirmation redirects

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Mobile**: Capacitor for iOS deployment
- **UI**: Tailwind CSS + shadcn/ui components

## Database Migration Status

✅ **Completed**: Migration from Express API to Supabase
- All data access now uses Supabase client calls
- Supabase Edge Functions for complex operations
- Direct database queries for CRUD operations
- Fixed field name mismatches between frontend and database schema

## Manual Testing Steps

### Core Functionality Tests

1. **Calendar Operations**
   - View calendar assignments for current month
   - Create new date assignments (assign nights to mom/dad)
   - Update existing assignments
   - Accept/decline pending assignments

2. **Task Management**
   - View task list
   - Create new tasks with due dates
   - Mark tasks as complete/incomplete
   - Accept/decline pending tasks

3. **User Management and Invitations**
   - Register a new user account.
   - Create a new family, which should generate a secure invitation code.
   - As a new user, join a family using the invitation code.
   - Verify that invitation codes expire and have usage limits (as per the `SECURE_INVITATION_SYSTEM.md`).
   - Ensure a user cannot join a family if they are already in one.
   - View user request history and undo recent actions.
   - Logout functionality.

4. **Notifications & Sharing**
   - View detailed notifications modal for pending changes.
   - Accept/decline individual pending items.
   - Use the "Accept All" functionality.
   - Share updates via link generation
   - Log external notifications
   - Family code display and sharing

### Error Handling Tests

- Test network failures (offline mode)
- Test invalid data submissions
- Test permission errors for teen users (e.g., a teen trying to perform an action they don't have permission for).
- Verify user-friendly error messages are displayed for all common failures.
- Test duplicate email registration handling.

### Security and Data Isolation Tests

- **(CRITICAL)** Log in as a user from "Family A" and verify you cannot see any calendar, task, or user data from "Family B" through the UI or by inspecting network requests.
- **(CRITICAL)** Attempt to access data from another family directly using API calls (if possible) to ensure RLS policies are enforced.
- Verify that only parents can create new family invitations.
- Verify that only parents can manage teen permissions.

### Data Consistency Tests

- Verify real-time updates across different user roles within the same family (e.g., Mom makes a change, Dad sees it instantly).
- Test concurrent modifications to the same item to ensure data integrity.
- Ensure pending item badges and modals sync correctly after actions are taken.

## Environment Setup

Required environment variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_anon_key
```

## Deployment

### Frontend Hosting Options

**Recommended: Vercel + Supabase**
```bash
# 1. Connect GitHub repo to Vercel
# 2. Set environment variables in Vercel dashboard:
#    VITE_SUPABASE_URL=your_supabase_url
#    VITE_SUPABASE_KEY=your_supabase_anon_key
# 3. Deploy automatically on git push
```

**Alternative: Netlify**
```bash
npm run build
# Upload dist/ folder to Netlify or connect GitHub repo
```

### Backend Setup

1. **Supabase Setup**
   - Deploy Edge Functions: `supabase functions deploy`
   - Run database migrations
   - Configure RLS policies
   - Set up custom domain (optional)

### Mobile Deployment

2. **iOS Build**
   - `npm run build`
   - `npx cap sync ios`
   - Open in Xcode and build
   - Update Capacitor config for production URLs

## Migration Summary

### Completed Changes

1. **Created Supabase Client** (`client/src/lib/supabaseClient.ts`)
   - Centralized Supabase configuration
   - Environment variable integration

2. **Migrated Data Access**
   - Replaced all `fetch('/api/...')` calls
   - Updated query keys for React Query
   - Implemented direct Supabase queries
   - Fixed database field name mismatches

3. **Edge Functions Created**
   - `get_pending_items`: Aggregates pending data
   - `share_link`: Generates shareable links
   - `notify_external`: Logs external notifications
   - `join_family`: Handles family joining logic

4. **Error Handling Enhanced**
   - Added error states to all queries
   - Improved user feedback for failures
   - Consistent error handling patterns
   - Fixed duplicate email registration errors

5. **User Experience Improvements**
   - Fixed onboarding loop for existing users
   - Added logout functionality
   - Implemented family code display
   - Removed manual role switching

6. **Removed Legacy Code**
   - Cleaned up unused `apiRequest` imports
   - Updated query invalidation keys
   - Removed Express API dependencies

### Key Benefits

- **Performance**: Direct database queries reduce latency
- **Scalability**: Supabase handles scaling automatically
- **Real-time**: Built-in subscription capabilities
- **Security**: Row Level Security (RLS) policies
- **Maintenance**: Reduced server infrastructure complexity
- **User Experience**: Fixed critical workflow issues

## Next Steps

- **Deploy frontend to Vercel/Netlify** with Supabase environment variables
- Configure Supabase Auth integration
- Set up Row Level Security policies
- Deploy Edge Functions to production
- Update Capacitor config for production URLs
- Test end-to-end functionality
- Monitor performance and error rates

## Production Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vercel/       │    │    Supabase      │    │   iOS App       │
│   Netlify       │◄──►│   (Database +    │◄──►│  (Capacitor)    │
│  (Frontend)     │    │  Edge Functions) │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

This gives you:
- ✅ Serverless frontend hosting
- ✅ Managed database & auth
- ✅ Global CDN performance
- ✅ Automatic scaling
- ✅ Cost-effective solution
- ✅ Fixed critical user workflow issues
