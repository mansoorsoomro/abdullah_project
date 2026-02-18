import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { User, Payment, Order } from '../../../../lib/models';

export async function POST() {
    try {
        await connectDB();
        const username = 'LegendaryUser';

        // Cleanup existing
        await User.deleteOne({ username });

        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 7); // 7 days ago

        const expiresAt = new Date(pastDate);
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days validity from creation

        const trxId = 'LEGEND_' + Date.now();

        // Create User
        const user = await User.create({
            username,
            email: 'legend@warzone.com',
            password: 'password123',
            trxId,
            status: 'APPROVED',
            balance: 55420, // High balance
            accountExpiresAt: expiresAt,
            createdAt: pastDate
        });

        // Create Deposits
        const deposits = [
            { amount: 50000, daysAgo: 7 },
            { amount: 150000, daysAgo: 5 },
            { amount: 200000, daysAgo: 2 }
        ];

        for (const dep of deposits) {
            const dDate = new Date();
            dDate.setDate(dDate.getDate() - dep.daysAgo);

            await Payment.create({
                trxId: 'DEP_' + Date.now() + '_' + dep.amount,
                amount: dep.amount,
                type: 'DEPOSIT',
                userId: user._id,
                status: 'APPROVED',
                createdAt: dDate
            });
        }

        // Create 1836 Orders
        const orders = [];
        const cardTypes = ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'];
        const banks = ['CHASE', 'BOA', 'WELLS FARGO', 'CITI'];
        const totalOrders = 1836;

        for (let i = 0; i < totalOrders; i++) {
            const oDate = new Date();
            const daysBack = Math.random() * 7;
            oDate.setDate(oDate.getDate() - daysBack);
            const randomPrice = Math.floor(Math.random() * 3000) + 2000;

            orders.push({
                userId: user._id,
                cardId: 'mock_card_' + i,
                cardTitle: `${cardTypes[Math.floor(Math.random() * cardTypes.length)]} - ${banks[Math.floor(Math.random() * banks.length)]} PLATINUM`,
                cardNumber: '**** **** **** ' + Math.floor(1000 + Math.random() * 9000),
                price: randomPrice,
                purchaseDate: oDate
            });
        }

        // Insert in chunks
        const chunkSize = 500;
        for (let i = 0; i < orders.length; i += chunkSize) {
            await Order.insertMany(orders.slice(i, i + chunkSize));
        }

        return NextResponse.json({
            success: true,
            message: 'Legendary user created',
            user: {
                username: user.username,
                password: 'password123',
                orders: totalOrders
            }
        });

    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
