import { Request, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { sendOTPEmail } from '../services/mailService';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const sendOTP = async (req: Request, res: Response) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  let otp = ''; // Define outside so it's accessible in catch block

  try {
    otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ error: 'Email already registered and verified' });
      }
      // Update OTP for unverified user
      await db.update(users).set({ name, otp, otpExpiry }).where(eq(users.id, existingUser.id));
    } else {
      // Create new unverified user
      await db.insert(users).values({
        name,
        email,
        password: '', // Will be set during registration
        otp,
        otpExpiry,
        isVerified: false,
      });
    }

    console.log(`GENERATED OTP FOR ${email}: ${otp}`);

    await sendOTPEmail(email, otp, name);
    res.json({ message: 'OTP sent to your email' });
  } catch (error: any) {
    console.error('Error in sendOTP handler:', error);
    res.status(500).json({ error: error.message || 'Failed to send OTP' });
  }
};

export const register = async (req: Request, res: Response) => {
  const { email, otp, password } = req.body;

  try {
    const user = await db.query.users.findFirst({
      where: and(eq(users.email, email), eq(users.otp, otp)),
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid OTP or email' });
    }

    if (user.otpExpiry && user.otpExpiry < new Date()) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    await db.update(users).set({
      password, // Plain text as requested
      isVerified: true,
      otp: null,
      otpExpiry: null,
    }).where(eq(users.id, user.id));

    res.json({ message: 'Registration successful' });
  } catch (error: any) {
    console.error('Error in register:', error);
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log(`Login attempt for: ${email}`);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !user.isVerified || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    const isProduction = req.get('host')?.includes('onrender.com');

    res.cookie('token', token, {
      httpOnly: true, // Recommended for security
      secure: isProduction, // Must be true for sameSite: 'none'
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.json({ name: user.name, email: user.email, role: user.role });
  } catch (error: any) {
    console.error('Error in login:', error);
    res.status(500).json({ error: error.message });
  }
};

export const logout = (req: Request, res: Response) => {
  const isProduction = req.get('host')?.includes('onrender.com');
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
  res.json({ message: 'Logged out' });
};

export const me = async (req: Request, res: Response) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.id),
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
