# Deployment Guide

This guide covers deployment options for the Who's Night? application, including web deployment and iOS App Store submission.

## Web Application Deployment

### Environment Setup

#### Required Environment Variables

```bash
# Database Connection
DATABASE_URL=postgresql://username:password@host:port/database

# Session Security
SESSION_SECRET=your-64-character-random-string

# Node Environment
NODE_ENV=production

# Optional: Custom Port (defaults to 5000)
PORT=5000
```

#### Generate Secure Session Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Deployment Options

#### Option 1: Replit (Recommended for Quick Deploy)

1. **Fork the Repository** on Replit
2. **Configure Secrets:**
   - Go to Tools → Secrets
   - Add `DATABASE_URL`
   - Add `SESSION_SECRET`
   - Add `NODE_ENV=production`

3. **Database Setup:**
   - Use Neon PostgreSQL (free tier available)
   - Copy connection string to `DATABASE_URL`

4. **Deploy:**
   - Click "Deploy" button
   - Configure custom domain if needed

#### Option 2: Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Configure vercel.json:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "dist/index.js",
         "use": "@vercel/node"
       },
       {
         "src": "dist/public/**",
         "use": "@vercel/static"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/dist/index.js"
       },
       {
         "src": "/(.*)",
         "dest": "/dist/public/$1"
       }
     ]
   }
   ```

3. **Deploy:**
   ```bash
   npm run build
   vercel --prod
   ```

4. **Environment Variables:**
   - Configure in Vercel dashboard
   - Add `DATABASE_URL` and `SESSION_SECRET`

#### Option 3: Railway

1. **Connect Repository:**
   - Go to [railway.app](https://railway.app)
   - Connect GitHub repository

2. **Configure Environment:**
   - Add `DATABASE_URL`
   - Add `SESSION_SECRET`
   - Add `NODE_ENV=production`

3. **Deploy:**
   - Automatic deployment on git push
   - Custom domain configuration available

#### Option 4: DigitalOcean App Platform

1. **Create App:**
   - Connect GitHub repository
   - Select Node.js environment

2. **Configure Build:**
   - Build command: `npm run build`
   - Run command: `npm start`

3. **Environment Variables:**
   - Add required variables in dashboard

#### Option 5: Self-Hosted (VPS/Dedicated Server)

1. **Server Requirements:**
   - Node.js 20+
   - PostgreSQL
   - Nginx (recommended)
   - SSL certificate

2. **Setup Process:**
   ```bash
   # Clone repository
   git clone <your-repo>
   cd whosnight
   
   # Install dependencies
   npm install
   
   # Build application
   npm run build
   
   # Set up environment variables
   export DATABASE_URL="your-database-url"
   export SESSION_SECRET="your-session-secret"
   export NODE_ENV="production"
   
   # Start application
   npm start
   ```

3. **Process Management (PM2):**
   ```bash
   # Install PM2
   npm install -g pm2
   
   # Start application
   pm2 start dist/index.js --name "whosnight"
   
   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

4. **Nginx Configuration:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Database Setup

#### Neon PostgreSQL (Recommended)

