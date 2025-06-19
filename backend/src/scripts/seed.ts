import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../models/User';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI!;

const seedUsers = async () => {
  await mongoose.connect(MONGO_URI);
  await User.deleteMany({});

  const users = [
    { username: 'Alice', email: 'alice@example.com', password: 'pass123' },
    { username: 'Bob', email: 'bob@example.com', password: 'pass123' },
    { username: 'Charlie', email: 'charlie@example.com', password: 'pass123' },
    { username: 'Admin', email: 'admin@example.com', password: 'pass123', role: 'admin' },
  ];

  for (const user of users) {
    const hashed = await bcrypt.hash(user.password, 10);
    await User.create({ ...user, password: hashed });
  }

  console.log('✅ Users seeded.');
  process.exit(0);
};

seedUsers();
