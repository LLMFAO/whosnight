# Who's Night - Technical Configuration

## Overview
Who's Night is a family calendar coordination application built with React/TypeScript frontend and Supabase backend. The application helps families coordinate household responsibilities and events.

## Architecture

### Frontend
- **Framework**: React with TypeScript
- **State Management**: React Query (TanStack Query)
- **Routing**: Wouter
- **UI Components**: Custom component library with shadcn-inspired components
- **Build Tool**: Vite
- **Deployment**: Netlify

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for receipts)
- **Functions**: Supabase Edge Functions
- **Realtime**: Supabase Realtime subscriptions

### Mobile
- **Framework**: Capacitor (iOS/Android)

## Project Structure

```
whosnight/
├── client/                 # React frontend
├── server/                 # Legacy Express server (deprecated)
├── shared/                 # Shared types and schema
├── supabase/              # Supabase configuration and migrations
├── ios/                   # Capacitor iOS project
├── netlify.toml           # Netlify deployment configuration
└── package.json           # Root package configuration
```

## Frontend Configuration

### Dependencies
```json
{
  "dependencies": {
    "@capacitor-community/admob": "^6.1.1",
    "@capacitor-community/fcm": "^6.1.0",
    "@capacitor-community/keep-awake": "^6.0.0",
    "@capacitor/action-sheet": "^6.0.1",
    "@capacator/app": "^6.0.1",
    "@capacitor/camera": "^6.0.2",
    "@capacitor/core": "^6.1.2",
    "@capacitor/filesystem": "^6.0.1",
    "@capacitor/geolocation": "^6.0.2",
    "@capacitor/haptics": "^6.0.1",
    "@capacitor/ios": "^6.1.2",
    "@capacitor/keyboard": "^6.0.2",
    "@capacitor/preferences": "^6.0.2",
    "@capacitor/push-notifications": "^6.1.0",
    "@capacitor/splash-screen": "^6.0.2",
    "@capacitor/status-bar": "^6.0.1",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-alert-dialog": "^1.1.1",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-checkbox": "^1.1.1",
    "@radix-ui/react-collapsible": "^1.1.0",
    "@radix-ui/react-context-menu": "^2.2.1",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-hover-card": "^1.1.1",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-menubar": "^1.1.1",
    "@radix-ui/react-navigation-menu": "^1.2.0",
    "@radix-ui/react-popover": "^1.1.1",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-radio-group": "^1.2.0",
    "@radix-ui/react-scroll-area": "^1.1.0",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slider": "^1.2.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.1",
    "@radix-ui/react-toggle": "^1.1.0",
    "@radix-ui/react-toggle-group": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.2",
    "@supabase/supabase-js": "^2.44.4",
    "@tanstack/react-query": "^5.51.23",
    "@tanstack/react-table": "^8.20.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "date-fns": "^3.6.0",
    "drizzle-orm": "^0.33.0",
    "drizzle-zod": "^0.5.1",
    "embla-carousel-react": "^8.1.6",
    "lucide-react": "^0.424.0",
    "next-themes": "^0.3.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.52.2",
    "react-resizable-panels": "^2.0.20",
    "recharts": "^2.12.7",
    "tailwind-merge": "^2.4.0",
    "tailwindcss-animate": "^1.0.7",
    "vite": "^5.3.5",
    "wouter": "^3.3.1",
    "zod": "^3.23.8"
  }
}
```

### Key Components

#### Authentication Flow
- **Auth Provider**: `client/src/components/auth/auth-provider.tsx`
- **Login Form**: `client/src/components/auth/login-form.tsx`
- **Register Form**: `client/src/components/auth/register-form.tsx`
- **Onboarding**: `client/src/pages/onboarding.tsx` with step components

#### Main Application
- **Home Page**: `client/src/pages/home.tsx` (Calendar and Todo views)
- **Calendar View**: `client/src/components/calendar-view.tsx`
- **Date Assignment Sheet**: `client/src/components/date-assignment-sheet.tsx`
- **Event Management**: Integrated in date assignment sheet

