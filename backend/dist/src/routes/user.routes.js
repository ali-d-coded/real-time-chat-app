"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const user_controller_1 = require("../controllers/user.controller");
const userRoutes = (0, express_1.Router)();
userRoutes.get('/', authMiddleware_1.authMiddleware, user_controller_1.getUsers);
exports.default = userRoutes;
