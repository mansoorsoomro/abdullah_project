import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { User, Card, Order } from '../../../lib/models';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { userId, cardId } = await req.json();

        if (!userId || !cardId) {
            return NextResponse.json({ error: 'User ID and Card ID are required' }, { status: 400 });
        }

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.status !== 'APPROVED') {
            return NextResponse.json({ error: 'User not approved' }, { status: 403 });
        }

        if (user.accountExpiresAt && new Date() > new Date(user.accountExpiresAt)) {
            return NextResponse.json({ error: 'Account expired. Please renew subscription.' }, { status: 403 });
        }

        const card = await Card.findById(cardId);
        if (!card) {
            return NextResponse.json({ error: 'Card not found' }, { status: 404 });
        }

        if ((user.balance || 0) < card.price) {
            return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
        }

        // Deduct balance
        user.balance = (user.balance || 0) - card.price;
        await user.save();

        const order = await Order.create({
            userId,
            cardId,
            cardTitle: card.title,
            cardNumber: card.cardNumber,
            cvv: card.cvv,
            expiry: card.expiry,
            holder: card.holder,
            address: card.address,
            bank: card.bank,
            type: card.type,
            zip: card.zip,
            city: card.city,
            state: card.state,
            country: card.country,
            ssn: card.ssn,
            dob: card.dob,
            email: card.email,
            phone: card.phone,
            userAgent: card.userAgent,
            password: card.password,
            ip: card.ip,
            videoLink: card.videoLink,
            proxy: card.proxy,
            price: card.price,
        });


        return NextResponse.json({
            success: true,
            message: 'Purchase successful',
            order,
            newBalance: user.balance
        });
    } catch (error) {
        console.error('Purchase error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
