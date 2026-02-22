
import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { Order } from '../../../../lib/models';

export async function GET() {
    try {
        await connectDB();
        // Fetch orders, limit 2000 to cover full week history
        const orders = await Order.find().sort({ purchaseDate: -1 }).limit(2000);
        // For now limit to 100, or paginate. 
        // The user has 1836 orders, so showing all might be heavy.
        // But for admin dashboard overview, maybe just recent ones?
        // Or if I want to show "his history", maybe search by user?
        // For now, list all.

        return NextResponse.json({ orders });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
