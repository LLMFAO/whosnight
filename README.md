# Who'sNight

A cross-platform family coordination application designed to help co-parents coordinate schedules, manage shared tasks, and track expenses. Available as both a web application and native iOS app. Built with React, TypeScript, Express.js, PostgreSQL, and Capacitor.

## Features

- **Calendar Management**: Schedule coordination between co-parents
- **To-Do Lists**: Shared task management with approval workflows
- **Expense Tracking**: Track and manage shared family expenses
- **Role-Based Access**: Support for parents, teens, and additional caregivers
- **User Authentication**: Secure login/registration with session management
- **User Onboarding**: Guided setup for new users with role selection
- **Mobile-First Design**: Optimized for mobile devices with responsive UI
- **iOS Native App**: Full iOS app with native features and ad monetization
- **Real-Time Updates**: Live synchronization between family members

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for client-side routing
- **TanStack Query** for server state management
- **shadcn/ui** components (built on Radix UI)
- **Tailwind CSS** for styling
- **Vite** for development and building

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **Drizzle ORM** with PostgreSQL
- **Passport.js** for authentication with local strategy
- **Express Session** with PostgreSQL session store
- **bcrypt** for password hashing

### Database
- **PostgreSQL** (configured for Neon serverless)
- **Drizzle Kit** for migrations
- **Session storage** in PostgreSQL

### Mobile/iOS
- **Capacitor** for cross-platform mobile development
- **AdMob** integration for monetization
- **Native iOS features** and performance

## Local Installation

### Prerequisites

- **Node.js** (v20 or higher)
- **npm** or **yarn**
- **PostgreSQL** database
- **Xcode** (for iOS development)
- **iOS Simulator** or physical iOS device (for testing)

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd whos-night
npm install
```

### 2. Environment Variables

Create environment variables for the following:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/whos_night

# Session Secret (generate a random 64+ character string)
SESSION_SECRET=your-super-secret-random-string-here

# AdMob Configuration (for iOS app monetization)
ADMOB_APP_ID=ca-app-pub-your-app-id
ADMOB_BANNER_ID=ca-app-pub-your-banner-id
ADMOB_INTERSTITIAL_ID=ca-app-pub-your-interstitial-id
ADMOB_REWARDED_ID=ca-app-pub-your-rewarded-id
```

**To generate a secure SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Database Setup

#### Option A: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database:
   ```sql
   CREATE DATABASE whos_night;
   ```
3. Update `DATABASE_URL` with your local connection string

#### Option B: Neon Database (Recommended)
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to `DATABASE_URL`

### 4. Database Migration

Push the schema to your database:
```bash
npm run db:push
```

### 5. Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### 6. iOS App Development

#### Build Web Assets
```bash
npm run build
```

#### Sync with iOS Project
```bash
npx cap sync ios
```

#### Open in Xcode
```bash
npx cap open ios
```

#### iOS Development Notes
- The iOS project is located in the `ios/` directory
- AdMob is pre-configured with test ad units
- Replace test ad units with production IDs before App Store submission
- Ensure proper iOS certificates and provisioning profiles are configured

### 7. Production Build

Build for production:
```bash
npm run build
npm start
```

## Configuration Guide

### Authentication Setup

The app uses Passport.js with local strategy for secure authentication:

#### Email/Password Authentication
- **Registration**: Users can create accounts with email/username and password
- **Login**: Secure login with bcrypt password hashing
- **Sessions**: Persistent sessions stored in PostgreSQL database
- **Protected Routes**: Automatic redirection for unauthenticated users
- **User Context**: Global authentication state management

#### Authentication Flow
1. New users see registration form with role selection
2. Existing users can log in with credentials
3. Authenticated users go through onboarding (first time only)
4. Session persists across browser sessions
5. Logout clears session and redirects to login

#### Security Features
- Password hashing with bcrypt (10 rounds)
- Session-based authentication with secure cookies
- CSRF protection through session management
- Automatic session cleanup and expiration

### iOS App Configuration

