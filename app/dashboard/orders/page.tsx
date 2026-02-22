'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Order, User } from '../../../types';

interface Payment {
    _id: string;
    trxId: string;
    amount: number;
    type: 'SIGNUP' | 'DEPOSIT';
    status: 'PENDING' | 'APPROVED';
    createdAt: string;
}

export default function Orders() {
    const [activeTab, setActiveTab] = useState<'purchases' | 'deposits'>('purchases');
    const [orders, setOrders] = useState<Order[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            fetchData(parsedUser.id);
        }
    }, []);

    const fetchData = async (userId: string) => {
        try {
            const [ordersRes, paymentsRes] = await Promise.all([
                fetch(`/api/orders/${userId}`),
                fetch(`/api/payments/${userId}`)
            ]);

            const ordersData = await ordersRes.json();
            const paymentsData = await paymentsRes.json();

            setOrders(ordersData.orders || []);
            setPayments(paymentsData.payments || []);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Helper to mask sensitive strings except last few chars
    const maskStart = (str: string | undefined, visibleCount: number = 3) => {
        if (!str) return 'N/A';
        if (str.length <= visibleCount) return str;
        const visible = str.slice(0, visibleCount);
        return `${visible}****`;
    };

    // Card number: show last 4
    const formatCardNumber = (num: string | undefined) => {
        if (!num) return 'XXXX XXXX XXXX XXXX';
        const clean = num.replace(/\s+/g, '');
        // Mask middle digits: show first 6 and last 4
        if (clean.length > 10) {
            const first = clean.slice(0, 6);
            const last = clean.slice(-4);
            return first + ' **** **** ' + last;
        }
        const matches = clean.match(/.{1,4}/g);
        return matches ? matches.join(' ') : clean;
    };

    const maskValue = (val: any) => {
        if (!val) return 'N/A';
        return '********';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="cyber-spinner"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto min-w-0">
            {/* Page header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4"
            >
                <div>
                    <h2 className="text-3xl md:text-4xl font-black mb-2 text-white tracking-tight">
                        TRANSACTION HISTORY
                    </h2>
                    <p className="text-gray-400 text-sm font-medium">
                        Manage your financial records and asset acquisitions.
                    </p>
                </div>

                {/* Stats Summary - Compact */}
                <div className="flex gap-4">
                    <div className="bg-[#111] border border-[#333] px-4 py-2 rounded-lg" style={{ padding: '20px' }}>
                        <span className="text-xs text-gray-500 font-bold block">TOTAL SPENT</span>
                        <span className="text-(--accent) font-black text-lg">
                            ${orders.reduce((sum, o) => sum + o.price, 0).toLocaleString()}
                        </span>
                    </div>
                    <div className="bg-[#111] border border-[#333] px-4 py-2 rounded-lg" style={{ padding: '20px' }}>
                        <span className="text-xs text-gray-500 font-bold block">TOTAL ORDERS</span>
                        <span className="text-white font-black text-lg">
                            {orders.length}
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-[#333]">
                <button
                    onClick={() => setActiveTab('purchases')}
                    className={`px-6 py-3 text-sm font-bold tracking-wide transition-all relative ${activeTab === 'purchases' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                        }`}
                >
                    PURCHASES ({orders.length})
                    {activeTab === 'purchases' && (
                        <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-(--accent)" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('deposits')}
                    className={`px-6 py-3 text-sm font-bold tracking-wide transition-all relative ${activeTab === 'deposits' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                        }`}
                >
                    DEPOSITS ({payments.length})
                    {activeTab === 'deposits' && (
                        <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-(--accent)" />
                    )}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'purchases' ? (
                    <motion.div
                        key="purchases"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {orders.length > 0 ? orders.map((order, index) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ padding: "0" }}
                                transition={{ delay: index * 0.1 }}
                                className="group relative perspective-[1000px] h-[240px] p-[12px]"
                            >
                                {/* 3D Card Container */}
                                <div className="relative w-full h-full transition-all duration-700 transform-style-3d group-hover:rotate-y-180">

                                    {/* FRONT SIDE (Warzone Theme + New Layout) */}
                                    <div className="absolute inset-0 backface-hidden">
                                        <div className="relative w-full h-full bg-[#111] rounded-2xl shadow-xl overflow-hidden text-white p-6 border border-gray-800 group-hover:border-(--accent) transition-colors duration-300 flex flex-col justify-between">

                                            {/* Background texture */}
                                            <div className="absolute inset-0 opacity-20 bg-[url('/grid.png')] bg-cover"></div>
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-(--accent)/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                                            {/* Top Row: Chip and Price */}
                                            <div className="relative z-10 flex justify-between items-start" style={{ padding: "10px" }}>
                                                <div className="w-12 h-9 bg-yellow-600 rounded-md shadow-sm border border-yellow-500/30 relative overflow-hidden flex items-center justify-center">
                                                    <div className="absolute inset-0 bg-linear-to-br from-yellow-400/20 to-transparent"></div>
                                                    <div className="grid grid-cols-2 gap-1 w-full h-full p-[2px] opacity-60">
                                                        <div className="border border-black/30 rounded-sm"></div>
                                                        <div className="border border-black/30 rounded-sm"></div>
                                                        <div className="border border-black/30 rounded-sm"></div>
                                                        <div className="border border-black/30 rounded-sm"></div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="bg-(--accent)/20 border border-(--accent)/50 px-3 py-1 rounded-full text-xs font-black shadow-[0_0_15px_rgba(255,0,51,0.3)] text-(--accent)">
                                                        {order.price} USDT
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Number */}
                                            <div className="relative z-10 mt-2" style={{ padding: "10px" }}>
                                                <p className="text-xl md:text-2xl font-mono font-bold tracking-widest drop-shadow-md whitespace-nowrap text-gray-200 group-hover:text-white transition-colors">
                                                    {formatCardNumber(order.cardNumber).replace(/\*/g, 'X')}
                                                </p>
                                            </div>

                                            {/* Bottom Info */}
                                            <div className="relative z-10 flex justify-between items-end mt-2 px-3" style={{ padding: "12px" }}>
                                                <div>
                                                    <p className="text-[9px] uppercase text-(--accent) font-bold mb-0.5 tracking-wider">Card Holder</p>
                                                    <p className="font-mono font-bold text-xs ml-3 tracking-wide uppercase text-gray-300">YOU</p>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <p className="text-[9px] uppercase text-(--accent) font-bold mb-0.5 tracking-wider">Expires</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-mono font-bold text-xs tracking-wide text-gray-300">XX/XX</p>
                                                        <h3 className="text-xl font-black italic tracking-tighter leading-none text-white opacity-80">VISA</h3>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Scan line effect */}
                                            <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-transparent via-(--accent)/5 to-transparent h-[200%] w-full animate-scan opacity-0 group-hover:opacity-100 transition-opacity z-20"></div>
                                        </div>
                                    </div>

                                    {/* BACK SIDE (Warzone Theme + Content) */}
                                    <div className="absolute inset-0 backface-hidden rotate-y-180">
                                        <div className="relative w-full h-full bg-[#0a0a0a] rounded-2xl shadow-xl overflow-hidden border border-gray-800 flex flex-col group-hover:border-(--accent) transition-colors duration-300">

                                            {/* Magnetic Strip */}
                                            <div className="w-full h-10 bg-black mt-5 border-y border-gray-900"></div>

                                            {/* CVC Section */}
                                            <div className="px-6 mt-3 flex items-center justify-between">
                                                <div className="w-3/4 relative">
                                                    <div className="bg-white h-8 w-full flex items-center justify-end px-3">
                                                        <span className="font-mono font-bold text-black tracking-widest">XXX</span>
                                                    </div>
                                                    <span className="absolute -top-3 right-0 text-[8px] text-(--accent) font-bold tracking-widest">CVV / CVC</span>
                                                </div>
                                            </div>

                                            {/* Bottom Logo & Action */}
                                            <div className="flex-1 flex items-end justify-between px-6 pb-4">
                                                <div className="flex flex-col gap-1 opacity-50">
                                                    <div className="text-[8px] text-gray-400">Transaction ID</div>
                                                    <div className="text-[10px] text-white font-mono">{order.id.slice(0, 8)}...</div>
                                                </div>
                                                <div className="text-right">
                                                    <h3 className="text-xl font-black italic text-gray-500 tracking-tighter mb-2">VISA</h3>
                                                </div>
                                            </div>

                                            {/* Purchase Overlay - Showing Purchased State */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-[2px] z-10">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-green-500 font-black text-lg tracking-widest mb-2">P A I D</span>
                                                    <span className="text-xs text-gray-400 font-mono">{formatDate(order.purchaseDate)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </motion.div>
                        )) : (
                            <div className="text-center py-20 text-gray-500 col-span-full">
                                <p>No purchase history found.</p>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="deposits"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {payments.length > 0 ? payments.map((payment, index) => (
                            <motion.div
                                key={payment._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group relative bg-[#0a0a0a] border border-gray-800 hover:border-(--accent) transition-all duration-300 rounded-lg overflow-hidden h-[200px] flex flex-col shadow-lg"
                            >
                                {/* Pattern Overlay */}
                                <div className="absolute inset-0 bg-[url('/grid.png')] opacity-10 pointer-events-none"></div>

                                {/* Header Bar */}
                                <div className={`h-1 w-full ${payment.type === 'DEPOSIT' ? 'bg-blue-600 shadow-[0_0_10px_#2563eb]' : 'bg-purple-600 shadow-[0_0_10px_#9333ea]'}`}></div>

                                <div className="p-6 flex flex-col h-full justify-between relative z-10" style={{ padding: '24px' }}>
                                    {/* Top Row */}
                                    <div className="flex justify-between items-start">
                                        <div className={`px-2 py-1 rounded text-[10px] font-black tracking-widest border ${payment.type === 'DEPOSIT'
                                            ? 'bg-blue-900/20 text-blue-500 border-blue-500/30'
                                            : 'bg-purple-900/20 text-purple-500 border-purple-500/30'
                                            }`}>
                                            {payment.type}
                                        </div>
                                        <div className={`flex items-center gap-1.5 text-xs font-bold ${payment.status === 'APPROVED' ? 'text-green-500' : 'text-yellow-500'
                                            }`}>
                                            {payment.status === 'APPROVED' ? <span className="animate-pulse">●</span> : '○'} {payment.status}
                                        </div>
                                    </div>

                                    {/* Amount - Center Big */}
                                    <div className="text-center my-1 relative">
                                        <span className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md group-hover:text-(--accent) transition-colors">
                                            ${payment.amount.toLocaleString()}
                                        </span>
                                        <div className="text-[10px] text-gray-500 font-mono tracking-widest mt-1 uppercase text-opacity-50">USDT (TRC20)</div>
                                    </div>

                                    {/* Bottom Details */}
                                    <div className="border-t border-dashed border-gray-800 pt-3 mt-auto">
                                        <div className="flex justify-between items-end">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">TX HASH</span>
                                                <span className="text-[10px] font-mono text-gray-300 bg-gray-900/50 px-1.5 py-0.5 rounded border border-gray-800 group-hover:border-(--accent)/30 transition-colors cursor-help" title={payment.trxId}>
                                                    {payment.trxId.slice(0, 6)}...{payment.trxId.slice(-4)}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] text-gray-500 font-bold block mb-0.5 tracking-wider">DATE</span>
                                                <span className="text-[10px] text-gray-300 font-mono">
                                                    {new Date(payment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Hover Glow */}
                                <div className="absolute inset-0 bg-linear-to-br from-(--accent)/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            </motion.div>
                        )) : (
                            <div className="text-center py-20 text-gray-500 col-span-full">
                                <p>No deposit history found.</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
