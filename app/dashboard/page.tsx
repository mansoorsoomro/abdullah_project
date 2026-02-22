'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Card, User, Order } from '../../types';
import { useDashboard } from './DashboardContext';

export default function Dashboard() {
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [showReceipt, setShowReceipt] = useState<Order | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 9;

    const { showNotification, refreshUser } = useDashboard();
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

                // Show Receipt instead of immediate redirect
                setShowReceipt(data.order);
                showNotification('✓ Purchase successful! Receipt generated.', 'success');

            } else {
                showNotification(`Purchase failed: ${data.error || 'Unknown error'}`, 'error');
            }
        } catch {
            showNotification('Transaction failed. Check connection.', 'error');
        } finally {
            setPurchasing(null);
        }
    };

    // Helper to mask sensitive strings except last few chars

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
        <div className="min-h-screen bg-black text-white p-4 md:p-8">
            {/* Wallet Stats Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6"
            >
                {/* Balance Card */}
                <div className="bg-[#0a0a0a] border border-red-600/30 p-8 rounded-lg relative overflow-hidden group hover:shadow-[0_0_30px_rgba(255,0,51,0.15)] transition-all duration-300">
                    <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <h3 className="text-gray-400 text-sm font-bold tracking-widest mb-3 uppercase">Available Balance</h3>
                            <div className="flex items-end gap-3">
                                <span className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(220,38,38,0.3)] tracking-tight">
                                    ${(user?.balance || 0).toFixed(2)}
                                </span>
                                <span className="text-red-600 font-bold mb-2">USDT</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-2 relative z-10">
                        <div className="h-1.5 flex-1 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                                style={{ width: `${Math.min((user?.balance || 0) / 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats or Promo */}
                <div className="bg-[#0a0a0a] border border-gray-800 p-8 rounded-lg relative overflow-hidden flex flex-col justify-center hover:border-red-600/50 transition-colors duration-300">
                    <h3 className="text-red-600 text-sm font-bold tracking-widest mb-3 uppercase">Status: Encrypted</h3>
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
                <h2 className="text-4xl md:text-6xl font-black mb-4 text-glow glitch text-white uppercase italic tracking-tighter" data-text="BLACK MARKET">
                    Black Market
                </h2>
                <p className="terminal-text text-sm md:text-base text-red-600 font-bold tracking-widest">
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
                        transition={{ delay: index * 0.1 }}
                        className="group relative perspective-[1000px] h-[240px]"
                    >
                        {/* 3D Card Container */}
                        <div className="relative w-full h-full transition-all duration-700 transform-style-3d group-hover:rotate-y-180">

                            {/* FRONT SIDE */}
                            <div className="absolute inset-0 backface-hidden">
                                <div className="relative w-full h-full bg-[#111] rounded-2xl shadow-xl overflow-hidden text-white p-6 border border-gray-800 group-hover:border-red-600/50 transition-colors duration-300 flex flex-col justify-between">
                                    <div className="absolute inset-0 opacity-20 bg-grid pointer-events-none"></div>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                                    <div className="relative z-10 flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black tracking-[0.2em] text-red-600 uppercase opacity-80 mb-2">{card.title || 'PREMIUM ASSET'}</span>
                                            <div className="w-12 h-9 bg-yellow-400 rounded-md shadow-sm border border-yellow-500/50 relative overflow-hidden flex items-center justify-center">
                                                <div className="grid grid-cols-2 gap-1 w-full h-full p-[2px] opacity-50">
                                                    <div className="border border-black/20 rounded-sm"></div>
                                                    <div className="border border-black/20 rounded-sm"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-red-600/20 border border-red-600/50 px-3 py-1 rounded-full text-xs font-black text-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                                            {card.price} USDT
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-bold text-gray-500 mb-1 tracking-widest uppercase">{card.bank || 'Digital Asset'}</p>
                                        <p className="text-xl md:text-2xl font-mono font-bold tracking-widest drop-shadow-md">
                                            {formatCardNumber(card.cardNumber)}
                                        </p>
                                    </div>

                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[9px] uppercase opacity-75 font-bold mb-0.5">Proxy</p>
                                            <p className="font-mono font-bold text-xs tracking-wide uppercase text-red-600">
                                                {card.proxy ? 'Active' : 'Not Set'}
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
                                </div>
                            </div>

                            {/* BACK SIDE */}
                            <div className="absolute inset-0 backface-hidden rotate-y-180">
                                <div className="relative w-full h-full bg-[#1a1a1a] rounded-2xl shadow-xl overflow-hidden border border-gray-800 flex flex-col items-center justify-center">
                                    <div className="w-full h-10 bg-black absolute top-5"></div>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-[2px] z-10">
                                        <button
                                            onClick={() => handlePurchase(card.id)}
                                            disabled={purchasing === card.id}
                                            className="px-6 py-2 bg-red-600 text-black text-xs font-black rounded hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)] uppercase tracking-widest"
                                        >
                                            {purchasing === card.id ? 'Processing...' : 'Purchase Now'}
                                        </button>
                                    </div>
                                    <div className="px-6 w-full flex flex-col gap-2 mt-8">
                                        <div className="text-[8px] text-gray-500 uppercase font-black">Authorized Signature</div>
                                        <div className="h-8 w-full bg-white flex items-center justify-end px-3">
                                            <span className="font-mono font-bold text-black text-sm tracking-widest">XXX</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Pagination */}
            {
                totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-12 pb-8">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-[#0a0a0a] text-gray-400 rounded-lg disabled:opacity-50 hover:text-white transition-colors text-xs font-bold border border-gray-800"
                        >
                            PREV
                        </button>
                        <div className="flex items-center gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all border ${currentPage === pageNum
                                        ? 'bg-red-600 text-black border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                                        : 'bg-[#0a0a0a] text-gray-400 border-gray-800 hover:border-red-600/50'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-[#0a0a0a] text-gray-400 rounded-lg disabled:opacity-50 hover:text-white transition-colors text-xs font-bold border border-gray-800"
                        >
                            NEXT
                        </button>
                    </div>
                )
            }

            {/* Empty State */}
            {
                cards.length === 0 && !loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-24 border border-dashed border-gray-800 rounded-2xl mt-8 bg-[#050505] shadow-inner"
                    >
                        <p className="text-gray-500 text-xl font-black uppercase tracking-[0.3em] opacity-40">
                            Database Empty / No Assets Found
                        </p>
                    </motion.div>
                )
            }

            {/* Receipt Popup */}
            <AnimatePresence>
                {showReceipt && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-[#050505] text-white w-full max-w-lg border border-red-600/30 rounded-2xl shadow-[0_0_80px_rgba(220,38,38,0.25)] overflow-hidden flex flex-col my-10 relative group"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-red-600 to-transparent"></div>
                            <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>

                            {/* Header */}
                            <div className="p-8 border-b border-white/10 text-center relative overflow-hidden">
                                <div className="absolute top-4 right-6 text-[9px] font-mono text-gray-500 tracking-tighter uppercase opacity-50">
                                    REF: {Math.random().toString(36).substring(2, 10).toUpperCase()} {/* {new Date(showReceipt?.purchaseDate || Date.now()).toLocaleString()} */}
                                </div>
                                <div className="mb-6 flex justify-center scale-110 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                                    <Image src="/logo_header.PNG" alt="WARZONE" width={120} height={40} className="h-10 object-contain" />
                                </div>
                                <h2 className="text-3xl font-black tracking-tighter uppercase italic text-red-600 drop-shadow-sm">Asset Secured</h2>
                                <div className="flex items-center justify-center gap-2 mt-2">
                                    <span className="h-px w-8 bg-red-600/30"></span>
                                    <p className="text-[10px] text-gray-400 font-bold tracking-[0.3em] uppercase">Digital Purchase Receipt</p>
                                    <span className="h-px w-8 bg-red-600/30"></span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 space-y-6 flex-1 font-mono relative">
                                <div className="flex justify-between items-end border-b border-white/10 pb-3">
                                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Target Asset</span>
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-black text-red-500 whitespace-nowrap overflow-hidden text-ellipsis ml-4">{showReceipt?.cardTitle}</span>
                                        <span className="text-[7px] text-red-600/50 font-black tracking-[0.4em] uppercase">Premium Black Edition</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 text-xs">
                                    <div className="bg-white/2 p-6 rounded-2xl border border-white/10 relative group-hover:border-red-600/40 transition-all shadow-inner">
                                        <p className="text-[9px] text-red-500 uppercase font-black mb-4 tracking-widest flex items-center gap-2">
                                            <span className="h-1 w-1 bg-red-600 rounded-full animate-ping"></span>
                                            Primary Protocol Data
                                        </p>
                                        <p className="text-3xl font-black tracking-[0.25em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.15)] mb-6">
                                            {showReceipt?.cardNumber}
                                        </p>
                                        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/5">
                                            <div>
                                                <p className="text-[8px] text-gray-600 uppercase font-black mb-1">Expiry</p>
                                                <p className="text-sm font-black text-white">{showReceipt?.expiry || '??/??'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] text-gray-600 uppercase font-black mb-1">Security</p>
                                                <p className="text-sm font-black text-red-600 animate-pulse">{showReceipt?.cvv || '***'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] text-gray-600 uppercase font-black mb-1">Protocol</p>
                                                <p className="text-sm font-black text-white uppercase">{showReceipt?.type || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white/3 p-5 rounded-2xl border border-white/10 hover:border-red-600/30 transition-colors">
                                            <p className="text-[9px] text-red-500 uppercase font-black mb-4 tracking-widest">Geolocation</p>
                                            <div className="space-y-1 text-[11px] leading-relaxed text-gray-400 font-bold">
                                                <p className="text-white text-xs">{showReceipt?.address || 'N/A'}</p>
                                                <p>{showReceipt?.city}{showReceipt?.city && showReceipt?.state ? ', ' : ''}{showReceipt?.state} {showReceipt?.zip}</p>
                                                <p className="text-red-600/80 mt-2 block tracking-widest uppercase text-[9px]">{showReceipt?.country || 'GLOBAL'}</p>
                                            </div>
                                        </div>
                                        <div className="bg-white/3 p-5 rounded-2xl border border-white/10 hover:border-red-600/30 transition-colors">
                                            <p className="text-[9px] text-red-500 uppercase font-black mb-4 tracking-widest">Access Nodes</p>
                                            <div className="space-y-4">
                                                {showReceipt?.email && (
                                                    <div>
                                                        <p className="text-[8px] text-gray-700 uppercase font-black mb-1">E-Mail Access</p>
                                                        <p className="text-xs text-gray-300 truncate font-sans">{showReceipt.email}</p>
                                                    </div>
                                                )}
                                                {showReceipt?.password && (
                                                    <div>
                                                        <p className="text-[8px] text-gray-700 uppercase font-black mb-1">Registry Key</p>
                                                        <p className="text-xs text-red-500/80 truncate font-mono tracking-tighter">{showReceipt.password}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/2 p-5 rounded-2xl border border-white/5 grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-[9px] text-red-500 uppercase font-black tracking-widest mb-3">Identity</p>
                                            <p className="text-[8px] text-gray-600 uppercase font-black mb-1">SSN Node</p>
                                            <p className="text-xs text-white/90 mb-3">{showReceipt?.ssn || '---'}</p>
                                            <p className="text-[8px] text-gray-600 uppercase font-black mb-1">Birth Date</p>
                                            <p className="text-xs text-white/90">{showReceipt?.dob || '---'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-red-500 uppercase font-black tracking-widest mb-3">Network</p>
                                            <p className="text-[8px] text-gray-600 uppercase font-black mb-1">Source IP</p>
                                            <p className="text-xs text-blue-400 font-mono tracking-tighter mb-3">{showReceipt?.ip || '0.0.0.0'}</p>
                                            <p className="text-[8px] text-gray-600 uppercase font-black mb-1">Contact Dial</p>
                                            <p className="text-xs text-white/90">{showReceipt?.phone || '---'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-white/10 flex justify-between items-center bg-linear-to-b from-transparent to-white/1 -mx-8 px-8 pb-4">
                                    <div className="space-y-1">
                                        <span className="text-2xl font-black uppercase italic text-gray-700 tracking-tighter block leading-none">TOTAL SETTLEMENT</span>
                                        <span className="text-[8px] text-gray-500 font-black tracking-[0.5em] uppercase">Status: Confirmed</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-3">
                                            <span className="text-4xl font-black text-white italic tracking-tighter drop-shadow-[0_0_20px_rgba(220,38,38,0.3)]">${showReceipt?.price}</span>
                                            <div className="flex flex-col items-start leading-none">
                                                <span className="bg-red-600 text-black px-1.5 py-0.5 text-[9px] font-black rounded-sm tracking-widest uppercase mb-1">USDT</span>
                                                <span className="text-[7px] text-gray-600 font-bold uppercase">TRC-20</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-8 bg-[#0a0a0a] border-t border-white/5">
                                <button
                                    onClick={() => {
                                        setShowReceipt(null);
                                        router.push('/dashboard/orders');
                                    }}
                                    className="relative w-full py-6 bg-red-600 text-black font-black text-base uppercase tracking-[0.5em] hover:bg-white transition-all shadow-[0_0_50px_rgba(220,38,38,0.3)] active:scale-95 group/btn overflow-hidden rounded-xl"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-4">
                                        CLOSE TERMINAL
                                        <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </span>
                                    <div className="absolute inset-0 bg-white -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500"></div>
                                </button>
                                <div className="flex justify-between items-center mt-8 px-2">
                                    <p className="text-[8px] text-gray-800 font-mono tracking-widest uppercase">Encryption: AES-256-CBC</p>
                                    <p className="text-[8px] text-gray-800 font-mono tracking-widest uppercase">Region: Warzone-1</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
