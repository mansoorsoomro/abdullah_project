import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { Card } from '../../../lib/models';
import { decryptCardData } from '../../../lib/encryption';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '9'); // Default to 9 to match frontend grid
        const skip = (page - 1) * limit;

        // Fetch cards with pagination and count total
        const [cards, total] = await Promise.all([
            Card.find({ forSale: true })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Card.countDocuments({ forSale: true })
        ]);

        const maskCardNumber = (num: string) => {
            if (!num) return 'XXXX XXXX XXXX XXXX';
            const clean = num.replace(/\s+/g, '');
            // Show first 6 digits, asterisk the rest
            const bin = clean.slice(0, 6);
            return bin.padEnd(clean.length, '*');
        };

        const formattedCards = cards.map((card: any) => {
            const decrypted = decryptCardData(card.toObject());
            return {
                id: card._id.toString(),
                title: card.title,
                price: card.price,
                description: card.description,
                forSale: card.forSale,
                cardNumber: maskCardNumber(decrypted.cardNumber),
                expiry: card.expiry,
                bank: card.bank,
                type: card.type,
                zip: card.zip,
                city: card.city,
                state: card.state,
                country: card.country,
                userAgent: card.userAgent,
                videoLink: card.videoLink,
                proxy: card.proxy
            };
        });


        return NextResponse.json({
            cards: formattedCards,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                current: page
            }
        });
    } catch (error) {
        console.error('Get cards error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
