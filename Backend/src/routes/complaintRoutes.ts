import { Router } from 'express';
import { getAIQuestion, createComplaint, getMyComplaints, getAllComplaints } from '../controllers/complaintController';

const router = Router();

router.post('/ai/question', getAIQuestion);
router.post('/complaints', createComplaint);
router.get('/complaints/my', getMyComplaints);
router.get('/admin/complaints', getAllComplaints);

export default router;
