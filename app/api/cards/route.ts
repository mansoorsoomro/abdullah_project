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

        // Fetch cards — exclude Pakistani cards, forSale only
        const baseFilter = {
            forSale: true,
            country: { $not: { $regex: /^pakistan$/i } }   // remove Pakistani cards
        } as Record<string, unknown>;


        const [cards, total] = await Promise.all([
            CardModel.find(baseFilter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            CardModel.countDocuments(baseFilter)
        ]);

        const maskCardNumber = (num: string) => {
            if (!num) return 'XXXX XXXX XXXX XXXX';
            const clean = num.replace(/\s+/g, '');
            // Show first 6 digits, asterisk the rest
            const bin = clean.slice(0, 6);
            return bin.padEnd(clean.length, '*');
        };

        const rawFormatted = cards.map((card: { _id: { toString: () => string }; title: string; price: number; description: string; forSale: boolean; toObject: () => Record<string, unknown> }) => {
            const decrypted = decryptCardData(card.toObject()) as Card;
            return {
                id: card._id.toString(),
                title: card.title,
                price: card.price,
                description: card.description,
                forSale: card.forSale,
                cardNumber: maskCardNumber(decrypted.cardNumber),
                _rawCardNumber: decrypted.cardNumber, // for dedup only, removed below
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

        // Remove duplicates by raw card number
        const seen = new Set<string>();
        const formattedCards = rawFormatted
            .filter(c => {
                const key = c._rawCardNumber || c.id;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .map(({ _rawCardNumber, ...rest }) => rest);


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
