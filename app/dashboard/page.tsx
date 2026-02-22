'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { CreditCard } from 'lucide-react';
import type { Card, User } from '../../types';
import { useDashboard } from './DashboardContext';

export default function Dashboard() {
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 9;

    const { openDepositModal, showNotification, refreshUser } = useDashboard();
    const router = useRouter();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        fetchCards(currentPage);
    }, [currentPage]);

    const fetchCards = async (page: number) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/cards?page=${page}&limit=${itemsPerPage}`);
            const data = await response.json();
            setCards(data.cards || []);
            if (data.pagination) {
                setTotalPages(data.pagination.pages);
            }
        } catch (error) {
            console.error('Failed to fetch cards:', error);
        } finally {
            setLoading(false);
        }
    };

    const [showReceipt, setShowReceipt] = useState<any | null>(null);

    const handlePurchase = async (cardId: string) => {
        if (!user) return;

        setPurchasing(cardId);

        try {
            const response = await fetch('/api/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    cardId
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Success
                if (data.newBalance !== undefined) {
                    const updatedUser = { ...user, balance: data.newBalance };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    setUser(updatedUser);
                    refreshUser(); // Update Layout balance
                }

                // Show Receipt Popup instead of redirecting
                setShowReceipt(data.order);
                showNotification('Purchase successful!', 'success');

                // Refresh cards to remove the purchased one
                fetchCards(currentPage);

            } else {
                showNotification(`Purchase failed: ${data.error || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            showNotification('Transaction failed. Check connection.', 'error');
        } finally {
            setPurchasing(null);
        }
    };

    // Helper to mask sensitive strings except last few chars
    const maskStart = (str: string | undefined, visibleCount: number = 3) => {
        if (!str) return 'N/A';
        if (str.length <= visibleCount) return str;
        const visible = str.slice(0, visibleCount);
        return `${visible}****`;
    };

    // Card number: show last 4
    const formatCardNumber = (num: string) => {
        if (!num) return 'XXXX XXXX XXXX XXXX';
        const clean = num.replace(/\s+/g, '');
        // Split into blocks of 4 for standard CC format
        const matches = clean.match(/.{1,4}/g);
        return matches ? matches.join(' ') : clean;
    };


    if (loading && cards.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="cyber-spinner"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Receipt Popup */}
            <AnimatePresence>
                {showReceipt && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-[#0a0a0a] border border-(--accent) w-full max-w-lg rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(255,0,51,0.3)] relative"
                        >
                            {/* Receipt Header */}
                            <div className="bg-(--accent) p-8 text-black text-center relative overflow-hidden">
                                {/* Decorative background elements for header */}
                                <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                                <div className="absolute bottom-0 right-0 w-32 h-32 bg-black/5 rounded-full translate-x-1/3 translate-y-1/3 blur-xl"></div>

                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-4 shadow-2xl border border-white/20">
                                        <CreditCard className="w-10 h-10 text-(--accent)" />
                                    </div>
                                    <h2 className="text-[10px] font-black tracking-[0.5em] mb-1 opacity-70">WARZONE_ELITE_ASSETS</h2>
                                    <h3 className="text-3xl font-black italic tracking-widest leading-none drop-shadow-md">OFFICIAL RECEIPT</h3>
                                    <div className="mt-3 flex items-center gap-2">
                                        <span className="h-[1px] w-8 bg-black/30"></span>
                                        <p className="text-[10px] font-bold opacity-60 tracking-[0.2em] font-mono whitespace-nowrap">
                                            SECURE_TRANS_ID: {showReceipt.id.slice(-12).toUpperCase()}
                                        </p>
                                        <span className="h-[1px] w-8 bg-black/30"></span>
                                    </div>
                                </div>

                                {/* Zigzag bottom edge */}
                                <div className="absolute -bottom-3 left-0 right-0 flex justify-center gap-1">
                                    {Array.from({ length: 25 }).map((_, i) => (
                                        <div key={i} className="w-2.5 h-2.5 bg-[#0a0a0a] rotate-45"></div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-8 pt-10">
                                {/* Timestamp */}
                                <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                                    <span className="text-gray-500 text-[10px] font-bold tracking-widest uppercase">Issued At</span>
                                    <span className="text-white font-mono text-xs">{new Date().toLocaleString()}</span>
                                </div>

                                {/* Asset Details Section */}
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-(--accent) text-[10px] font-black tracking-widest uppercase mb-1">Asset Category</h4>
                                            <p className="text-white font-bold italic">{showReceipt.cardTitle}</p>
                                        </div>
                                        <div className="text-right">
                                            <h4 className="text-(--accent) text-[10px] font-black tracking-widest uppercase mb-1">Price Paid</h4>
                                            <p className="text-white font-black text-xl">${showReceipt.price} USDT</p>
                                        </div>
                                    </div>

                                    {/* Data Grid */}
                                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-inner">
                                        <div className="absolute top-0 right-0 p-6 opacity-10">
                                            <h3 className="text-5xl font-black italic tracking-tighter leading-none text-white">{showReceipt.type || 'VISA'}</h3>
                                        </div>

                                        <div className="space-y-6 relative z-10">
                                            <div>
                                                <p className="text-[9px] text-gray-500 font-bold uppercase mb-2 tracking-widest flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-(--accent) rounded-full"></span>
                                                    DECRYPTED_ASSET_DATA
                                                </p>
                                                <p className="text-xl font-mono font-bold text-white tracking-[0.2em] break-all leading-tight bg-black/40 p-4 rounded-xl border border-white/5 shadow-2xl">
                                                    {formatCardNumber(showReceipt.cardNumber)}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                                    <p className="text-[8px] text-gray-500 font-bold uppercase mb-1">Expiration</p>
                                                    <p className="text-lg font-mono font-bold text-white tracking-widest">{showReceipt.expiry || 'XX/XX'}</p>
                                                </div>
                                                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                                    <p className="text-[8px] text-gray-500 font-bold uppercase mb-1">CVC/CVV</p>
                                                    <p className="text-lg font-mono font-bold text-(--accent) tracking-widest">{showReceipt.cvv || 'XXX'}</p>
                                                </div>
                                            </div>

                                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                                <p className="text-[8px] text-gray-500 font-bold uppercase mb-1">Asset Holder / Full Name</p>
                                                <p className="text-base font-bold text-white tracking-wide uppercase italic">{showReceipt.holder || 'N/A'}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                                    <p className="text-[8px] text-gray-500 font-bold uppercase mb-1">SSN</p>
                                                    <p className="text-sm font-mono font-bold text-white">{showReceipt.ssn || 'N/A'}</p>
                                                </div>
                                                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                                    <p className="text-[8px] text-gray-500 font-bold uppercase mb-1">Date of Birth</p>
                                                    <p className="text-sm font-mono font-bold text-white">{showReceipt.dob || 'N/A'}</p>
                                                </div>
                                            </div>

                                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                                <p className="text-[8px] text-gray-500 font-bold uppercase mb-2">Billing Infrastructure</p>
                                                <div className="text-xs font-mono text-white leading-relaxed space-y-1">
                                                    {showReceipt.address && <p>{showReceipt.address}</p>}
                                                    <p>{showReceipt.city}{showReceipt.state ? `, ${showReceipt.state}` : ''} {showReceipt.zip}</p>
                                                    <p className="text-(--accent) font-black uppercase tracking-[0.2em] pt-1">{showReceipt.country}</p>
                                                </div>
                                            </div>

                                            {(showReceipt.email || showReceipt.phone || showReceipt.bank) && (
                                                <div className="pt-4 border-t border-white/5 space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {showReceipt.email && (
                                                            <div>
                                                                <p className="text-[8px] text-gray-500 font-bold uppercase mb-1">Protocol Email</p>
                                                                <p className="text-[10px] font-mono text-white break-all">{showReceipt.email}</p>
                                                            </div>
                                                        )}
                                                        {showReceipt.phone && (
                                                            <div>
                                                                <p className="text-[8px] text-gray-500 font-bold uppercase mb-1">Mobile Contact</p>
                                                                <p className="text-[10px] font-mono text-white">{showReceipt.phone}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {showReceipt.bank && (
                                                        <div>
                                                            <p className="text-[8px] text-gray-500 font-bold uppercase mb-1">Banking Institution</p>
                                                            <p className="text-xs font-black text-white tracking-widest uppercase">{showReceipt.bank}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Scanline Effect */}
                                        <div className="absolute inset-0 pointer-events-none bg-scanline opacity-10"></div>
                                    </div>
                                </div>

                                <div className="mt-10 flex flex-col gap-3">
                                    <button
                                        onClick={() => setShowReceipt(null)}
                                        className="w-full py-4 bg-(--accent) text-black font-black text-sm rounded-lg hover:bg-white transition-all uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(255,0,51,0.4)] active:scale-95"
                                    >
                                        CLOSE PROTOCOL
                                    </button>
                                    <p className="text-[9px] text-gray-600 text-center font-bold tracking-widest uppercase mt-2 italic">
                                        Attention: All sensitive data is now your responsibility.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Wallet Stats Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6"
            >
                {/* Balance Card */}
                <div className="bg-[#0a0a0a] border border-(--accent) p-8 rounded-lg relative overflow-hidden group hover:shadow-[0_0_30px_rgba(255,0,51,0.15)] transition-all duration-300" style={{ padding: '32px' }}>
                    <div className="absolute inset-0 bg-(--accent)/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <h3 className="text-gray-400 text-sm font-bold tracking-widest mb-3">AVAILABLE BALANCE</h3>
                            <div className="flex items-end gap-3">
                                <span className="text-5xl font-black text-white text-glow tracking-tight">
                                    ${(user?.balance || 0).toFixed(2)}
                                </span>
                                <span className="text-(--accent) font-bold mb-2">USDT</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-2 relative z-10">
                        <div className="h-1.5 flex-1 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-(--accent) shadow-[0_0_10px_var(--accent)]"
                                style={{ width: `${Math.min((user?.balance || 0) / 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats or Promo */}
                <div className="bg-[#0a0a0a] border border-gray-800 p-8 rounded-lg relative overflow-hidden flex flex-col justify-center hover:border-(--accent) transition-colors duration-300" style={{ padding: '32px' }}>
                    <h3 className="text-(--accent) text-sm font-bold tracking-widest mb-3">STATUS: ENCRYPTED</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                        Secure channel established. All transactions are anonymized and encrypted end-to-end.
                        <br />
                        <span className="text-white font-bold mt-2 block tracking-wide">System Operational - 100% Uptime</span>
                    </p>
                </div>
            </motion.div>

            {/* Page header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 text-center"
            >
                <h2 className="text-4xl md:text-6xl font-black mb-4 text-glow glitch text-white" data-text="BLACK MARKET">
                    BLACK MARKET
                </h2>
                <p className="terminal-text text-sm md:text-base text-(--accent) font-bold tracking-widest">
                    {'>'} ACCESSING ENCRYPTED DATABASE...
                </p>
            </motion.div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cards.map((card, index) => (
                    <motion.div
                        key={card.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ padding: "0" }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative perspective-[1000px] h-[240px] p-[12px]"
                    >
                        {/* 3D Card Container */}
                        <div className="relative w-full h-full transition-all duration-700 transform-style-3d group-hover:rotate-y-180">

                            {/* FRONT SIDE (Blue Card) */}
                            <div className="absolute inset-0 backface-hidden">
                                <div className="relative w-full h-full bg-[#111] rounded-2xl shadow-xl overflow-hidden text-white p-6 border border-gray-800 group-hover:border-(--accent) transition-colors duration-300 flex flex-col justify-between">

                                    {/* Background texture */}
                                    <div className="absolute inset-0 opacity-20 bg-grid pointer-events-none"></div>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-(--accent)/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                                    {/* Top Row: Chip and Price */}
                                    <div className="relative z-10 flex justify-between items-start" style={{ padding: "10px" }}>
                                        <div className="w-12 h-9 bg-yellow-400 rounded-md shadow-sm border border-yellow-500/50 relative overflow-hidden flex items-center justify-center">
                                            <div className="grid grid-cols-2 gap-1 w-full h-full p-[2px] opacity-50">
                                                <div className="border border-black/20 rounded-sm"></div>
                                                <div className="border border-black/20 rounded-sm"></div>
                                                <div className="border border-black/20 rounded-sm"></div>
                                                <div className="border border-black/20 rounded-sm"></div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            <div className="bg-(--accent)/20 border border-(--accent)/50 px-3 py-1 rounded-full text-xs font-black shadow-[0_0_15px_rgba(255,0,51,0.3)] text-(--accent)">
                                                {card.price} USDT
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Number */}
                                    <div className="mt-2" style={{ padding: "10px" }}>
                                        <p className="text-xs font-bold text-gray-500 mb-1 tracking-widest uppercase">{card.bank || 'DIGITAL ASSET'}</p>
                                        <p className="text-xl md:text-2xl font-mono font-bold tracking-widest drop-shadow-md whitespace-nowrap">
                                            {formatCardNumber(card.cardNumber)}
                                        </p>

                                    </div>

                                    {/* Bottom Info */}
                                    <div className="flex justify-between items-end mt-2 px-3" style={{ padding: "12px" }}>
                                        <div>
                                            <p className="text-[9px] uppercase opacity-75 font-bold mb-0.5">Proxy Status</p>
                                            <p className="font-mono font-bold text-xs ml-0 tracking-wide uppercase text-(--accent)">
                                                {card.proxy ? 'ENCRYPTED' : 'NOT SET'}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <p className="text-[9px] uppercase opacity-75 font-bold mb-0.5">Expires</p>
                                            <div className="flex items-center gap-2">
                                                <p className="font-mono font-bold text-xs tracking-wide">{card.expiry || 'XX/XX'}</p>
                                                <h3 className="text-xl font-black italic tracking-tighter leading-none uppercase">{card.type || 'VISA'}</h3>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shine overlay */}
                                    <div className="absolute inset-0 bg-linear-to-br from-white/20 via-transparent to-transparent pointer-events-none rounded-2xl mix-blend-overlay"></div>
                                </div>
                            </div>

                            {/* BACK SIDE (Dark Card) */}
                            <div className="absolute inset-0 backface-hidden rotate-y-180">
                                <div className="relative w-full h-full bg-[#1a1a1a] rounded-2xl shadow-xl overflow-hidden border border-gray-800 flex flex-col">

                                    {/* Magnetic Strip */}
                                    <div className="w-full h-10 bg-black mt-5"></div>

                                    {/* CVC Section */}
                                    <div className="px-6 mt-3 flex items-center justify-between">
                                        <div className="w-3/4 relative">
                                            <div className="bg-white h-8 w-full flex items-center justify-end px-3">
                                                <span className="font-mono font-bold text-black tracking-widest">XXX</span>
                                            </div>
                                            <span className="absolute -top-3 right-0 text-[8px] text-gray-400 font-bold">CVC</span>
                                        </div>
                                    </div>

                                    {/* Bottom Logo & Action */}
                                    <div className="flex-1 flex items-end justify-between px-6 pb-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-[8px] text-gray-500">Authorized Signature</div>
                                            <div className="h-0.5 w-32 bg-white/20"></div>
                                        </div>
                                        <div className="text-right">
                                            <h3 className="text-xl font-black italic text-white tracking-tighter mb-2 opacity-80 uppercase">{card.type || 'VISA'}</h3>

                                        </div>
                                    </div>

                                    {/* Purchase Button Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-[2px] z-10">
                                        <button
                                            onClick={() => handlePurchase(card.id)}
                                            disabled={purchasing === card.id}
                                            className="px-6 py-2 bg-(--accent) text-black text-xs font-black rounded hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_var(--accent)] uppercase tracking-widest"
                                        >
                                            {purchasing === card.id ? (
                                                <span className="animate-pulse">PROCESSING...</span>
                                            ) : (
                                                <span>PURCHASE NOW</span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="p-4 flex justify-center gap-2 mt-8">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded disabled:opacity-50 hover:text-white transition-colors text-xs font-bold"
                    >
                        PREV
                    </button>
                    <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
                            .map(pageNum => (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-colors ${currentPage === pageNum
                                        ? 'bg-(--accent) text-black'
                                        : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            ))}
                    </div>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded disabled:opacity-50 hover:text-white transition-colors text-xs font-bold"
                    >
                        NEXT
                    </button>
                </div>
            )}

            {/* Empty state */}
            {cards.length === 0 && !loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 border border-dashed border-gray-800 rounded-lg mt-8 bg-black/50"
                >
                    <p className="text-gray-400 text-lg">
                        DATABASE EMPTY / NO ASSETS FOUND
                    </p>
                </motion.div>
            )}
        </div>
    );
}