#### Supabase Integration
- **Client Configuration**: `client/src/lib/supabaseClient.ts`
- **Query Client**: `client/src/lib/queryClient.ts`

## Backend Configuration

### Supabase Schema
The database schema is defined in `shared/schema.ts` using Drizzle ORM:

```typescript
// Users table
users: {
  id: text("id").primaryKey(), // Supabase Auth UUID
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull(), // "mom", "dad", "teen", or "caretaker"
  family_id: integer("family_id").references(() => families.id),
  created_at: timestamp("created_at").defaultNow().notNull()
}

// Families table
families: {
  id: serial("id").primaryKey(),
  name: text("name"),
  code: text("code").notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull()
}

// Events table
events: {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  name: text("name").notNull(),
  time: text("time"),
  location: text("location"),
  description: text("description"),
  children: text("children").array().default([]),
  created_by: text("created_by").notNull(),
  status: text("status").notNull().default("pending"),
  created_at: timestamp("created_at").defaultNow().notNull()
}
```

### Supabase Functions
Located in `supabase/functions/`:
- `get_pending_items`: Retrieves pending items for notification badges
- `join_family`: Handles family joining logic
- `notify_external`: External notification system
- `share_link`: Share link generation and management

## Deployment Configuration

### Netlify Configuration (`netlify.toml`)
```toml
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[dev]
  command = "npm run dev"

[functions."*"]
  included_files = ["supabase/**"]
```

### Environment Variables
The application uses the following environment variables:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VITE_APP_VERSION`: Application version

## Key Features Implementation

### Authentication
1. Users register with email/password via Supabase Auth
2. Profile data stored in `users` table with role and family association
3. Session management handled by Supabase Auth with React Context

### Event Management
1. Events stored in `events` table with date, time, location
2. CRUD operations performed directly via Supabase client
3. Real-time updates through React Query invalidation

### Family Management
1. Families created with unique join codes
2. Users join families via code entry during onboarding
3. Family data shared across all family members

### Notifications
1. Pending items tracked via `get_pending_items` function
2. Real-time badge updates in header
3. Detailed notification modal for pending items

## Recent Changes

### Migration from Express API to Supabase
- **Authentication**: Migrated from Express endpoints to Supabase Auth
- **Event Management**: Replaced `/api/events` endpoints with direct Supabase queries
- **Calendar Data**: Migrated from Express API to Supabase database queries
- **User Profiles**: Moved from Express session management to Supabase Auth

### Bug Fixes
- Fixed database field name mismatch (`familyId` → `family_id`)
- Resolved onboarding loop issue for existing users
- Added missing logout functionality
- Implemented family code display with copy feature
- Fixed duplicate email registration error handling

## Mobile Configuration

### Capacitor Plugins
- `@capacitor-community/admob`: Ad integration
- `@capacitor/camera`: Image capture for receipts
- `@capacitor/push-notifications`: Push notification support
- `@capacitor/geolocation`: Location services for events

### iOS Specific
- Xcode project configuration in `ios/App/`
- Native iOS capabilities via Capacitor plugins

## Development Setup

### Prerequisites
1. Node.js 18+
2. Supabase account and project
3. Xcode (for iOS development)

### Environment Setup
1. Clone repository
2. Run `npm install`
3. Configure Supabase environment variables
4. Run `npm run dev` for development server

### Build Process
1. `npm run build` - Production build
2. `npm run dev` - Development server
3. `npm run preview` - Preview production build

## Testing

### Current Testing Status
- Authentication flow tested and working
- Event creation/modification tested and working
- Onboarding flow tested for new users
- Profile completeness validation implemented
- Family code sharing functionality verified

## Future Considerations

### Areas for Improvement
1. Add comprehensive unit and integration tests
2. Implement more robust error handling and user feedback
3. Add analytics for usage tracking
4. Enhance mobile-specific features
5. Implement offline support for mobile app