1. **Create Account:** [neon.tech](https://neon.tech)
2. **Create Project:** Choose region closest to your users
3. **Get Connection String:** Copy from dashboard
4. **Configure Environment:** Set `DATABASE_URL`

#### Other PostgreSQL Providers

- **Supabase:** [supabase.com](https://supabase.com)
- **PlanetScale:** [planetscale.com](https://planetscale.com) (MySQL)
- **AWS RDS:** [aws.amazon.com/rds](https://aws.amazon.com/rds)
- **Google Cloud SQL:** [cloud.google.com/sql](https://cloud.google.com/sql)

### SSL/HTTPS Setup

#### Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Cloudflare (Recommended)

1. **Add Domain** to Cloudflare
2. **Update Nameservers** at domain registrar
3. **Enable SSL/TLS** (Full or Strict)
4. **Configure Page Rules** for caching

## iOS App Store Deployment

### Pre-Submission Checklist

#### App Configuration

- [ ] **Bundle Identifier:** `com.whosnight.app` (or your chosen ID)
- [ ] **App Name:** Who's Night
- [ ] **Version:** 1.0.0
- [ ] **Build Number:** Incremental (1, 2, 3...)
- [ ] **Deployment Target:** iOS 13.0 or later

#### AdMob Configuration

- [ ] **Production Ad Units:** Replace all test IDs
- [ ] **AdMob App:** Approved and active
- [ ] **Payment Setup:** Configure in AdMob dashboard
- [ ] **Ad Policies:** Ensure compliance with AdMob policies

#### App Store Assets

- [ ] **App Icons:** All required sizes (1024x1024, 180x180, etc.)
- [ ] **Screenshots:** All required device sizes
- [ ] **App Preview:** Optional video preview
- [ ] **App Description:** Compelling and accurate
- [ ] **Keywords:** Relevant search terms
- [ ] **Privacy Policy:** Required for apps with ads

### App Store Connect Setup

#### App Information

```
Name: Who's Night
Subtitle: Family Coordination Made Simple
Category: Productivity
Secondary Category: Lifestyle
Content Rating: 4+ (Ages 4 and up)
```

#### App Description

```
Who's Night is the ultimate family coordination app designed for co-parents, families with teens, and busy households. Streamline your family's schedule management, task coordination, and expense tracking all in one intuitive mobile app.

PERFECT FOR:
• Co-parents managing custody schedules
• Families with teenagers learning responsibility  
• Busy households needing better organization
• Extended families coordinating activities

KEY FEATURES:
• Calendar Management - Coordinate schedules between family members
• Task Lists - Shared to-do lists with approval workflows
• Expense Tracking - Monitor and manage family expenses
• Role-Based Access - Customized experience for parents and teens
• User Onboarding - Guided setup for new family members
• Real-Time Updates - Stay synchronized across all devices
• Secure Authentication - Protected family data with user accounts

BUILT FOR FAMILIES:
Who's Night understands that every family is different. Whether you're co-parenting after divorce, managing a household with teenagers, or coordinating with extended family members, our app adapts to your family's unique needs.

PRIVACY & SECURITY:
Your family's data is protected with secure authentication and encrypted sessions. We never share your personal information with third parties.

Download Who's Night today and bring harmony to your family's coordination!
```

#### Keywords

```
family,co-parenting,schedule,calendar,tasks,expenses,organization,productivity,parenting,teens,coordination,household,custody,shared,planning
```

#### App Privacy

Configure privacy practices:
- **Data Collection:** User accounts, usage analytics
- **Data Usage:** App functionality, analytics, advertising
- **Data Sharing:** AdMob advertising network
- **User Control:** Account deletion, data export

### Build and Upload Process

#### 1. Final Build Preparation

```bash
# Ensure production configuration
npm run build
npx cap sync ios
```

#### 2. Xcode Configuration

1. **Select "Any iOS Device"**
2. **Product → Archive**
3. **Wait for build completion**
4. **Organizer opens automatically**

#### 3. Distribution

1. **Click "Distribute App"**
2. **Select "App Store Connect"**
3. **Choose options:**
   - Upload symbols: Yes
   - Manage version and build number: Yes
4. **Click "Upload"**

#### 4. App Store Connect Processing

- **Processing Time:** 5-30 minutes
- **Status:** Check in App Store Connect
- **TestFlight:** Available for internal testing

### TestFlight Beta Testing

#### Internal Testing

1. **Add Team Members:**
   - Up to 100 internal testers
   - Immediate access after upload
   - No review required

2. **Test Coverage:**
   - All app features
   - Different iOS versions
   - Various device types
   - Ad functionality

#### External Testing

1. **Create Test Groups:**
   - Up to 10,000 external testers
   - Requires beta app review
   - Public link available

2. **Beta App Review:**
   - 24-48 hour review process
   - Must pass before external testing
   - Similar to App Store review

### App Store Review Process

#### Submission

1. **Complete App Information**
2. **Add Build** from TestFlight
3. **Submit for Review**
4. **Review Time:** 24-48 hours typically

#### Review Guidelines Compliance

- **iOS Human Interface Guidelines**
- **App Store Review Guidelines**
- **AdMob Policy Compliance**
- **Privacy Policy Requirements**

#### Common Rejection Reasons

1. **Crashes or Bugs:** Test thoroughly
2. **Incomplete Information:** Fill all required fields
3. **Privacy Policy:** Must be accessible and accurate
4. **Ad Implementation:** Must follow AdMob guidelines
5. **Metadata:** Screenshots must match app functionality

### Post-Launch Monitoring

#### Analytics

- **App Store Connect Analytics:** Downloads, revenue, crashes
- **AdMob Dashboard:** Ad performance, revenue
- **User Feedback:** Reviews and ratings
- **Crash Reports:** Xcode Organizer or third-party tools

#### Updates

1. **Version Updates:**
   - Increment version number (1.0.1, 1.1.0, etc.)
   - Update build number
   - Submit new build

2. **Metadata Updates:**
   - Description changes
   - Screenshot updates
   - Keyword optimization

#### Maintenance

- **Monitor Performance:** App crashes, load times
- **User Support:** Respond to reviews and feedback
- **Security Updates:** Keep dependencies updated
- **Feature Updates:** Based on user feedback and analytics

## Monitoring and Maintenance

### Health Checks

#### Web Application

```bash
# Health check endpoint
curl https://your-domain.com/api/health

# Database connectivity
curl https://your-domain.com/api/db-status
```

#### Monitoring Tools

- **Uptime Monitoring:** UptimeRobot, Pingdom
- **Error Tracking:** Sentry, Rollbar
- **Performance:** New Relic, DataDog
- **Analytics:** Google Analytics, Mixpanel

### Backup Strategy

#### Database Backups

```bash
# Automated daily backups
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup_20240120.sql
```

#### Code Backups

- **Git Repository:** Multiple remotes (GitHub, GitLab)
- **Deployment Artifacts:** Store built assets
- **Configuration:** Environment variable backups

### Security Updates

#### Regular Tasks

- **Dependency Updates:** Monthly security patches
- **SSL Certificate Renewal:** Automated with Let's Encrypt
- **Database Security:** Regular password rotation
- **Access Review:** Quarterly team access audit

#### Security Monitoring

- **Vulnerability Scanning:** Snyk, npm audit
- **Log Monitoring:** Failed login attempts, unusual activity
- **SSL Monitoring:** Certificate expiration alerts
- **Database Monitoring:** Connection limits, query performance

The deployment is now ready for production use across both web and iOS platforms!