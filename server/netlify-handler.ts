import serverless from "serverless-http";
import express from "express";
import session from "express-session";
import passport from "passport";
import { registerRoutes } from "./routes";

// Create Express app without server.listen() 
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Use memory store for sessions in serverless (for now)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Register routes (without server.listen)
async function setupRoutes() {
  await registerRoutes(app);
  return app;
}

// Create the app
let appPromise: Promise<express.Application>;

// Export the serverless handler
export const handler = async (event: any, context: any) => {
  if (!appPromise) {
    appPromise = setupRoutes();
  }
  
  const app = await appPromise;
  const serverlessHandler = serverless(app);
  return serverlessHandler(event, context);
};