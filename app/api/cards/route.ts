import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { Card as CardModel } from '../../../lib/models';
import { decryptCardData } from '../../../lib/encryption';
import type { Card } from '../../../types';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '9'); // Default to 9 to match frontend grid
        const skip = (page - 1) * limit;

        // Fetch cards with pagination and count total
        const [cards, total] = await Promise.all([
            CardModel.find({ forSale: true })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            CardModel.countDocuments({ forSale: true })
        ]);

        const maskCardNumber = (num: string) => {
            if (!num) return 'XXXX XXXX XXXX XXXX';
            const clean = num.replace(/\s+/g, '');
            // Show first 6 digits, asterisk the rest
            const bin = clean.slice(0, 6);
            return bin.padEnd(clean.length, '*');
        };

        const formattedCards = cards.map((card: { _id: { toString: () => string }; title: string; price: number; description: string; forSale: boolean; toObject: () => Record<string, unknown> }) => {
            const decrypted = decryptCardData(card.toObject()) as Card;
            return {
                id: card._id.toString(),
                title: card.title,
                price: card.price,
                description: card.description,
                forSale: card.forSale,
                cardNumber: maskCardNumber(decrypted.cardNumber),
                expiry: decrypted.expiry,
                bank: decrypted.bank,
                type: decrypted.type,
                zip: decrypted.zip,
                city: decrypted.city,
                state: decrypted.state,
                country: decrypted.country,
                userAgent: decrypted.userAgent,
                videoLink: decrypted.videoLink,
                proxy: decrypted.proxy
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
