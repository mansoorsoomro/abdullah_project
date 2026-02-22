import mongoose, { Schema, Document } from 'mongoose';

// User Schema
export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    trxId: string;
    status: 'NOT_APPROVED' | 'APPROVED';
    balance: number;
    accountExpiresAt?: Date;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    trxId: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ['NOT_APPROVED', 'APPROVED'],
        default: 'NOT_APPROVED',
    },
    balance: {
        type: Number,
        default: 0,
    },
    accountExpiresAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Payment Schema
export interface IPayment extends Document {
    trxId: string;
    amount: number;
    type: 'SIGNUP' | 'DEPOSIT';
    userId?: string; // Optional, for deposits primarily
    status: 'PENDING' | 'APPROVED';
    createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
    trxId: {
        type: String,
        required: true,
        unique: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        enum: ['SIGNUP', 'DEPOSIT'],
        required: true,
    },
    userId: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED'],
        default: 'PENDING',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Order Schema
export interface IOrder extends Document {
    userId: string;
    cardId: string;
    cardTitle: string;
    cardNumber: string;
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
    proxy?: string;
    price: number;
    purchaseDate: Date;
    purchaserUsername?: string;
    purchaserEmail?: string;
}


const OrderSchema = new Schema<IOrder>({
    userId: {
        type: String,
        required: true,
    },
    cardId: {
        type: String,
        required: true,
    },
    cardTitle: {
        type: String,
        required: true,
    },
    cardNumber: String,
    cvv: String,
    expiry: String,
    holder: String,
    address: String,
    bank: String,
    type: String,
    zip: String,
    city: String,
    state: String,
    country: String,
    ssn: String,
    dob: String,
    email: String,
    phone: String,
    userAgent: String,
    password: String,
    ip: String,
    videoLink: String,
    proxy: String,
    price: {
        type: Number,
        required: true,
    },
    purchaseDate: {
        type: Date,
        default: Date.now,
    },
    purchaserUsername: String,
    purchaserEmail: String,
});


// Card Schema with encryption for sensitive data
export interface ICard extends Document {
    title: string;
    price: number;
    description: string;
    forSale: boolean;
    cardNumber: string;
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
    proxy?: string;
    createdAt: Date;
    soldToUsername?: string;
    soldToEmail?: string;
    soldAt?: Date;
}


const CardSchema = new Schema<ICard>({
    title: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
    forSale: {
        type: Boolean,
        default: true,
    },
    cardNumber: {
        type: String,
        required: true,
    },
    cvv: String,
    expiry: String,
    holder: String,
    address: String,
    bank: String,
    type: String,
    zip: String,
    city: String,
    state: String,
    country: String,
    ssn: String,
    dob: String,
    email: String,
    phone: String,
    userAgent: String,
    password: String,
    ip: String,
    videoLink: String,
    proxy: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    soldToUsername: String,
    soldToEmail: String,
    soldAt: Date,
});

// Activity Log Schema
export interface IActivityLog extends Document {
    userId: string;
    action: string;
    details?: string;
    ip?: string;
    createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
    userId: {
        type: String,
        required: true,
        index: true, // Optimizes filtering logs by user
    },
    action: {
        type: String,
        required: true,
    },
    details: {
        type: String,
        default: '',
    },
    ip: {
        type: String,
        default: '',
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true, // Optimizes sorting by date
    },
});

// Create indexes for efficient querying
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ trxId: 1 });

PaymentSchema.index({ userId: 1, createdAt: -1 }); // Optimize payment history queries
PaymentSchema.index({ type: 1, status: 1 }); // Optimize filtering by type and status
PaymentSchema.index({ trxId: 1 });

OrderSchema.index({ userId: 1, purchaseDate: -1 }); // Optimize order history queries

CardSchema.index({ forSale: 1, createdAt: -1 }); // Optimize marketplace listings
CardSchema.index({ price: 1 }); // Optimize sorting by price

ActivityLogSchema.index({ userId: 1, createdAt: -1 }); // Optimize log history queries

// Bundle Order Schema
export interface IBundleOrder extends Document {
    userId: string;
    username: string;
    bundleTitle: string;
    cardCount: number;
    discount: number;
    originalPrice: number;
    price: number;
    purchaseDate: Date;
}

const BundleOrderSchema = new Schema<IBundleOrder>({
    userId: { type: String, required: true, index: true },
    username: { type: String, required: true },
    bundleTitle: { type: String, required: true },
    cardCount: { type: Number, required: true },
    discount: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    price: { type: Number, required: true },
    purchaseDate: { type: Date, default: Date.now },
});

BundleOrderSchema.index({ userId: 1, purchaseDate: -1 });

// ─── Offer Schema (admin-managed) ─────────────────────────────────────
export interface IOffer extends Document {
    title: string;
    description: string;
    cardCount: number;
    discount: number;          // percent e.g. 20
    originalPrice: number;
    price: number;
    avgPricePerCard: number;
    badge?: string;            // e.g. "BEST VALUE"
    isActive: boolean;
    styleIndex: number;        // 0-5 for colour theme
    createdAt: Date;
    updatedAt: Date;
}

const OfferSchema = new Schema<IOffer>({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    cardCount: { type: Number, required: true },
    discount: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    price: { type: Number, required: true },
    avgPricePerCard: { type: Number, required: true },
    badge: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    styleIndex: { type: Number, default: 0 },
}, { timestamps: true });

OfferSchema.index({ isActive: 1, createdAt: -1 });

// Export Models (Safe Check)
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Payment = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export const Card = mongoose.models.Card || mongoose.model<ICard>('Card', CardSchema);
export const ActivityLog = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
export const BundleOrder = mongoose.models.BundleOrder || mongoose.model<IBundleOrder>('BundleOrder', BundleOrderSchema);
export const Offer = mongoose.models.Offer || mongoose.model<IOffer>('Offer', OfferSchema);

// Setting Schema (global settings)
export interface ISetting extends Document {
    signupAmount: number;
    minDepositAmount: number;
}

const SettingSchema = new Schema<ISetting>({
    signupAmount: { type: Number, default: 2000 },
    minDepositAmount: { type: Number, default: 7000 },
});

export const Setting = mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);
