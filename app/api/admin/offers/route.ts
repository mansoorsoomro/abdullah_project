import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { Offer } from '../../../../lib/models';

// GET /api/admin/offers — list all offers (active + inactive)
export async function GET() {
    try {
        await connectDB();
        const offers = await Offer.find({}).sort({ createdAt: -1 });
        const formatted = offers.map((o: any) => ({
            _id: o._id.toString(),
            id: o._id.toString(),
            title: o.title,
            description: o.description,
            cardCount: o.cardCount,
            discount: o.discount,
            originalPrice: o.originalPrice,
            price: o.price,
            avgPricePerCard: o.avgPricePerCard,
            badge: o.badge || '',
            isActive: o.isActive,
            styleIndex: o.styleIndex ?? 0,
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
        }));
        return NextResponse.json({ offers: formatted });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/admin/offers — create a new offer
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();

        const { title, description, cardCount, discount, originalPrice, price, badge, isActive, styleIndex } = body;

        if (!title || !cardCount || discount == null || !originalPrice || !price) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const avgPricePerCard = parseFloat((price / cardCount).toFixed(2));

        const offer = await Offer.create({
            title,
            description: description || '',
            cardCount: Number(cardCount),
            discount: Number(discount),
            originalPrice: Number(originalPrice),
            price: Number(price),
            avgPricePerCard,
            badge: badge || '',
            isActive: isActive !== false,
            styleIndex: Number(styleIndex ?? 0),
        });

        return NextResponse.json({ success: true, offer });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
