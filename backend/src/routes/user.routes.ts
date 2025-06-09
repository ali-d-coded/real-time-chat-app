import { Router } from 'express';
import { getUsers } from '../controllers/user.controller';

const userRoutes = Router();
userRoutes.get('/', getUsers);

export default userRoutes;
