// ----- CORS FIX -----
// More permissive CORS that allows Supabase and external APIs
const corsOptions = {
  origin: function (origin, callback) {
    // IMPORTANT: Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);

    // Allow ALL requests from your own domains
    if (origin.includes('trefa.mx') || origin.includes('.run.app')) {
      return callback(null, true);
    }

    // Check against explicit whitelist
    if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // For development/staging: be more permissive
    if (process.env.NODE_ENV !== 'production') {
      console.log(`⚠️  [DEV] Allowing CORS from: ${origin}`);
      return callback(null, true);
    }

    // Log blocked requests for debugging
    console.warn(`⚠️  Blocked CORS request from: ${origin}`);
    console.warn(`   Allowed: ${ALLOWED_ORIGINS.join(', ')}`);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "apikey",  // Supabase usa esto
    "x-client-info",  // Supabase client info
    "x-api-key",  // Para Intelimotor
    "x-api-secret"  // Para Intelimotor
  ],
  exposedHeaders: [
    "Content-Range",
    "X-Content-Range",
    "ETag"
  ],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// CRITICAL: Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Additional CORS headers for Supabase compatibility
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (origin.includes('trefa.mx') || origin.includes('.run.app'))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,apikey,x-client-info,x-api-key,x-api-secret');
  }
  next();
});
