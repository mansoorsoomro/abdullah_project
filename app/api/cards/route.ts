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

        const formattedCards = cards.map((card: { toObject: () => any; _id: { toString: () => any; }; title: any; price: any; description: any; forSale: any; expiry: any; bank: any; type: any; zip: any; city: any; state: any; country: any; userAgent: any; videoLink: any; }) => {
            const decrypted = decryptCardData(card.toObject());
            return {
                id: card._id.toString(),
                title: card.title,
                price: card.price,
                description: card.description,
                forSale: card.forSale,
                cardNumber: decrypted.cardNumber, // Still decrypting, but only for the current page!
                cvv: decrypted.cvv,
                expiry: card.expiry,
                holder: decrypted.holder,
                address: decrypted.address,
                bank: card.bank,
                type: card.type,
                zip: card.zip,
                city: card.city,
                state: card.state,
                country: card.country,
                ssn: decrypted.ssn,
                dob: decrypted.dob,
                email: decrypted.email,
                phone: decrypted.phone,
                userAgent: card.userAgent,
                password: decrypted.password,
                ip: decrypted.ip,
                videoLink: card.videoLink
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
