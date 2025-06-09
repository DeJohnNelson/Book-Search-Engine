import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

interface JwtPayload {
  _id: string;
  username: string;
  email: string;
}


export const authenticateToken = async ({ req }: { req: any }) => {
  let token = req.headers.authorization || '';

  if (!token) return { user: null };

  try {
    const decoded = jwt.verify(token) as JwtPayload;
    return { user: decoded };
  } catch (err) {
    console.warn('Invalid token');
    return { user: null };
  }
};
