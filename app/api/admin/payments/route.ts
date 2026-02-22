/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @next/next/no-img-element */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { User, Payment } from '../../../../lib/models';

export async function GET() {
    try {
        await connectDB();
        const payments = await Payment.find().sort({ createdAt: -1 });

        const paymentData = await Promise.all(
            payments.map(async (payment: { trxId: any; _id: any; status: any; createdAt: any; }) => {
                const user = await User.findOne({ trxId: payment.trxId });
                return {
                    paymentId: payment._id,
                    trxId: payment.trxId,
                    paymentStatus: payment.status,
                    userId: user?._id || 'N/A',
                    username: user?.username || 'N/A',
                    email: user?.email || 'N/A',
                    userStatus: user?.status || 'N/A',
                    createdAt: payment.createdAt,
                };
            })
        );

        return NextResponse.json({ payments: paymentData });
    } catch (error) {
        console.error('Get payments error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
