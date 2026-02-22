import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { Order } from '../../../../lib/models';
import { decrypt } from '../../../../lib/encryption';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        await connectDB();
        const userOrders = await Order.find({ userId }).sort({ purchaseDate: -1 });

        const formattedOrders = userOrders.map((order: any) => {
            const data = order.toObject();

            // Explicitly decrypt EACH field directly to be 100% sure we get plain text
            return {
                id: data._id?.toString() || order._id.toString(),
                userId: data.userId,
                cardId: data.cardId,
                cardTitle: data.cardTitle,
                cardNumber: decrypt(data.cardNumber),
                cvv: decrypt(data.cvv),
                expiry: data.expiry,
                holder: decrypt(data.holder),
                address: decrypt(data.address),
                bank: decrypt(data.bank),
                type: decrypt(data.type),
                zip: decrypt(data.zip),
                city: decrypt(data.city),
                state: decrypt(data.state),
                country: decrypt(data.country),
                ssn: decrypt(data.ssn),
                dob: decrypt(data.dob),
                email: decrypt(data.email),
                phone: decrypt(data.phone),
                userAgent: data.userAgent,
                password: decrypt(data.password),
                ip: decrypt(data.ip),
                videoLink: data.videoLink,
                proxy: decrypt(data.proxy),
                price: data.price,
                purchaseDate: data.purchaseDate
            };
        });

        return NextResponse.json({
            orders: formattedOrders
        });
    } catch (error) {
        console.error('Get orders error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
