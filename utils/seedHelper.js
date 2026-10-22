const User = require('../models/User');
const Note = require('../models/Note');
const Post = require('../models/Post');

const seedData = async () => {
  const DEMO_USERS = [
    {
      name: 'System Administrator',
      email: 'admin@example.com',
      password: 'adminPassword123',
      role: 'admin',
      interests: ['security', 'analytics', 'productivity'],
    },
    {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'user',
      interests: ['productivity', 'design', 'security'],
    },
  ];

  const created = [];

  for (const demo of DEMO_USERS) {
    // eslint-disable-next-line no-await-in-loop
    let user = await User.findOne({ email: demo.email });

    if (!user) {
      // eslint-disable-next-line no-await-in-loop
      user = await User.create(demo);
      created.push(`${demo.email} (${demo.role})`);
    }

    // eslint-disable-next-line no-await-in-loop
    const noteCount = await Note.countDocuments({ user: user._id });
    if (noteCount === 0) {
      // eslint-disable-next-line no-await-in-loop
      await Note.create([
        {
          title: 'Welcome to Secure Notes',
          content:
            'This note belongs to the demo account. Create, edit and delete notes freely — everything is scoped to your account.',
          user: user._id,
        },
        {
          title: 'Project kickoff checklist',
          content:
            '1. Draft the requirements\n2. Wire the API\n3. Polish the UI\n4. Ship it',
          user: user._id,
        },
      ]);
    }

    // eslint-disable-next-line no-await-in-loop
    const postCount = await Post.countDocuments({ user: user._id });
    if (postCount === 0) {
      // eslint-disable-next-line no-await-in-loop
      await Post.create([
        {
          title: 'Announcement: secure notes are live',
          content: 'The aggregation dashboard now joins users with their posts.',
          user: user._id,
        },
        {
          title: 'How interest grouping works',
          content: 'Every interest tag becomes a group in the admin aggregation view.',
          user: user._id,
        },
      ]);
    }
  }

  return created;
};

module.exports = seedData;

if (require.main === module) {
  /* eslint-disable global-require */
  require('dotenv').config();
  const connectDB = require('../config/db');
  /* eslint-enable global-require */

  connectDB()
    .then(async () => {
      const created = await seedData();
      console.log(
        created.length
          ? `✓ Seeded: ${created.join(', ')}`
          : '✓ Seed already up to date — nothing to do.'
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error('✗ Seed failed:', error.message);
      process.exit(1);
    });
}