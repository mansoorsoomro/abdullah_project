'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Order, User, BundleOrder } from '../../../types';
import { Package, CheckCircle, Percent, ExternalLink } from 'lucide-react';

interface Payment {
    _id: string;
    trxId: string;
    amount: number;
    type: 'SIGNUP' | 'DEPOSIT';
    status: 'PENDING' | 'APPROVED';
    createdAt: string;
}

export default function Orders() {
    const [activeTab, setActiveTab] = useState<'purchases' | 'bundles' | 'deposits'>('purchases');
    const [orders, setOrders] = useState<Order[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [bundleOrders, setBundleOrders] = useState<BundleOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    const [purchasesPage, setPurchasesPage] = useState(1);
    const [depositsPage, setDepositsPage] = useState(1);
    const [bundlesPage, setBundlesPage] = useState(1);
    const [totalPurchasesPages, setTotalPurchasesPages] = useState(1);
    const [totalDepositsPages, setTotalDepositsPages] = useState(1);
    const [totalBundlesPages, setTotalBundlesPages] = useState(1);
    const [totalPurchases, setTotalPurchases] = useState(0);
    const itemsPerPage = 9;

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            fetchOrders(parsedUser.id, purchasesPage);
            fetchPayments(parsedUser.id, depositsPage);
            fetchBundleOrders(parsedUser.id, bundlesPage);
        } else {
            setLoading(false);
        }
    }, []);

    useEffect(() => { if (user) fetchOrders(user.id, purchasesPage); }, [purchasesPage]);
    useEffect(() => { if (user) fetchPayments(user.id, depositsPage); }, [depositsPage]);
    useEffect(() => { if (user) fetchBundleOrders(user.id, bundlesPage); }, [bundlesPage]);

    const fetchOrders = async (userId: string, page: number) => {
        try {
            const res = await fetch(`/api/orders/${userId}?page=${page}&limit=${itemsPerPage}`);
            const data = await res.json();
            setOrders(data.orders || []);
            if (data.pagination) {
                setTotalPurchasesPages(data.pagination.pages);
                setTotalPurchases(data.pagination.total);
            }
        } catch (e) { console.error(e); }
    };

    const fetchPayments = async (userId: string, page: number) => {
        try {
            const res = await fetch(`/api/payments/${userId}?page=${page}&limit=${itemsPerPage}`);
            const data = await res.json();
            setPayments(data.payments || []);
            if (data.pagination) setTotalDepositsPages(data.pagination.pages);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const fetchBundleOrders = async (userId: string, page: number) => {
        try {
            const res = await fetch(`/api/bundle-orders/${userId}?page=${page}&limit=${itemsPerPage}`);
            const data = await res.json();
            setBundleOrders(data.bundleOrders || []);
            if (data.pagination) setTotalBundlesPages(data.pagination.pages);
        } catch (e) { console.error(e); }
    };

    const formatDate = (date: Date | string) =>
        new Date(date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const formatCardNumber = (num: string | undefined) => {
        if (!num) return 'XXXX XXXX XXXX XXXX';
        const clean = num.replace(/\s+/g, '');
        const matches = clean.match(/.{1,4}/g);
        return matches ? matches.join(' ') : clean;
    };


    const renderPagination = (current: number, total: number, setter: React.Dispatch<React.SetStateAction<number>>) => total <= 1 ? null : (
        <div className="p-4 flex justify-center gap-2 mt-8">
            <button onClick={() => setter(Math.max(1, current - 1))} disabled={current === 1}
                className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded disabled:opacity-50 hover:text-white text-xs font-bold">PREV</button>
            <div className="flex items-center gap-2">
                {Array.from({ length: total }, (_, i) => i + 1)
                    .slice(Math.max(0, current - 3), Math.min(total, current + 2))
                    .map(n => (
                        <button key={n} onClick={() => setter(n)}
                            className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-colors ${current === n ? 'bg-(--accent) text-black' : 'bg-[#1a1a1a] text-gray-400 hover:text-white'}`}>{n}</button>
                    ))}
            </div>
            <button onClick={() => setter(Math.min(total, current + 1))} disabled={current === total}
                className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded disabled:opacity-50 hover:text-white text-xs font-bold">NEXT</button>
        </div>
    );


    if (loading && !user) {
        return <div className="flex items-center justify-center min-h-[400px]"><div className="cyber-spinner"></div></div>;
    }

    return (
        <div className="container mx-auto min-w-0">
            {/* Page header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black mb-2 text-white tracking-tight">TRANSACTION HISTORY</h2>
                    <p className="text-gray-400 text-sm font-medium">Manage your financial records and asset acquisitions.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-[#111] border border-[#333] px-4 py-2 rounded-lg" style={{ padding: '20px' }}>
                        <span className="text-xs text-gray-500 font-bold block">TOTAL SPENT</span>
                        <span className="text-(--accent) font-black text-lg">
                            ${(orders.reduce((s, o) => s + o.price, 0) + bundleOrders.reduce((s, b) => s + b.price, 0)).toLocaleString()}
                        </span>
                    </div>
                    <div className="bg-[#111] border border-[#333] px-4 py-2 rounded-lg" style={{ padding: '20px' }}>
                        <span className="text-xs text-gray-500 font-bold block">TOTAL ORDERS (THIS PAGE)</span>
                        <span className="text-white font-black text-lg">{orders.length + bundleOrders.length}</span>
                    </div>
                    <div className="bg-[#111] border border-[#333] px-4 py-2 rounded-lg" style={{ padding: '20px' }}>
                        <span className="text-xs text-gray-500 font-bold block">CARDS PURCHASED</span>
                        <span className="text-white font-black text-lg">{totalPurchases}</span>
                    </div>
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-[#333]">
                {(['purchases', 'bundles', 'deposits'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm font-bold tracking-wide transition-all relative ${activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                        {tab === 'purchases' ? `PURCHASES (${totalPurchases})` : tab === 'bundles' ? 'BUNDLES' : 'DEPOSITS'}
                        {activeTab === tab && <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-(--accent)" />}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* ── PURCHASES TAB ── */}
                {activeTab === 'purchases' && (
                    <motion.div key="purchases" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex flex-col gap-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {orders.length > 0 ? orders.map((order, index) => (
                                <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-[#0a0a0a] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col group hover:border-(--accent) transition-all duration-300">
                                    <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>
                                    <div className="h-1.5 w-full bg-(--accent) shadow-[0_0_15px_rgba(255,0,51,0.4)]"></div>

                                    <div className="p-6 flex-1 flex flex-col justify-between">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex-1">
                                                <h3 className="text-white font-black italic tracking-wider text-lg leading-tight truncate pr-4">{order.cardTitle}</h3>
                                                <p className="text-[10px] text-gray-500 font-mono mt-1">ID_SERIAL: {order.id.slice(-8).toUpperCase()}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-(--accent) font-black text-xl leading-none">${order.price}</div>
                                                <div className="text-[10px] text-gray-600 font-bold uppercase mt-1 tracking-widest whitespace-nowrap">USDT PAID</div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Simplified Card Details */}
                                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 relative overflow-hidden group-hover:bg-white/[0.07] transition-all duration-300">
                                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                                    <h3 className="text-2xl font-black italic tracking-tighter leading-none text-white">{order.type || 'VISA'}</h3>
                                                </div>
                                                <p className="text-[9px] text-gray-500 font-bold uppercase mb-3 tracking-[0.2em] flex items-center gap-2">
                                                    <span className="w-1 h-1 bg-(--accent) rounded-full"></span> PROTOCOL_INFO
                                                </p>
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-[8px] text-(--accent) font-bold uppercase mb-1">Card String</p>
                                                        <p className="text-base font-mono font-bold text-white tracking-[0.1em] drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] break-all">
                                                            {formatCardNumber(order.cardNumber.slice(0, 4) + ' XXXX XXXX ' + order.cardNumber.slice(-4))}
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-[8px] text-gray-500 font-bold uppercase mb-1">Expiry</p>
                                                            <p className="text-xs font-mono font-bold text-white bg-white/5 px-2 py-1 rounded inline-block">XX/XX</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] text-gray-500 font-bold uppercase mb-1">CVV / CVC</p>
                                                            <p className="text-xs font-mono font-bold text-(--accent) bg-(--accent)/5 px-2 py-1 rounded inline-block">XXX</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] text-gray-500 font-bold uppercase mb-1">Holder Identity</p>
                                                        <p className="text-xs font-mono font-bold text-white uppercase tracking-wider">ENCRYPTED_USER</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                                <p className="text-[8px] text-gray-400 font-bold uppercase mb-1.5 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 bg-(--accent) rounded-full animate-pulse"></span> SYSTEM_STATUS
                                                </p>
                                                <p className="text-[10px] text-gray-500 font-mono leading-relaxed">
                                                    Protocol data is currently secured. Full technical disclosure was provided exactly once during the initial acquisition phase.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-4 border-t border-white/5 flex flex-col gap-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-gray-600 font-mono italic">{new Date(order.purchaseDate).toLocaleDateString()}</span>
                                                <span className="text-green-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 rounded">
                                                    <CheckCircle size={10} /> PROTOCOL_SECURED
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="text-center py-20 text-gray-500 col-span-full">
                                    <p>No purchase history found.</p>
                                </div>
                            )}

                        </div>
                        {renderPagination(purchasesPage, totalPurchasesPages, setPurchasesPage)}
                    </motion.div>
                )}

                {/* ── BUNDLES TAB ── */}
                {activeTab === 'bundles' && (
                    <motion.div key="bundles" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex flex-col gap-8">
                        {bundleOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-800 rounded-xl bg-black/50">
                                <Package className="w-16 h-16 text-gray-700 mb-4" />
                                <p className="text-gray-500 font-mono text-sm tracking-widest">NO BUNDLE PURCHASES YET</p>
                                <p className="text-gray-700 text-xs font-mono mt-2">Visit the Offers page to purchase a bundle</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {bundleOrders.map((bo, index) => (
                                    <motion.div key={bo._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}
                                        className="group bg-[#0a0a0a] border border-gray-800 hover:border-(--accent) transition-all duration-300 rounded-xl overflow-hidden shadow-lg relative">
                                        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>
                                        {/* Top accent bar */}
                                        <div className="h-1 w-full bg-linear-to-r from-(--accent) to-purple-600 shadow-[0_0_10px_rgba(255,0,51,0.5)]"></div>

                                        <div className="p-6 relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-2.5 bg-(--accent)/10 border border-(--accent)/20 rounded-lg">
                                                    <Package className="w-5 h-5 text-(--accent)" />
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-900/10 border border-green-800/30 rounded text-[10px] font-black text-green-400">
                                                    <Percent className="w-3 h-3" />
                                                    {bo.discount}% OFF
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-black text-white italic tracking-wide mb-1 group-hover:text-(--accent) transition-colors">
                                                {bo.bundleTitle}
                                            </h3>
                                            <p className="text-xs text-gray-500 font-mono mb-4">{bo.cardCount} CARDS BUNDLE</p>

                                            <div className="space-y-2 border-t border-gray-900 pt-4">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-600 font-mono">Original Price</span>
                                                    <span className="text-gray-500 line-through font-mono">${bo.originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-400 font-bold uppercase tracking-wider">Paid</span>
                                                    <span className="text-white font-black text-base">${bo.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-gray-500 font-mono text-xs">USDT</span></span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-600 font-mono">You Saved</span>
                                                    <span className="text-green-400 font-bold font-mono">${(bo.originalPrice - bo.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="flex justify-between text-xs pt-2 border-t border-gray-900">
                                                    <span className="text-gray-600 font-mono">Purchased</span>
                                                    <span className="text-gray-400 font-mono">{formatDate(bo.purchaseDate)}</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center gap-2 p-2 bg-green-900/5 border border-green-800/20 rounded text-[10px] text-green-500 font-bold">
                                                <CheckCircle className="w-3.5 h-3.5 shrink-0" />

                                                BUNDLE ACTIVATED
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                        {renderPagination(bundlesPage, totalBundlesPages, setBundlesPage)}
                    </motion.div>
                )}

                {/* ── DEPOSITS TAB ── */}
                {activeTab === 'deposits' && (
                    <motion.div key="deposits" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex flex-col gap-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {payments.length > 0 ? payments.map((payment, index) => (
                                <motion.div key={payment._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                                    className="group relative bg-[#0a0a0a] border border-gray-800 hover:border-(--accent) transition-all duration-300 rounded-lg overflow-hidden h-[200px] flex flex-col shadow-lg">
                                    <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>
                                    <div className={`h-1 w-full ${payment.type === 'DEPOSIT' ? 'bg-blue-600 shadow-[0_0_10px_#2563eb]' : 'bg-purple-600 shadow-[0_0_10px_#9333ea]'}`}></div>
                                    <div className="p-6 flex flex-col h-full justify-between relative z-10" style={{ padding: '24px' }}>
                                        <div className="flex justify-between items-start">
                                            <div className={`px-2 py-1 rounded text-[10px] font-black tracking-widest border ${payment.type === 'DEPOSIT' ? 'bg-blue-900/20 text-blue-500 border-blue-500/30' : 'bg-purple-900/20 text-purple-500 border-purple-500/30'}`}>
                                                {payment.type}
                                            </div>
                                            <div className={`flex items-center gap-1.5 text-xs font-bold ${payment.status === 'APPROVED' ? 'text-green-500' : 'text-yellow-500'}`}>
                                                {payment.status === 'APPROVED' ? <span className="animate-pulse">●</span> : '○'} {payment.status}
                                            </div>
                                        </div>
                                        <div className="text-center my-1">
                                            <span className="text-3xl md:text-4xl font-black text-white tracking-tight group-hover:text-(--accent) transition-colors">
                                                ${payment.amount.toLocaleString()}
                                            </span>
                                            <div className="text-[10px] text-gray-500 font-mono tracking-widest mt-1 uppercase">USDT (TRC20)</div>
                                        </div>
                                        <div className="border-t border-dashed border-gray-800 pt-3 mt-auto">
                                            <div className="flex justify-between items-end">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">TX HASH</span>
                                                    <span className="text-[10px] font-mono text-gray-300 bg-gray-900/50 px-1.5 py-0.5 rounded border border-gray-800" title={payment.trxId}>
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
                                </motion.div>
                            )) : (
                                <div className="text-center py-20 text-gray-500 col-span-full"><p>No deposit history found.</p></div>
                            )}
                        </div>
                        {renderPagination(depositsPage, totalDepositsPages, setDepositsPage)}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
