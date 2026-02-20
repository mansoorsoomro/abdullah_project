export interface User {
    id: string;
    username: string;
    email: string;
    status: 'NOT_APPROVED' | 'APPROVED';
    balance: number;
}

export interface Card {
    id: string;
    title: string;
    price: number;
    description: string;
    forSale: boolean;
    cardNumber: string; // Fake card number for display
    cvv?: string;
    expiry?: string;
    holder?: string;
    address?: string;
    bank?: string;
    type?: string;
    zip?: string;
    city?: string;
    state?: string;
    country?: string;
    ssn?: string;
    dob?: string;
    email?: string;
    phone?: string;
    userAgent?: string;
    password?: string;
    ip?: string;
    videoLink?: string;
}

export interface Order {
    _id?: string;
    id: string;
    userId: string;
    cardId: string;
    cardTitle: string;
    cardNumber?: string;
    price: number;
    purchaseDate: Date | string;
}

export interface Payment {
    paymentId: string;
    trxId: string;
    amount: number;
    type: 'SIGNUP' | 'DEPOSIT';
    paymentStatus: 'PENDING' | 'APPROVED';
    userId: string;
    username: string;
    email: string;
    userStatus: 'NOT_APPROVED' | 'APPROVED' | 'N/A';
    createdAt: Date | string;
}

export interface ActivityLog {
    _id: string;
    userId: string;
    action: string;
    details: string;
    ip?: string;
    userAgent?: string;
    createdAt: Date | string;
}
