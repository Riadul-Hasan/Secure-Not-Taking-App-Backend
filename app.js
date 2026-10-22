require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const CLIENT_URLS = new Set([
  'https://secure-jotter.surge.sh',
  ...[
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ],
  ...(process.env.CLIENT_URL || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
]);

app.use(
  cors({
    origin: (origin, callback) => {
      const isLocalOrigin = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
      if (!origin || isLocalOrigin || CLIENT_URLS.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Secure Notes API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Secure Notes API is running' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/aggregations', require('./routes/aggregationRoutes'));

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  const connectDB = require('./config/db');
  const seedData = require('./utils/seedHelper');
  const PORT = process.env.PORT || 5000;

  await connectDB();

  try {
    const created = await seedData();
    if (created.length) console.log(`✓ Seeded demo accounts: ${created.join(', ')}`);
  } catch (error) {
    console.error('✗ Seeding failed (the server will still start):', error.message);
  }

  app.listen(PORT, () => {
    console.log(`✓ Secure Notes API running on http://localhost:${PORT}`);
    console.log(`✓ Accepting requests from ${[...CLIENT_URLS].join(', ')} and local development origins`);
  });
};

if (require.main === module) {
  start().catch((error) => {
    console.error('✗ Server startup failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = app;