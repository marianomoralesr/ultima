// server/server.js
import express from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import fetch from "node-fetch";
import { fileURLToPath } from "url";
import { config } from "./config.js"; // your proxy URL is config.proxy.url
// import { runSync } from "./syncAirtableData.cjs";

// ----- ES modules __dirname setup -----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ----- Runtime Environment Variables -----
const PORT = process.env.PORT || 8080;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://trefa.mx";
const CLOUD_RUN_URL = process.env.CLOUD_RUN_URL || "https://app-1052659336338.us-central1.run.app";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://jjepfehmuybpctdzipnu.supabase.co";
const AIRTABLE_API_URL = process.env.AIRTABLE_API_URL || "https://api.airtable.com";
const INTELIMOTOR_API_URL = process.env.INTELIMOTOR_API_URL || "https://api.intelimotor.com";
const PROXY_URL = config?.proxy?.url || "https://proxy.cors.sh";
const SYNC_SECRET = process.env.SYNC_SECRET || "your-super-secret-key";

// Build allowed origins list - support multiple domains
const ALLOWED_ORIGINS = [
  FRONTEND_URL,
  CLOUD_RUN_URL,
  "https://trefa.mx",
  "https://www.trefa.mx",
  "https://autos.trefa.mx",
  "https://staging.trefa.mx",
].filter(Boolean);

// ----- Trust Proxy (Cloud Run) -----
app.set("trust proxy", 1);

// ----- Security Headers (Helmet CSP) -----
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
        "style-src": ["'self'", "'unsafe-inline'", "https:"],
        "img-src": [
          "'self'",
          "data:",
          "blob:",
          "https://trefa.mx",
          "https://www.trefa.mx",
          "https://autos.trefa.mx",
          "https://jjepfehmuybpctdzipnu.supabase.co",
          "https://5.183.8.48",
          "https://randomuser.me",
          "https://facebook.com",
          "https://cufm.mx",
          "https://google.com",
          CLOUD_RUN_URL,
        ],
        "connect-src": [
          "'self'",
          "https://trefa.mx",
          "https://www.trefa.mx",
          "https://autos.trefa.mx",
          SUPABASE_URL,
          AIRTABLE_API_URL,
          INTELIMOTOR_API_URL,
          PROXY_URL,
          CLOUD_RUN_URL,
        ],
        "frame-src": ["'self'", "https://www.youtube.com", "https://player.vimeo.com"],
        "font-src": ["'self'", "https:", "data:"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
        "upgrade-insecure-requests": [],
      },
    } : false,
  })
);

// ----- Compression -----
app.use(compression());

// ----- CORS -----
// Dynamic CORS handler to support multiple domains and prevent credential issues
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ Blocked CORS request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  credentials: true,
  maxAge: 86400, // Cache preflight for 24 hours
};

app.use(cors(corsOptions));

// ----- Logging & Body Parsing -----
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----- Cache Control Headers -----
// Prevent stale responses and ensure fresh data from Supabase
app.use((req, res, next) => {
  // For API endpoints, disable caching completely
  if (req.path.startsWith('/api/')) {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
  }
  next();
});

// ----- Health Check -----
app.get("/healthz", (_, res) => res.send("ok"));
app.get("/api/health", (_, res) => res.json({ status: "ok" }));

// ----- Intelimotor API Proxy -----
// This endpoint proxies requests to Intelimotor API, hiding credentials from frontend
app.post("/intelimotor-api/", async (req, res) => {
  try {
    const { url, method, headers, body } = req.body;

    if (!url) {
      return res.status(400).json({ error: "Missing 'url' in request body" });
    }

    console.log('Intelimotor proxy request:', { url, method, headers: Object.keys(headers || {}) });

    // Make request to Intelimotor API
    const response = await fetch(url, {
      method: method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Intelimotor API error:', { status: response.status, url, data });
      return res.status(response.status).json(data);
    }

    console.log('Intelimotor API success:', { status: response.status, url });
    res.json(data);
  } catch (error) {
    console.error('Intelimotor proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
});

// // ----- API Routes -----
// app.post("/api/sync-images", (req, res) => {
//   const secret = req.get("x-sync-secret");
//   if (secret !== SYNC_SECRET) {
//     return res.status(401).json({ error: "Unauthorized" });
//   }

//   const { record_id } = req.body;

//   // Do not await, run in background
//   runSync(record_id);

//   res.status(202).json({ message: record_id ? `Image sync process started for record ${record_id}.` : "Full image sync process started." });
// });

// ----- Serve React Build -----
const buildPath = path.resolve(__dirname, "../dist");

// Serve static assets with long cache for hashed files, short cache for index.html
app.use(express.static(buildPath, {
  maxAge: "1y",
  etag: true,
  setHeaders: (res, path) => {
    // index.html should never be cached
    if (path.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// ----- SPA Fallback -----
app.get("*", (_, res) => {
  // Ensure index.html is never cached
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(buildPath, "index.html"));
});

// ----- Error Handling -----
app.use((err, _req, res, _next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// ----- Start Server -----
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ TREFA server running on port ${PORT}`);
});