import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { Order } from '../../../../lib/models';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        await connectDB();
        const userOrders = await Order.find({ userId }).sort({ purchaseDate: -1 });

        const formattedOrders = userOrders.map((order: { _id: { toString: () => any; }; userId: any; cardId: any; cardTitle: any; cardNumber: any; price: any; purchaseDate: any; }) => ({
            id: order._id.toString(),
            userId: order.userId,
            cardId: order.cardId,
            cardTitle: order.cardTitle,
            cardNumber: order.cardNumber,
            price: order.price,
            purchaseDate: order.purchaseDate
        }));

        return NextResponse.json({ orders: formattedOrders });
    } catch (error) {
        console.error('Get orders error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
