// Load .env first, fall back to config.env
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.IBM_API_KEY) {
  dotenv.config({ path: path.join(__dirname, '..', 'config.env') });
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const chatRoutes = require('./routes/chat');
const itineraryRoutes = require('./routes/itinerary');
const destinationRoutes = require('./routes/destinations');
const weatherRoutes = require('./routes/weather');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // disabled so frontend inline scripts work
}));

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/itinerary', itineraryRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/weather', weatherRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Travel Planner Agent',
    model: process.env.IBM_MODEL_ID || 'ibm/granite-4-h-small',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Catch-all: serve frontend index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`\n🌍 Travel Planner Agent running on http://localhost:${PORT}`);
  console.log(`🤖 IBM Granite Model: ${process.env.IBM_MODEL_ID || 'ibm/granite-4-h-small'}`);
  console.log(`📡 IBM API: ${process.env.IBM_API_URL}\n`);
});

module.exports = app;
