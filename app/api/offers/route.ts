/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @next/next/no-img-element */
import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { Offer, Card } from '../../../lib/models';

// GET /api/offers  →  returns active admin-created offers only.
// No fallback — if admin hasn't created any offers, returns empty array.
export async function GET() {
    try {
        await connectDB();

        // Fetch active offers from DB
        const dbOffers = await Offer.find({ isActive: true }).sort({ createdAt: -1 });

        // Market stats (for header display)
        const availableCount = await Card.countDocuments({ forSale: true, price: { $gte: 500, $lte: 50000 } });
        const priceAgg = await Card.aggregate([
            { $match: { forSale: true, price: { $gte: 500, $lte: 50000 } } },
            { $group: { _id: null, avgPrice: { $avg: '$price' } } }
        ]);
        const avgPrice: number = priceAgg.length > 0 ? parseFloat(priceAgg[0].avgPrice.toFixed(2)) : 0;

        const formatted = dbOffers.map((o: any) => ({
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
        }));

        return NextResponse.json({ offers: formatted, availableCards: availableCount, avgCardPrice: avgPrice });
    } catch (err) {
        console.error('Offers API error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
