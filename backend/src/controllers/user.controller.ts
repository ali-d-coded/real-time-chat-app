import { Request, Response } from 'express';
import User from '../models/User';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.id;
  const users = await User.find({ _id: { $ne: userId } }, '_id username isOnline');
  res.json(users);
  return
};
