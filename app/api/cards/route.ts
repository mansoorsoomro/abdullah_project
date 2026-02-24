import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { Card as CardModel } from '../../../lib/models';
import { decryptCardData } from '../../../lib/encryption';
import type { Card } from '../../../types';

// ── Pakistani / South-Asian name keywords (case-insensitive) ──────────────
// If a cardholder name contains ANY of these tokens, the card is hidden.
const PAKISTANI_NAME_TOKENS = [
    // Very common Pakistani male names
    'muhammad', 'mohammed', 'mohammad', 'muhamad', 'muhammed',
    'ali', 'hassan', 'hussain', 'husain', 'hasan',
    'ahmed', 'ahmad', 'akhtar', 'akbar', 'anwar',
    'asif', 'asad', 'arif', 'arshad', 'awais',
    'bilal', 'babar', 'burhan',
    'dawood', 'danish', 'daniyal',
    'farhan', 'faisal', 'farooq', 'fahad', 'farrukh',
    'ghulam', 'gulzar',
    'hamza', 'haider', 'hanif', 'haroon', 'hashim',
    'ijaz', 'imran', 'irfan', 'ishaq', 'ishtiaq',
    'jahangir', 'jalil', 'jamil', 'javed', 'junaid',
    'kamran', 'kashif', 'khalid', 'khurram', 'khushal',
    'liaqat', 'luqman', 'majid', 'manzoor', 'masood',
    'nabeel', 'nadeem', 'naeem', 'nasir', 'naveed', 'noman',
    'omar', 'osama', 'owais',
    'qaiser', 'qasim',
    'rafiq', 'raheem', 'rahim', 'rashid', 'raza', 'rizwan', 'rehan',
    'saad', 'salman', 'saqib', 'shahid', 'shahzad', 'shan', 'shoaib',
    'sohail', 'suleman', 'sulaman', 'sultan',
    'tahir', 'talha', 'tanveer', 'tariq', 'tauseef', 'touseef',
    'umar', 'umair', 'usman', 'usama',
    'waheed', 'waseem', 'waqar', 'waqas',
    'yasir', 'yousaf', 'yousuf', 'younas', 'zafar', 'zahid',
    'zain', 'zubair', 'zia',
    // Very common Pakistani female names
    'aisha', 'ayesha', 'amina', 'amna', 'asma',
    'bushra', 'fatima', 'fiza', 'fozia',
    'hina', 'huma', 'humaira',
    'kiran', 'komal',
    'maryam', 'madiha', 'mariam', 'mehwish', 'munazza',
    'nadia', 'naila', 'nazia', 'noor', 'noreen',
    'rafia', 'rahila', 'rida', 'riffat', 'rukhsana',
    'saima', 'samina', 'sana', 'sarah', 'shazia', 'sidra', 'sobia', 'sumaira', 'sundas',
    'tabassum', 'tahira',
    'ume', 'ummah', 'uzma',
    'yasmeen', 'yasmin', 'zara', 'zainab', 'zubaida',
    // Common Pakistani last names / family names
    'khan', 'malik', 'sheikh', 'chaudhry', 'chaudhary', 'choudhry',
    'qureshi', 'ansari', 'siddiqui', 'siddiqy', 'hashmi', 'bukhari',
    'mirza', 'baig', 'abbasi', 'rajput', 'bhatti', 'butt', 'rana',
    'javed', 'niazi', 'afridi', 'durrani', 'gilani', 'bhutto', 'zardari',
    'nawaz', 'satti', 'gondal', 'bhatti', 'gujjar', 'lodhi',
];

// Build one regex from all tokens for fast matching
const PAKISTANI_REGEX = new RegExp(
    '\\b(' + PAKISTANI_NAME_TOKENS.join('|') + ')\\b',
    'i'
);

function hasPakistaniName(holder: string | undefined): boolean {
    if (!holder) return false;
    return PAKISTANI_REGEX.test(holder.trim());
}

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '9');
        const skip = (page - 1) * limit;

        // Fetch more cards than needed (2× limit) to compensate for post-decrypt filtering.
        // Pakistani country filter is applied at DB level (fast), holder-name filter after decrypt.
        const baseFilter = {
            forSale: true,
            country: { $not: { $regex: /^pakistan$/i } },   // DB-level: exclude Pakistani country
        } as Record<string, unknown>;

        // Fetch a larger batch so after name-filtering we still have enough for the page
        const fetchLimit = limit * 4;
        const cards = await CardModel.find(baseFilter)
            .sort({ createdAt: -1 })
            .skip(skip * 4)           // rough skip — we'll paginate properly below
            .limit(fetchLimit);

        const total = await CardModel.countDocuments(baseFilter);

        // ── Mask card number helper ───────────────────────────────────────
        const maskCardNumber = (num: string) => {
            if (!num) return 'XXXX XXXX XXXX XXXX';
            const clean = num.replace(/\s+/g, '');
            const bin = clean.slice(0, 6);
            return bin.padEnd(clean.length, '*');
        };

        // ── Decrypt, filter Pakistani holder names, deduplicate ───────────
        const seen = new Set<string>();
        const filtered: object[] = [];

        for (const card of cards) {
            const decrypted = decryptCardData(card.toObject()) as Card;

            // Skip if cardholder name contains Pakistani tokens
            if (hasPakistaniName(decrypted.holder)) continue;

            // Skip duplicates by raw card number
            const key = decrypted.cardNumber || card._id.toString();
            if (seen.has(key)) continue;
            seen.add(key);

            filtered.push({
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
                proxy: decrypted.proxy,
            });
        }

        // Apply page slice on the filtered result
        const formattedCards = filtered.slice(0, limit);

        return NextResponse.json({
            cards: formattedCards,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                current: page,
            },
        });
    } catch (error) {
        console.error('Get cards error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
