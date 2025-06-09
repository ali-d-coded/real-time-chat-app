"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = void 0;
const User_1 = __importDefault(require("../models/User"));
const getUsers = async (req, res) => {
    const userId = req.user.id;
    const users = await User_1.default.find({ _id: { $ne: userId } }, '_id username isOnline');
    res.json(users);
    return;
};
exports.getUsers = getUsers;
