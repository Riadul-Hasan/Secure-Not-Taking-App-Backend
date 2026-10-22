require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./config/db');
const seedData = require('./utils/seedHelper');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: CLIENT_URL.split(',').map((url) => url.trim()),
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Secure Notes API is running' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/aggregations', require('./routes/aggregationRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  try {
    const created = await seedData();
    if (created.length) console.log(`✓ Seeded demo accounts: ${created.join(', ')}`);
  } catch (error) {
    console.error('✗ Seeding failed (the server will still start):', error.message);
  }

  app.listen(PORT, () => {
    console.log(`✓ Secure Notes API running on http://localhost:${PORT}`);
    console.log(`✓ Accepting requests from ${CLIENT_URL}`);
  });
};

start();

module.exports = app;