#### AdMob Setup
1. Create an AdMob account at [admob.google.com](https://admob.google.com)
2. Create a new iOS app in AdMob console
3. Generate ad unit IDs for banner, interstitial, and rewarded ads
4. Update `capacitor.config.ts` with your production ad unit IDs
5. Replace test IDs in `client/src/services/ad-service.ts`

#### App Store Preparation
1. Configure app metadata in Xcode
2. Set up proper app icons and launch screens
3. Configure signing certificates and provisioning profiles
4. Test on physical devices
5. Submit for App Store review

#### Ad Integration Features
- **Banner Ads**: Bottom-positioned banner ads on main screens
- **Interstitial Ads**: Full-screen ads between app transitions
- **Rewarded Ads**: Optional ads that provide user benefits
- **Web Fallback**: Graceful degradation for web version

### Database Schema

The application includes these main entities:
- **Users**: Family members with roles (parent, teen, caregiver) and authentication
- **Calendar Assignments**: Date-based responsibility assignments
- **Events**: Calendar events and activities
- **Tasks**: To-do items with approval workflows
- **Expenses**: Shared expense tracking
- **Action Logs**: Audit trail for all changes
- **Sessions**: User session storage for authentication

### Role System

- **Parent**: Full access to all features, can approve/reject requests
- **Teen**: Limited access, can create requests requiring approval
- **Caregiver**: Extended family members with parent-like permissions

### Mobile Optimization

The app is designed mobile-first with:
- Touch-friendly interface
- Bottom navigation for easy thumb access
- Responsive design that works on all screen sizes
- PWA capabilities (can be installed on mobile devices)
- Native iOS app with platform-specific features

## Development

### Project Structure

```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   │   ├── auth/     # Authentication components
│   │   │   ├── ads/      # Ad integration components
│   │   │   ├── onboarding/ # User onboarding flow
│   │   │   └── ui/       # shadcn/ui components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # Service layer (ads, etc.)
│   │   ├── lib/          # Utilities
│   │   └── pages/        # Page components
├── server/               # Express backend
│   ├── db.ts            # Database connection
│   ├── routes.ts        # API routes with authentication
│   ├── storage.ts       # Database operations
│   └── index.ts         # Server entry point
├── shared/               # Shared types and schema
│   └── schema.ts        # Database schema with user tables
├── ios/                 # iOS app build (Capacitor)
│   └── App/             # Xcode project
└── capacitor.config.ts  # Capacitor configuration
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build web assets for production
- `npm start` - Start production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes
- `npx cap sync ios` - Sync web assets to iOS project
- `npx cap open ios` - Open iOS project in Xcode
- `npx cap run ios` - Build and run on iOS simulator

### API Endpoints

#### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/me` - Get current user info

#### Core Features
- `GET /api/calendar/assignments/:month` - Get calendar assignments
- `GET /api/events/:date` - Get events for specific date
- `GET /api/tasks` - Get all tasks
- `GET /api/expenses` - Get all expenses
- `GET /api/pending` - Get pending approvals
- `POST /api/*` - Various create/update endpoints

### Adding New Features

1. **Database Changes**: Update `shared/schema.ts` and run `npm run db:push`
2. **API Routes**: Add endpoints in `server/routes.ts`
3. **Frontend**: Create components in `client/src/components/`
4. **Types**: Add shared types in `shared/schema.ts`

## Deployment

### Replit Deployment (Recommended)
The app is optimized for Replit deployment:
1. Fork this repl
2. Configure environment variables in Replit Secrets
3. Click Deploy to publish

### Manual Deployment
1. Build the application: `npm run build`
2. Set production environment variables
3. Start with: `npm start`
4. Ensure PostgreSQL database is accessible
5. Configure reverse proxy if needed

### iOS App Store Deployment
1. Complete AdMob setup with production ad units
2. Configure app metadata and assets in Xcode
3. Set up signing certificates and provisioning profiles
4. Test thoroughly on physical devices
5. Submit to App Store Connect for review

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` is correct
   - Ensure database is running and accessible
   - Check firewall settings

2. **Authentication Errors**
   - Verify `SESSION_SECRET` is set
   - Check database session table exists
   - Ensure cookies are enabled in browser

3. **iOS Build Errors**
   - Ensure Xcode is updated
   - Check iOS deployment target compatibility
   - Verify Capacitor plugins are properly installed

4. **Ad Integration Issues**
   - Verify AdMob account and app setup
   - Check ad unit IDs are correct
   - Test with AdMob test ads first

5. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run check`

6. **Port Issues**
   - App runs on port 5000 by default
   - Ensure port is not in use by another application

### Environment Variables Checklist

#### Required
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `SESSION_SECRET` - Random secret for session encryption

#### iOS App (Optional)
- [ ] `ADMOB_APP_ID` - AdMob application ID
- [ ] `ADMOB_BANNER_ID` - Banner ad unit ID
- [ ] `ADMOB_INTERSTITIAL_ID` - Interstitial ad unit ID
- [ ] `ADMOB_REWARDED_ID` - Rewarded ad unit ID

### iOS Development Checklist

- [ ] Xcode installed and updated
- [ ] iOS Simulator or physical device available
- [ ] Apple Developer account (for device testing/App Store)
- [ ] AdMob account and app configured
- [ ] Production ad unit IDs configured
- [ ] App icons and metadata configured
- [ ] Signing certificates and provisioning profiles set up

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (including iOS app if applicable)
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the configuration guide
3. Test on both web and iOS platforms
4. Open an issue on GitHub
