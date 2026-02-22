import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { User, Card, Order } from '../../../lib/models';
import { decrypt } from '../../../lib/encryption';

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

        // Deduct balance and mark card as sold
        user.balance = (user.balance || 0) - card.price;
        card.forSale = false;
        card.soldAt = new Date();

        await Promise.all([user.save(), card.save()]);

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
            purchaserName: user.username,
            purchaserEmail: user.email,
            price: card.price,
        });

        // Decrypt the order data for the immediate receipt popup
        const orderData = order.toObject();
        const decryptedOrder = {
            ...orderData,
            id: order._id.toString(),
            cardNumber: decrypt(orderData.cardNumber),
            cvv: decrypt(orderData.cvv),
            holder: decrypt(orderData.holder),
            address: decrypt(orderData.address),
            ssn: decrypt(orderData.ssn),
            dob: decrypt(orderData.dob),
            email: decrypt(orderData.email),
            phone: decrypt(orderData.phone),
            password: decrypt(orderData.password),
            ip: decrypt(orderData.ip),
            proxy: decrypt(orderData.proxy),
            zip: decrypt(orderData.zip),
            city: decrypt(orderData.city),
            state: decrypt(orderData.state),
            country: decrypt(orderData.country),
            bank: decrypt(orderData.bank),
            type: decrypt(orderData.type),
        };


        return NextResponse.json({
            success: true,
            message: 'Purchase successful',
            order: decryptedOrder,
            newBalance: user.balance
        });
    } catch (error) {
        console.error('Purchase error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
