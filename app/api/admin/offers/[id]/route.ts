import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import { Offer } from '../../../../../lib/models';

// PUT /api/admin/offers/[id] — update
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await req.json();
        const { title, description, cardCount, discount, originalPrice, price, badge, isActive, styleIndex } = body;

        const avgPricePerCard = price && cardCount
            ? parseFloat((Number(price) / Number(cardCount)).toFixed(2))
            : undefined;

        const updated = await Offer.findByIdAndUpdate(
            id,
            {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(cardCount !== undefined && { cardCount: Number(cardCount) }),
                ...(discount !== undefined && { discount: Number(discount) }),
                ...(originalPrice !== undefined && { originalPrice: Number(originalPrice) }),
                ...(price !== undefined && { price: Number(price) }),
                ...(avgPricePerCard !== undefined && { avgPricePerCard }),
                ...(badge !== undefined && { badge }),
                ...(isActive !== undefined && { isActive }),
                ...(styleIndex !== undefined && { styleIndex: Number(styleIndex) }),
            },
            { new: true }
        );

        if (!updated) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
        return NextResponse.json({ success: true, offer: updated });
    } catch (err: unknown) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

// DELETE /api/admin/offers/[id] — delete
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        const deleted = await Offer.findByIdAndDelete(id);
        if (!deleted) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
