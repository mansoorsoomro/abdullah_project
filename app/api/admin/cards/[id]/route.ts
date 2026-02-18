import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import { Card } from '../../../../../lib/models';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await connectDB();
        const card = await Card.findByIdAndDelete(id);

        if (!card) {
            return NextResponse.json({ error: 'Card not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Card deleted successfully'
        });
    } catch (error) {
        console.error('Delete card error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
