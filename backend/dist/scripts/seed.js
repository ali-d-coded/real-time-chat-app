"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = __importDefault(require("../models/User"));
dotenv_1.default.config();
const MONGO_URI = process.env.MONGO_URI;
const seedUsers = async () => {
    await mongoose_1.default.connect(MONGO_URI);
    await User_1.default.deleteMany({});
    const users = [
        { username: 'Alice', email: 'alice@example.com', password: 'pass123' },
        { username: 'Bob', email: 'bob@example.com', password: 'pass123' },
        { username: 'Charlie', email: 'charlie@example.com', password: 'pass123' },
    ];
    for (const user of users) {
        const hashed = await bcrypt_1.default.hash(user.password, 10);
        await User_1.default.create({ ...user, password: hashed });
    }
    console.log('✅ Users seeded.');
    process.exit(0);
};
seedUsers();
