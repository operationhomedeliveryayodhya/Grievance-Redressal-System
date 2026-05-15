import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import complaintRoutes from './routes/complaintRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// app.use(cors({
//   origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
//   credentials: true
// }));
app.use(cors({
  origin: ['http://localhost:5500', 'https://complaints-registration-platform-full-r7lh.onrender.com'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Request logging for debugging deployment
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', complaintRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Keep process alive for long-running server
setInterval(() => { }, 10000);
