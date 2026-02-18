import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { Card } from '../../../../lib/models';
import { encryptCardData } from '../../../../lib/encryption';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const cardData = await req.json();

        // Encrypt sensitive data before saving
        const encryptedData = encryptCardData(cardData);

        // Create new card with encrypted fields
        const card = await Card.create(encryptedData);

        return NextResponse.json({
            success: true,
            message: 'Card added successfully',
            card: {
                id: card._id.toString(),
                title: card.title,
                price: card.price
            }
        });
    } catch (error) {
        console.error('Add card error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
