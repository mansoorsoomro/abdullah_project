import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { Card } from '../../../lib/models';
import { decryptCardData } from '../../../lib/encryption';

const maskCardNumber = (num?: string) => {
    if (!num) return '';
    if (num.length <= 10) return '*'.repeat(num.length);
    return num.substring(0, 6) + '*'.repeat(Math.max(0, num.length - 10)) + num.substring(num.length - 4);
};

export async function GET() {
    try {
        await connectDB();
        const cards = await Card.find({ forSale: true }).sort({ createdAt: -1 });

        const formattedCards = cards.map((card: { toObject: () => any; _id: { toString: () => any; }; title: any; price: any; description: any; forSale: any; expiry: any; bank: any; type: any; zip: any; city: any; state: any; country: any; userAgent: any; videoLink: any; }) => {
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
                proxy: decrypted.proxy
            };
        });

        return NextResponse.json({ cards: formattedCards });
    } catch (error) {
        console.error('Get cards error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
