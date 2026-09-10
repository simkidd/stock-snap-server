import { User } from 'src/generated/prisma';

declare global {
  namespace Express {
    interface Request {
      token?: string;
      user?: User;
    }
  }
}
