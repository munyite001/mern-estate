import express from 'express';
import { initiatePayment, handleMpesaCallback, getPaymentStatus } from '../controllers/payment.controller.js';

const router = express.Router();

// Route to initiate payment
router.post('/pay',  initiatePayment);

// Route to handle M-Pesa payment callback
router.post('/callback', handleMpesaCallback);

// Polling mechanism to check payment status
router.get('/status/:paymentId', getPaymentStatus);


export default router;
