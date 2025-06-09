import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import apiRoutes from './routes/api.routes';
import authRoutes from './routes/auth.routes';
import { authMiddleware } from './middleware/authMiddleware';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use("/api", authMiddleware,apiRoutes)
app.use('/auth', authRoutes);

export default app;
