import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Booking-scoped conversation retrieval / lazy creation
router.get('/bookings/:bookingId/conversation', requireAuth, ConversationController.getBookingConversation);

// User's conversation list
router.get('/conversations', requireAuth, ConversationController.getUserConversations);

// Conversation messages & sending
router.get('/conversations/:id/messages', requireAuth, ConversationController.getConversationMessages);
router.post('/conversations/:id/messages', requireAuth, ConversationController.sendMessage);

export default router;
