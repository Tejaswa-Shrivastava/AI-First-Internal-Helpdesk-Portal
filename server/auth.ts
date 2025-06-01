import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import session from "express-session";
import { storage } from "./storage";
import { User } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function setupSession(app: any) {
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key-for-development',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to false for development
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    name: 'helpdesk.sid'
  }));
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    // Get user from session
    storage.getUser(req.session.userId)
      .then(user => {
        if (user && user.isActive) {
          req.user = user;
          next();
        } else {
          console.log("User not found or inactive:", req.session.userId);
          res.status(401).json({ message: "Unauthorized" });
        }
      })
      .catch((error) => {
        console.log("Error getting user from session:", error);
        res.status(401).json({ message: "Unauthorized" });
      });
  } else {
    console.log("No session or userId:", req.session?.userId);
    res.status(401).json({ message: "Unauthorized" });
  }
}

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    
    next();
  };
}