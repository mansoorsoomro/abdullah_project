import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { Offer, Card } from '../../../lib/models';

// GET /api/offers  →  returns active admin-created offers.
// If no offers exist yet fall back to auto-calculating from market cards.
export async function GET() {
    try {
        await connectDB();

        // Try DB-managed offers first
        const dbOffers = await Offer.find({ isActive: true }).sort({ createdAt: -1 });

        // Market context (always useful for the header stats)
        const availableCount = await Card.countDocuments({ forSale: true, price: { $gte: 500, $lte: 50000 } });
        const priceAgg = await Card.aggregate([
            { $match: { forSale: true, price: { $gte: 500, $lte: 50000 } } },
            { $group: { _id: null, avgPrice: { $avg: '$price' } } }
        ]);
        const avgPrice: number = priceAgg.length > 0 ? parseFloat(priceAgg[0].avgPrice.toFixed(2)) : 0;

        if (dbOffers.length > 0) {
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
        }

        // ── Fallback: auto-calculate if admin hasn't created any offers yet ──
        const BUNDLE_TIERS = [
            { cards: 10, discount: 10, title: 'STARTER DECK', description: 'Entry-level bulk access. Perfect for testing the waters with 10 premium cards.' },
            { cards: 20, discount: 15, title: 'HACKER SQUAD', description: 'Equip your team. 20 mixed-tier cards ready for immediate deployment.' },
            { cards: 30, discount: 20, title: 'SYNDICATE STASH', description: 'Serious inventory for serious operators. 30 cards at a bulk rate.' },
            { cards: 50, discount: 25, title: 'CARTEL CACHE', description: '50 premium assets for high-volume distribution. Best seller.' },
            { cards: 75, discount: 30, title: 'WARLORD ARMORY', description: 'Dominance package. 75 Elite cards. Dominate the market with this stockpile.' },
            { cards: 100, discount: 40, title: 'GOD MODE VAULT', description: 'Ultimate bulk deal. 100 cards. Maximum value, maximum power. Exclusive access.' },
        ];

        const fallback = BUNDLE_TIERS.filter(t => availableCount >= t.cards).map((tier, i) => {
            const orig = parseFloat((avgPrice * tier.cards).toFixed(2));
            const disc = parseFloat((orig * (1 - tier.discount / 100)).toFixed(2));
            return {
                _id: `auto_${i}`, id: `auto_${i}`,
                title: tier.title, description: tier.description,
                cardCount: tier.cards, discount: tier.discount,
                originalPrice: orig, price: disc,
                avgPricePerCard: parseFloat((disc / tier.cards).toFixed(2)),
                badge: '', isActive: true, styleIndex: i,
            };
        });

        return NextResponse.json({ offers: fallback, availableCards: availableCount, avgCardPrice: avgPrice });
    } catch (err) {
        console.error('Offers API error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
