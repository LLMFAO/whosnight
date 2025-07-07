
# Who'sNight

A mobile-first web application designed to help co-parents coordinate schedules, manage shared tasks, and track expenses. Built with React, TypeScript, Express.js, and PostgreSQL.

## Features

- **Calendar Management**: Schedule coordination between co-parents
- **To-Do Lists**: Shared task management with approval workflows
- **Expense Tracking**: Track and manage shared family expenses
- **Role-Based Access**: Support for parents, teens, and additional caregivers
- **Mobile-First Design**: Optimized for mobile devices with responsive UI
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
- **Passport.js** for authentication (ready for OAuth)

### Database
- **PostgreSQL** (configured for Neon serverless)
- **Drizzle Kit** for migrations

## Local Installation

### Prerequisites

- **Node.js** (v20 or higher)
- **npm** or **yarn**
- **PostgreSQL** database

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

# OAuth Credentials (if using Google Auth)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
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

### 6. Production Build

Build for production:
```bash
npm run build
npm start
```

## Configuration Guide

### Authentication Setup

The app is configured for multiple authentication methods:

#### Google OAuth (Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-domain.com/auth/google/callback`
6. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

#### Apple OAuth (Future)
Ready for Apple OAuth integration with passport-apple strategy.

#### Email/Password
Built-in email/password authentication with magic link capabilities.

### Database Schema

The application includes these main entities:
- **Users**: Family members with roles (parent, teen, caregiver)
- **Calendar Assignments**: Date-based responsibility assignments
- **Events**: Calendar events and activities
- **Tasks**: To-do items with approval workflows
- **Expenses**: Shared expense tracking
- **Action Logs**: Audit trail for all changes

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

## Development

### Project Structure

```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities
│   │   └── pages/        # Page components
├── server/               # Express backend
│   ├── db.ts            # Database connection
│   ├── routes.ts        # API routes
│   └── index.ts         # Server entry point
├── shared/               # Shared types and schema
│   └── schema.ts        # Database schema
└── ios/                 # iOS app build (Capacitor)
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes

### API Endpoints

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

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` is correct
   - Ensure database is running and accessible
   - Check firewall settings

2. **OAuth Errors**
   - Verify redirect URIs match exactly
   - Check client ID and secret are correct
   - Ensure OAuth app is properly configured

3. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run check`

4. **Port Issues**
   - App runs on port 5000 by default
   - Ensure port is not in use by another application

### Environment Variables Checklist

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `SESSION_SECRET` - Random secret for session encryption
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID (optional)
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth client secret (optional)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the configuration guide
3. Open an issue on GitHub
