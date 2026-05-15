import { Request, Response } from 'express';
import { db } from '../db';
import { complaints, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { generateFollowUpQuestion } from '../services/aiService';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const getUserIdFromToken = (req: Request) => {
  const token = req.cookies.token;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch {
    return null;
  }
};

export const getAIQuestion = async (req: Request, res: Response) => {
  const { complaintText } = req.body;
  if (!complaintText) return res.status(400).json({ error: 'Complaint text required' });

  try {
    const question = await generateFollowUpQuestion(complaintText);
    res.json({ question });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createComplaint = async (req: Request, res: Response) => {
  const decoded = getUserIdFromToken(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

  const { complaintText, aiQuestion, userAnswer } = req.body;

  try {
    const [newComplaint] = await db.insert(complaints).values({
      userId: decoded.id,
      complaintText,
      aiQuestion,
      userAnswer,
    }).returning();

    res.json(newComplaint);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyComplaints = async (req: Request, res: Response) => {
  const decoded = getUserIdFromToken(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const userComplaints = await db.query.complaints.findMany({
      where: eq(complaints.userId, decoded.id),
      orderBy: [desc(complaints.createdAt)],
    });
    res.json(userComplaints);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllComplaints = async (req: Request, res: Response) => {
  const decoded = getUserIdFromToken(req);
  if (!decoded || decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  try {
    // Joining with users to get name and email
    const allComplaints = await db.query.complaints.findMany({
      with: {
        // This requires 'with' setup in Drizzle schema relations if using relational query builder
        // Or we can use standard join
      },
      orderBy: [desc(complaints.createdAt)],
    });

    // Let's use a standard join for simplicity if relations aren't explicitly defined for 'with'
    const results = await db
      .select({
        id: complaints.id,
        complaintText: complaints.complaintText,
        aiQuestion: complaints.aiQuestion,
        userAnswer: complaints.userAnswer,
        createdAt: complaints.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(complaints)
      .leftJoin(users, eq(complaints.userId, users.id))
      .orderBy(desc(complaints.createdAt));

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
