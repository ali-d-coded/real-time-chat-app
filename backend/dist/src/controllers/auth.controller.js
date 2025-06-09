"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existing = await User_1.default.findOne({ email });
        if (existing) {
            res.status(409).json({ message: 'Email already exists' });
            return;
        }
        const hashed = await bcrypt_1.default.hash(password, 10);
        const user = new User_1.default({ username, email, password: hashed });
        await user.save();
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            user: { id: user._id, username, email },
            token
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Registration failed', error: err });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        const valid = await bcrypt_1.default.compare(password, user.password);
        if (!valid) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            user: { id: user._id, username: user.username, email },
            token
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Login failed', error: err });
    }
};
exports.loginUser = loginUser;
