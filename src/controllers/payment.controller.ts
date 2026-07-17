import { FastifyReply } from 'fastify';
import { AuthRequest } from '../types';
import { prisma } from '../config/database';
import { AppError, sendSuccess } from '../utils/apiResponse';
// @ts-ignore
import Razorpay from 'razorpay';

export class PaymentController {
    createRazorpayOrder = async (request: AuthRequest, reply: FastifyReply) => {
        const { id: eventId } = request.params as any;
        const { teamSize, isMember } = request.body as any;
        
        const event = await prisma.event.findUnique({
            where: { id: eventId, deletedAt: null },
        });

        if (!event) throw new AppError('Event not found.', 404);
        if (!event.isPaid) throw new AppError('Event is not a paid event.', 400);

        let ticketPrice = event.ticketPrice || 0;
        if (event.isIeeeEvent) {
            ticketPrice = (isMember ? event.ieeeMemberPrice : event.nonIeeeMemberPrice) ?? 0;
        }
        
        const count = Math.max(1, parseInt(teamSize) || 1);
        const amount = ticketPrice * count;

        if (amount <= 0) throw new AppError('Invalid payment amount.', 400);

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new AppError('Razorpay is not configured on the server.', 500);
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: amount * 100, // Amount in smallest currency unit (paise)
            currency: 'INR',
            receipt: `receipt_event_${eventId}_${Date.now()}`
        };

        try {
            const order = await razorpay.orders.create(options);
            
            sendSuccess(reply, {
                order_id: order.id,
                amount: options.amount,
                currency: options.currency,
                key_id: process.env.RAZORPAY_KEY_ID
            }, 'Order created successfully');
        } catch (error: any) {
            throw new AppError(`Failed to create Razorpay order: ${error.message}`, 500);
        }
    };
}

export const paymentController = new PaymentController();
