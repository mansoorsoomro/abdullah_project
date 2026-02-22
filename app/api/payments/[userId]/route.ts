import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { User, Payment } from '../../../../lib/models';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        await connectDB();
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const payments = await Payment.find({
            $or: [
                { userId: userId },
                { trxId: user.trxId }
            ]
        }).sort({ createdAt: -1 });

        return NextResponse.json({ payments });
    } catch (error) {
        console.error('Get user payments error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
