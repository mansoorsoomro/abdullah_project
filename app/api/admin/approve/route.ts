import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { User, Payment } from '../../../../lib/models';
import { sendApprovalEmail } from '../../../../lib/emailService';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { trxId } = await req.json();

        if (!trxId) {
            return NextResponse.json({ error: 'TRX ID is required' }, { status: 400 });
        }

        const payment = await Payment.findOne({ trxId });
        if (!payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        if (payment.status === 'APPROVED') {
            return NextResponse.json({ error: 'Payment already approved' }, { status: 400 });
        }

        if (payment.type === 'DEPOSIT') {
            if (!payment.userId) {
                return NextResponse.json({ error: 'Deposit payment missing user ID' }, { status: 400 });
            }

            const user = await User.findById(payment.userId);
            if (!user) {
                return NextResponse.json({ error: 'User not found for this deposit' }, { status: 404 });
            }

            // Add balance
            user.balance = (user.balance || 0) + payment.amount;
            payment.status = 'APPROVED';

            await user.save();
            await payment.save();

            return NextResponse.json({
                success: true,
                message: 'Deposit approved and balance updated',
            });
        } else {
            // SIGNUP type
            const user = await User.findOne({ trxId: trxId });

            if (user) {
                user.status = 'APPROVED';
                if (!user.accountExpiresAt) {
                    user.accountExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                }
                await user.save();

                // Send email
                await sendApprovalEmail(user.email, user.username).catch(e => console.error('Email failed:', e));
            }

            payment.status = 'APPROVED';
            await payment.save();

            return NextResponse.json({
                success: true,
                message: 'User signup approved successfully',
            });
        }
    } catch (error) {
        console.error('Approve error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
