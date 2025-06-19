import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const adminRoutes = ["/messages/campaigns/all"]

export const authMiddleware = (req: Request, res: Response, next: NextFunction):any => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });


  try {
    const decoded:any = jwt.verify(token, process.env.JWT_SECRET!);
console.log({decoded});

    if(decoded.role != 'admin' && adminRoutes.includes(req.path)){
      throw new Error("Unauthorized");
    }

    (req as any).user = decoded;
    next();
  } catch(error:any) {
    res.status(401).json({ message: error.message || 'Invalid token' });
  }
};
