# replit.md

## Overview

CoParent Connect is a mobile-first web application designed to help co-parents coordinate schedules, manage shared tasks, and track expenses. The application provides a streamlined interface optimized for mobile devices with three core modules: Calendar, To-Do List, and Expenses management.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite with custom configuration for monorepo structure

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with JSON responses
- **Middleware**: Custom logging, error handling, and mock authentication
- **Development**: Hot module replacement via Vite integration

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema**: Centralized schema definition in `/shared/schema.ts`
- **Migrations**: Drizzle Kit for schema migrations

## Key Components

### 1. Shared Schema (`/shared/schema.ts`)
Defines the complete data model including:
- **Users**: Authentication and role management (mom/dad roles)
- **Calendar Assignments**: Date-based custody assignments
- **Events**: Scheduled activities with location and participant tracking
- **Tasks**: Shared to-do items with assignment and completion tracking
- **Expenses**: Financial tracking with categorization and payment responsibility
- **Action Logs**: Audit trail for all system interactions
- **Share Links**: Temporary links for sharing updates between parents

### 2. Authentication System
- Mock authentication middleware for development
- User roles: "mom" and "dad" for permission-based features
- Session-based authentication preparation

### 3. API Layer (`/server/routes.ts`)
RESTful endpoints for:
- Calendar management (assignments, events)
- Task management (CRUD operations, status updates)
- Expense tracking (creation, categorization, payment tracking)
- Notification system (pending items, acceptance workflows)
- Share link generation for update notifications

### 4. Frontend Components
- **Calendar View**: Monthly calendar with assignment visualization
- **Todo View**: Task management with completion tracking
- **Expenses View**: Financial tracking with category filtering
- **Bottom Navigation**: Fixed mobile navigation between main sections
- **Share Updates Modal**: Notification sharing mechanism

## Data Flow

### 1. Client-Server Communication
- TanStack Query manages all server state with automatic caching
- API requests use custom `apiRequest` helper with error handling
- Real-time updates via periodic refetching (5-second intervals for pending items)

### 2. State Management Pattern
- Server state: TanStack Query with background refetching
- UI state: React component state and context where needed
- Form state: React Hook Form with Zod validation

### 3. Update Propagation
- Mutations automatically invalidate related queries
- Optimistic updates for better user experience
- Background sync for pending approvals between parents

## External Dependencies

### Core Framework Dependencies
- React ecosystem: React, React DOM, React Query
- Routing: Wouter for lightweight routing
- UI Components: Radix UI primitives with shadcn/ui abstractions
- Styling: Tailwind CSS with PostCSS

### Backend Dependencies
- Express.js with TypeScript support
- Drizzle ORM with PostgreSQL adapter
- Neon Database serverless driver
- Development tools: tsx, esbuild

### Development Tools
- Vite for development server and building
- TypeScript for type safety
- ESLint and Prettier (configured via package.json)
- Replit-specific plugins for development environment

## Deployment Strategy

### Development Environment
- Replit-hosted with automatic environment setup
- Hot module replacement for rapid development
- PostgreSQL database provisioned automatically
- Development server runs on port 5000

### Production Build
- Vite builds optimized client bundle to `/dist/public`
- esbuild compiles server code to `/dist/index.js`
- Single-process deployment serving both API and static assets
- Database migrations applied via `npm run db:push`

### Environment Configuration
- Database URL via environment variables
- Automatic scaling deployment target configured
- Build and start commands defined in package.json

## Changelog
```
Changelog:
- June 17, 2025. Initial setup
- June 17, 2025. Fixed calendar color system with immediate optimistic updates and proper pending/confirmed status workflow
- June 17, 2025. Implemented teen user role with configurable permissions system - parents can control teen access (read-only or specific modification permissions for calendar, events, tasks, and expenses)
- June 17, 2025. Fixed approval system so changes from any user show up for appropriate parents to approve, with proper pending items logic
- June 17, 2025. Fixed change history system by adding entity tracking (entityType and entityId) to action logs - history modals now show complete change details with current status display
- June 17, 2025. Improved event visibility by changing event dots from blue to white with gray border - now visible on all colored date backgrounds
- June 17, 2025. Enhanced change history with user-friendly labels ("Night assigned", "Approved") instead of technical terms and improved timestamp formatting
- June 17, 2025. Implemented auto-disable read-only mode when individual teen permissions are granted - provides visual feedback to parents
- June 17, 2025. Removed expense section completely - streamlined app to focus on calendar and task management only
- June 18, 2025. Fixed authentication system to properly track user actions - teen requests now logged with correct user ID and show up for both parents instead of just one
- June 18, 2025. Completely rewrote request history with user-friendly interface, proper user separation, and clear status tracking
- June 18, 2025. Removed expense permission from teen settings - cleaned up database schema and UI to focus on calendar, events, and tasks only
- June 18, 2025. Fixed header layout overlap issue by moving user role selector below app title in vertical layout
- June 18, 2025. Prepared app for iOS deployment with full PWA capabilities - added manifest, service worker, iOS meta tags, and app icons for home screen installation
- June 19, 2025. Created native iOS app using Capacitor - generated complete Xcode project with iOS-specific configuration, native app bundle, and production-ready deployment assets
- June 19, 2025. Converted to React Native Expo app - built complete native mobile application with calendar coordination, task management, teen permissions, and native mobile UI optimized for iOS/Android deployment
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```