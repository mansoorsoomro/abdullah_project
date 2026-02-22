'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Payment, Card, Order } from '../../../types';
import AdminGridBackground from '../../theme/AdminGridBackground';

export default function AdminDashboard() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState<string | null>(null);
    const [showAddCard, setShowAddCard] = useState(false);
    const [activeTab, setActiveTab] = useState<'payments' | 'cards' | 'orders'>('payments');
    const [orders, setOrders] = useState<Order[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 40;

    // Pagination for Payments Tab
    const [alertsPage, setAlertsPage] = useState(1);
    const alertsPerPage = 10;
    const [paymentsPage, setPaymentsPage] = useState(1);
    const paymentsPerPage = 40;

    // Notification State
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const router = useRouter();

    // Edit Order State
    const [editingOrder, setEditingOrder] = useState<any | null>(null);
    const [editOrderForm, setEditOrderForm] = useState<any>({});

    // Form state for new card
    const [newCard, setNewCard] = useState({
        title: '',
        price: '',
        description: '',
        cardNumber: '',
        cvv: '',
        expiry: '',
        holder: '',
        address: '',
        bank: '',
        type: '',
        zip: '',
        city: '',
        state: '',
        country: '',
        ssn: '',
        dob: '',
        email: '',
        phone: '',
        userAgent: '',
        password: '',
        ip: '',
        videoLink: ''
    });

    useEffect(() => {
        const adminAuth = localStorage.getItem('adminAuth');
        if (!adminAuth) {
            router.push('/admin');
            return;
        }
        fetchPayments();
        fetchCards();
        fetchOrders();
    }, [router]);

    const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchPayments = async () => {
        try {
            const response = await fetch('/api/admin/payments');
            const data = await response.json();
            setPayments(data.payments);
        } catch (error) {
            console.error('Failed to fetch payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCards = async () => {
        try {
            const response = await fetch('/api/cards');
            const data = await response.json();
            setCards(data.cards || []);
        } catch (error) {
            console.error('Failed to fetch cards:', error);
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/admin/orders');
            const data = await response.json();
            setOrders(data.orders || []);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        }
    };

    const handleApprove = async (trxId: string) => {
        setApproving(trxId);
        try {
            const response = await fetch('/api/admin/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trxId }),
            });

            const data = await response.json();

            if (response.ok) {
                fetchPayments();
                showNotification('✓ User approved successfully!', 'success');
            } else {
                showNotification(`Error: ${data.error}`, 'error');
            }
        } catch (error) {
            showNotification('Approval failed. Check backend connection.', 'error');
        } finally {
            setApproving(null);
        }
    };

    // Delete Confirmation State
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const confirmReject = async () => {
        if (!deletingId) return;

        try {
            const responseDelete = await fetch('/api/admin/approve', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trxId: deletingId }),
            });

            if (responseDelete.ok) {
                fetchPayments();
                showNotification('✓ Payment rejected/deleted.', 'success');
            } else {
                showNotification('Failed to reject payment', 'error');
            }
        } catch (error) {
            showNotification('Rejection failed.', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const handleAddCard = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/admin/cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newCard,
                    price: parseFloat(newCard.price),
                    forSale: true
                }),
            });

            if (response.ok) {
                showNotification('✓ Card added successfully!', 'success');
                setShowAddCard(false);
                setNewCard({
                    title: '', price: '', description: '', cardNumber: '', cvv: '', expiry: '',
                    holder: '', address: '', bank: '', type: '', zip: '', city: '', state: '',
                    country: '', ssn: '', dob: '', email: '', phone: '', userAgent: '',
                    password: '', ip: '', videoLink: ''
                });
                fetchCards();
            } else {
                const data = await response.json();
                showNotification(`Error: ${data.error}`, 'error');
            }
        } catch (error) {
            showNotification('Failed to add card. Check backend connection.', 'error');
        }
    };

    const handleDeleteCard = async (cardId: string) => {
        if (!confirm('Are you sure you want to delete this card?')) return;

        try {
            const response = await fetch(`/api/admin/cards/${cardId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                showNotification('✓ Card deleted successfully!', 'success');
                fetchCards();
            } else {
                showNotification('Failed to delete card', 'error');
            }
        } catch (error) {
            showNotification('Failed to delete card. Check backend connection.', 'error');
        }
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (!confirm('Are you sure you want to delete this order?')) return;

        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                showNotification('✓ Order deleted successfully!', 'success');
                fetchOrders();
            } else {
                showNotification('Failed to delete order', 'error');
            }
        } catch (error) {
            showNotification('Failed to delete order. Check backend connection.', 'error');
        }
    };

    const handleUpdateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editOrderForm) return;

        try {
            const response = await fetch(`/api/admin/orders/${editOrderForm._id || editOrderForm.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editOrderForm),
            });

            if (response.ok) {
                showNotification('✓ Order updated successfully!', 'success');
                setEditingOrder(null);
                fetchOrders();
            } else {
                showNotification('Failed to update order', 'error');
            }
        } catch (error) {
            showNotification('Failed to update order', 'error');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminAuth');
        router.push('/admin');
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleString('en-US', {
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
    const formatCardNumber = (num: string) => {
        if (!num) return '**** **** **** 0000';
        const last4 = num.slice(-4);
        return `**** **** **** ${last4}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="cyber-spinner"></div>
            </div>
        );
    }

    const pendingPayments = payments.filter((p) => p.paymentStatus === 'PENDING');
    const approvedPayments = payments.filter((p) => p.paymentStatus === 'APPROVED');

    return (
        <div className="min-h-screen bg-black relative overflow-hidden selection:bg-red-500/30">
<<<<<<< HEAD
=======
            {/* Edit Card Modal */}
            <AnimatePresence>
                {editingCard && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0f0f0f] border border-gray-800 p-8 rounded-xl w-full max-w-2xl shadow-2xl relative my-10"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-(--accent)"></div>
                            <h3 className="text-xl font-black text-white mb-6 tracking-widest flex items-center gap-3">
                                <span className="text-(--accent)">EDIT</span> ASSET
                            </h3>

                            <form onSubmit={handleUpdateCard} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold">Title</label>
                                    <input type="text" value={editCardForm.title || ''} onChange={(e) => setEditCardForm({ ...editCardForm, title: e.target.value })} className="w-full bg-black/50 border border-gray-800 p-3 text-white text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold">Price</label>
                                    <input type="number" value={editCardForm.price || ''} onChange={(e) => setEditCardForm({ ...editCardForm, price: parseFloat(e.target.value) })} className="w-full bg-black/50 border border-gray-800 p-3 text-white text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold">Card Number</label>
                                    <input type="text" value={editCardForm.cardNumber || ''} onChange={(e) => setEditCardForm({ ...editCardForm, cardNumber: e.target.value })} className="w-full bg-black/50 border border-gray-800 p-3 text-white text-sm" />
                                </div>
                                {/* Additional Fields */}
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold">Expiry</label>
                                    <input type="text" value={editCardForm.expiry || ''} onChange={(e) => setEditCardForm({ ...editCardForm, expiry: e.target.value })} className="w-full bg-black/50 border border-gray-800 p-3 text-white text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold">CVV</label>
                                    <input type="text" value={editCardForm.cvv || ''} onChange={(e) => setEditCardForm({ ...editCardForm, cvv: e.target.value })} className="w-full bg-black/50 border border-gray-800 p-3 text-white text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold">Balance/Limit</label>
                                    <input type="text" value={editCardForm.bank || ''} onChange={(e) => setEditCardForm({ ...editCardForm, bank: e.target.value })} className="w-full bg-black/50 border border-gray-800 p-3 text-white text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold">Proxy / SOCKS</label>
                                    <input type="text" value={editCardForm.proxy || ''} onChange={(e) => setEditCardForm({ ...editCardForm, proxy: e.target.value })} className="w-full bg-black/50 border border-gray-800 p-3 text-white text-sm" />
                                </div>


                                <div className="col-span-1 md:col-span-2 flex gap-4 mt-6">
                                    <button type="button" onClick={() => setEditingCard(null)} className="flex-1 py-3 bg-gray-900 text-gray-400 font-bold text-xs hover:bg-gray-800">CANCEL</button>
                                    <button type="submit" className="flex-1 py-3 bg-(--accent) text-black font-bold text-xs hover:bg-white">SAVE CHANGES</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

>>>>>>> f082feee3760cd76e32931d83abc25fd295865ef
            {/* Background Animation */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <AdminGridBackground />
            </div>

            {/* Intense Animated Gradient Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <motion.div
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.4, 0.7, 0.4],
                        rotate: [0, 90, 0]
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-red-600/30 rounded-full blur-[100px] mix-blend-screen"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.3, 0.6, 0.3],
                        x: [0, 100, 0]
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-red-800/20 rounded-full blur-[120px] mix-blend-screen"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/5 rounded-full blur-[150px] mix-blend-overlay"
                />
            </div>

            {/* Notification Toast */}
            {/* Notification Toast - High Visibility */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -50, x: '-50%' }}
                        className={`fixed top-8 left-1/2 z-9999 min-w-[320px] md:min-w-[400px] p-0 rounded-lg shadow-2xl backdrop-blur-xl border flex flex-col overflow-hidden ${notification.type === 'success' ? 'bg-black/90 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]' :
                            notification.type === 'error' ? 'bg-black/90 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' :
                                'bg-black/90 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                            }`}
                    >
                        <div className="flex items-center gap-4 p-5 relative">
                            {/* Icon Box */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold border ${notification.type === 'success' ? 'bg-green-500/10 border-green-500 text-green-500' :
                                notification.type === 'error' ? 'bg-red-500/10 border-red-500 text-red-500' :
                                    'bg-blue-500/10 border-blue-500 text-blue-500'
                                }`}>
                                {notification.type === 'success' ? '✓' : notification.type === 'error' ? '!' : 'i'}
                            </div>

                            {/* Message */}
                            <div className="flex-1">
                                <h4 className={`text-xs font-black tracking-widest mb-1 ${notification.type === 'success' ? 'text-green-500' :
                                    notification.type === 'error' ? 'text-red-500' :
                                        'text-blue-500'
                                    }`}>
                                    {notification.type === 'success' ? 'SYSTEM SUCCESS' : notification.type === 'error' ? 'SYSTEM ERROR' : 'INFORMATION'}
                                </h4>
                                <p className="text-sm font-bold text-white tracking-wide leading-tight">
                                    {notification.message}
                                </p>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => setNotification(null)}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Progress Bar Animation */}
                        <motion.div
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: 3, ease: "linear" }}
                            className={`h-1 w-full ${notification.type === 'success' ? 'bg-green-500' :
                                notification.type === 'error' ? 'bg-red-500' :
                                    'bg-blue-500'
                                }`}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="border-b border-(--accent)/30 bg-black/90 backdrop-blur-md sticky top-0 z-50 shadow-[0_0_20px_rgba(255,0,51,0.2)]"
            >
                <div className="container mx-auto px-6 py-4" style={{ padding: '16px 24px' }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            {/* Logo */}
                            <div className="relative w-48 h-12 md:w-56 md:h-14 transition-transform hover:scale-105 duration-300">
                                <Image
                                    src="/logo_header.PNG"
                                    alt="WARZONE ADMIN"
                                    fill
                                    className="object-contain drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                                    priority
                                    unoptimized
                                />
                            </div>

                            {/* Admin Badge */}
                            <div className="hidden md:block border-l-2 border-(--accent) pl-6">
                                <h1 className="text-lg font-black text-white tracking-widest text-shadow-sm">
                                    ADMIN <span className="text-(--accent)">CORE</span>
                                </h1>
                                <p className="text-[10px] terminal-text tracking-[0.3em] text-(--accent)/80 font-bold">
                                    SYSTEM LEVEL 1
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="neon-button px-8 py-3 text-xs font-bold tracking-widest text-(--text-dim) hover:text-white border-(--accent) hover:bg-(--accent) hover:shadow-[0_0_20px_var(--accent)] transition-all duration-300 group relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-(--accent) group-hover:bg-white animate-pulse shadow-[0_0_5px_var(--accent)]"></span>
                                TERMINATE SESSION
                            </span>
                        </button>
                    </div>
                </div>
            </motion.header>

            <div className="container mx-auto px-6 py-10 relative z-10" style={{ padding: '40px 24px' }}>
                {/* Tab Navigation */}
                <div className="flex gap-4 mb-10">
                    <button
                        onClick={() => setActiveTab('payments')}
                        className={`px-8 py-3 text-sm font-black tracking-widest transition-all skew-x-[-15deg] border-2 uppercase relative overflow-hidden group ${activeTab === 'payments'
                            ? 'bg-(--accent) text-black border-(--accent) shadow-[0_0_20px_var(--accent)] scale-105'
                            : 'bg-black/50 text-gray-500 border-gray-800 hover:border-(--accent) hover:text-(--accent) hover:shadow-[0_0_10px_rgba(255,0,51,0.3)]'
                            }`}
                    >
                        <span className="block skew-x-15 relative z-10">PAYMENTS & ALERTS</span>
                        {activeTab !== 'payments' && <div className="absolute inset-0 bg-(--accent)/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('cards')}
                        className={`px-8 py-3 text-sm font-black tracking-widest transition-all skew-x-[-15deg] border-2 uppercase relative overflow-hidden group ${activeTab === 'cards'
                            ? 'bg-(--accent) text-black border-(--accent) shadow-[0_0_20px_var(--accent)] scale-105'
                            : 'bg-black/50 text-gray-500 border-gray-800 hover:border-(--accent) hover:text-(--accent) hover:shadow-[0_0_10px_rgba(255,0,51,0.3)]'
                            }`}
                    >
                        <span className="block skew-x-15 relative z-10">CARD INVENTORY</span>
                        {activeTab !== 'cards' && <div className="absolute inset-0 bg-(--accent)/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-8 py-3 text-sm font-black tracking-widest transition-all skew-x-[-15deg] border-2 uppercase relative overflow-hidden group ${activeTab === 'orders'
                            ? 'bg-(--accent) text-black border-(--accent) shadow-[0_0_20px_var(--accent)] scale-105'
                            : 'bg-black/50 text-gray-500 border-gray-800 hover:border-(--accent) hover:text-(--accent) hover:shadow-[0_0_10px_rgba(255,0,51,0.3)]'
                            }`}
                    >
                        <span className="block skew-x-15 relative z-10">SALES HISTORY</span>
                        {activeTab !== 'orders' && <div className="absolute inset-0 bg-(--accent)/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>}
                    </button>
                </div>

                {/* Payments Tab */}
                {activeTab === 'payments' && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        {/* Stats */}
                        <div
                            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
                        >
                            {[
                                { label: 'TOTAL TRAFFIC', value: payments.length, color: 'text-white' },
                                { label: 'PENDING REQUESTS', value: pendingPayments.length, color: 'text-(--accent)', animate: true },
                                { label: 'VERIFIED AGENTS', value: approvedPayments.length, color: 'text-green-500' }
                            ].map((stat, i) => (
                                <div key={i} className="relative bg-[#0a0a0a] p-8 rounded-xl border border-(--border) overflow-hidden group hover:border-(--accent)/50 transition-colors shadow-lg" style={{ padding: '32px' }}>
                                    <div className="absolute inset-0 bg-(--accent)/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl font-black select-none pointer-events-none">
                                        {i + 1}
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-xs text-gray-500 font-bold tracking-[0.2em] mb-4">{stat.label}</p>
                                        <p className={`text-6xl font-black ${stat.color} ${stat.animate ? 'animate-pulse' : ''} text-glow`}>
                                            {stat.value}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pending approvals */}
                        <div
                            className="mb-16"
                        >
                            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-800">
                                <div className="w-3 h-3 bg-(--accent) rounded-full animate-ping"></div>
                                <h2 className="text-2xl font-black tracking-widest text-white">
                                    SECURITY ALERTS <span className="text-(--accent) text-lg align-top ml-2">({pendingPayments.length})</span>
                                </h2>
                            </div>

                            {pendingPayments.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6">
                                    {pendingPayments
                                        .slice((alertsPage - 1) * alertsPerPage, alertsPage * alertsPerPage)
                                        .map((payment, index) => (
                                            <motion.div
                                                key={payment.paymentId}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="bg-[#050505] border border-(--accent)/50 p-6 rounded-lg hover:bg-(--accent)/5 transition-all shadow-[0_0_15px_rgba(255,0,51,0.1)] hover:shadow-[0_0_25px_rgba(255,0,51,0.2)] flex flex-col lg:flex-row items-center justify-between gap-6 group relative overflow-hidden"
                                                style={{ padding: '24px' }}
                                            >
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-(--accent)"></div>

                                                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8 w-full">
                                                    <div>
                                                        <p className="text-[10px] text-(--accent) font-bold tracking-widest mb-2">AGENT_ID</p>
                                                        <p className="text-lg font-black text-white group-hover:text-(--accent) transition-colors">{payment.username}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 font-bold tracking-widest mb-2">EMAIL_ADDRESS</p>
                                                        <p className="text-sm text-gray-300 font-mono">{payment.email}</p>
                                                    </div>
                                                    <div className="md:col-span-1">
                                                        <p className="text-[10px] text-gray-500 font-bold tracking-widest mb-2">TRX_HASH</p>
                                                        <p className="text-xs font-mono text-(--text-dim) bg-black/50 p-2 rounded border border-gray-800 break-all">{payment.trxId}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 font-bold tracking-widest mb-2">TIMESTAMP</p>
                                                        <p className="text-sm text-gray-400 font-mono">{formatDate(payment.createdAt)}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => setDeletingId(payment.trxId)}
                                                        className="px-6 py-3 text-sm font-bold tracking-widest text-[#666] hover:text-white hover:bg-white/10 transition-colors rounded uppercase"
                                                    >
                                                        REJECT
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(payment.trxId)}
                                                        disabled={approving === payment.trxId}
                                                        className="relative overflow-hidden group bg-(--accent) text-black min-w-[140px] py-3 text-sm font-black tracking-widest skew-x-[-10deg] hover:scale-105 transition-transform shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:shadow-[0_0_30px_rgba(220,38,38,0.8)]"
                                                    >
                                                        <span className="block skew-x-10 relative z-10 group-hover:text-white transition-colors">
                                                            {approving === payment.trxId ? (
                                                                <span className="flex items-center justify-center gap-2">
                                                                    <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                                                    SYNCING...
                                                                </span>
                                                            ) : 'AUTHORIZE'}
                                                        </span>
                                                        <div className="absolute inset-0 bg-black/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}

                                    {/* Alerts Pagination Controls */}
                                    {pendingPayments.length > alertsPerPage && (
                                        <div className="flex justify-center gap-2 mt-4">
                                            <button
                                                onClick={() => setAlertsPage(p => Math.max(1, p - 1))}
                                                disabled={alertsPage === 1}
                                                className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded disabled:opacity-50 hover:text-white transition-colors text-xs font-bold"
                                            >
                                                PREV
                                            </button>
                                            <div className="flex items-center gap-2">
                                                {Array.from({ length: Math.ceil(pendingPayments.length / alertsPerPage) }, (_, i) => i + 1)
                                                    .slice(Math.max(0, alertsPage - 3), Math.min(Math.ceil(pendingPayments.length / alertsPerPage), alertsPage + 2))
                                                    .map(pageNum => (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => setAlertsPage(pageNum)}
                                                            className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-colors ${alertsPage === pageNum
                                                                ? 'bg-(--accent) text-black'
                                                                : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                                                                }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    ))}
                                            </div>
                                            <button
                                                onClick={() => setAlertsPage(p => Math.min(Math.ceil(pendingPayments.length / alertsPerPage), p + 1))}
                                                disabled={alertsPage === Math.ceil(pendingPayments.length / alertsPerPage)}
                                                className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded disabled:opacity-50 hover:text-white transition-colors text-xs font-bold"
                                            >
                                                NEXT
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-12 border border-dashed border-(--border) rounded-lg text-center bg-(--bg-secondary)/50">
                                    <p className="text-gray-500 font-mono tracking-widest">NO PENDING SECURITY ALERTS</p>
                                </div>
                            )}

                            {/* REJECT Confirmation Modal */}
                            <AnimatePresence>
                                {deletingId && (
                                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="bg-[#0f0f0f] border border-red-900/50 p-8 rounded-xl w-full max-w-sm shadow-[0_0_50px_rgba(220,38,38,0.2)] relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1 bg-(--accent)"></div>

                                            <div className="flex flex-col items-center text-center mb-6">
                                                <div className="w-16 h-16 rounded-full bg-red-900/20 flex items-center justify-center mb-4 border border-red-500/30">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-(--accent)"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                </div>
                                                <h3 className="text-xl font-black text-white tracking-widest mb-2">REJECT PAYMENT?</h3>
                                                <p className="text-gray-500 text-xs font-mono">This action is irreversible. The payment record and associated data will be permanently deleted.</p>
                                            </div>

                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setDeletingId(null)}
                                                    className="flex-1 py-3 text-xs font-bold tracking-widest bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors rounded"
                                                >
                                                    CANCEL
                                                </button>
                                                <button
                                                    onClick={confirmReject}
                                                    className="flex-1 py-3 text-xs font-bold tracking-widest bg-(--accent) text-black hover:bg-red-500 hover:text-white transition-colors rounded shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                                                >
                                                    CONFIRM REJECT
                                                </button>
                                            </div>
                                        </motion.div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Approved users */}
                        <div>
                            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-800">
                                <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e] animate-pulse"></div>
                                <h2 className="text-2xl font-black tracking-widest text-white">
                                    AUTHORIZED PERSONNEL <span className="text-green-500 text-lg align-top ml-2">({approvedPayments.length})</span>
                                </h2>
                            </div>

                            {approvedPayments.length > 0 ? (
                                <div className="bg-[#0a0a0a]/80 backdrop-blur-md border border-(--border) rounded-xl overflow-hidden shadow-2xl relative">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-green-500 to-transparent opacity-50"></div>

                                    {/* Table Header */}
                                    <div className="grid grid-cols-4 p-5 bg-(--accent)/10 border-b border-(--accent)/20 text-[10px] text-(--accent) tracking-[0.2em] font-black uppercase" style={{ padding: '20px' }}>
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-(--accent) rounded-full"></span> AGENT ID
                                        </div>
                                        <div>CONTACT_FREQ</div>
                                        <div>HASH_KEY</div>
                                        <div className="text-right">TIMESTAMP</div>
                                    </div>

                                    {/* Table Body */}
                                    <div className="divide-y divide-white/5">
                                        {approvedPayments
                                            .slice((paymentsPage - 1) * paymentsPerPage, paymentsPage * paymentsPerPage)
                                            .map((payment, index) => (
                                                <motion.div
                                                    key={payment.paymentId}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="grid grid-cols-4 p-5 hover:bg-(--accent)/5 transition-all duration-300 items-center group relative overflow-hidden"
                                                    style={{ padding: '24px 20px' }}
                                                >
                                                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                                    <div className="font-bold text-white group-hover:text-green-400 transition-colors text-sm flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-[10px] font-mono text-gray-400 border border-white/10 group-hover:border-green-500/30 group-hover:text-green-500 transition-colors">
                                                            {payment.username.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        {payment.username}
                                                    </div>
                                                    <div className="text-gray-400 truncate pr-4 font-mono text-xs group-hover:text-gray-300 transition-colors">{payment.email}</div>
                                                    <div className="font-mono text-gray-500 truncate pr-4 text-xs group-hover:text-(--accent) transition-colors">
                                                        <span className="opacity-50">TRX::</span>{payment.trxId.substring(0, 12)}...
                                                    </div>
                                                    <div className="text-right text-gray-500 font-mono text-xs group-hover:text-white transition-colors">
                                                        {formatDate(payment.createdAt)}
                                                    </div>
                                                </motion.div>
                                            ))}
                                    </div>

                                    {/* Payments Pagination Controls */}
                                    {approvedPayments.length > paymentsPerPage && (
                                        <div className="p-4 border-t border-gray-800 flex justify-center gap-2">
                                            <button
                                                onClick={() => setPaymentsPage(p => Math.max(1, p - 1))}
                                                disabled={paymentsPage === 1}
                                                className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded disabled:opacity-50 hover:text-white transition-colors text-xs font-bold"
                                            >
                                                PREV
                                            </button>
                                            <div className="flex items-center gap-2">
                                                {Array.from({ length: Math.ceil(approvedPayments.length / paymentsPerPage) }, (_, i) => i + 1)
                                                    .slice(Math.max(0, paymentsPage - 3), Math.min(Math.ceil(approvedPayments.length / paymentsPerPage), paymentsPage + 2))
                                                    .map(pageNum => (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => setPaymentsPage(pageNum)}
                                                            className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-colors ${paymentsPage === pageNum
                                                                ? 'bg-green-500 text-black'
                                                                : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                                                                }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    ))}
                                            </div>
                                            <button
                                                onClick={() => setPaymentsPage(p => Math.min(Math.ceil(approvedPayments.length / paymentsPerPage), p + 1))}
                                                disabled={paymentsPage === Math.ceil(approvedPayments.length / paymentsPerPage)}
                                                className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded disabled:opacity-50 hover:text-white transition-colors text-xs font-bold"
                                            >
                                                NEXT
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-12 border border-dashed border-(--border) rounded-lg text-center bg-(--bg-secondary)/50" style={{ padding: '48px' }}>
                                    <p className="text-gray-500 font-mono tracking-widest">DATABASE EMPTY</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )
                }

                {/* Cards Management Tab */}
                {
                    activeTab === 'cards' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-800">
                                <h2 className="text-2xl font-black tracking-widest text-white">
                                    CARD INVENTORY <span className="text-(--accent) text-lg align-top ml-2">({cards.length})</span>
                                </h2>
                                <button
                                    onClick={() => setShowAddCard(!showAddCard)}
                                    className="px-8 py-3 text-sm font-black tracking-widest transition-all duration-300 skew-x-[-15deg] border-2 border-(--accent) bg-(--accent) text-black hover:bg-black hover:text-(--accent) shadow-[0_0_15px_var(--accent)] hover:shadow-[0_0_25px_var(--accent)]"
                                >
                                    <span className="block skew-x-15">{showAddCard ? 'CANCEL ACTION' : '+ ADD NEW CARD'}</span>
                                </button>
                            </div>

                            {/* Add Card Form */}
                            <AnimatePresence>
                                {showAddCard && (
                                    <motion.form
                                        initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        onSubmit={handleAddCard}
                                        className="bg-[#050505]/90 backdrop-blur-xl border border-(--accent) p-10 rounded-2xl mb-12 shadow-[0_0_50px_rgba(220,38,38,0.15)] relative overflow-hidden"
                                        style={{ padding: '40px' }}
                                    >
                                        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-(--accent) to-transparent opacity-80"></div>
                                        <div className="absolute -left-20 -top-20 w-60 h-60 bg-(--accent)/5 rounded-full blur-3xl pointer-events-none"></div>

                                        <h3 className="text-2xl font-black text-white mb-10 tracking-widest flex items-center gap-4 border-b border-white/5 pb-6">
                                            <span className="w-10 h-10 rounded bg-(--accent) text-black flex items-center justify-center shadow-[0_0_15px_var(--accent)]">+</span>
                                            NEW ASSET ENTRY
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] text-(--accent) font-bold tracking-widest uppercase">Asset Title</label>
                                                <input type="text" placeholder="Platinum Business Debit" value={newCard.title} onChange={(e) => setNewCard({ ...newCard, title: e.target.value })} className="cyber-input font-bold text-white placeholder-gray-700 bg-black/50 focus:bg-black transition-colors border-white/10 focus:border-(--accent) h-12" required />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] text-(--accent) font-bold tracking-widest uppercase">Price (USDT)</label>
                                                <input type="number" step="0.01" placeholder="45.00" value={newCard.price} onChange={(e) => setNewCard({ ...newCard, price: e.target.value })} className="cyber-input font-bold text-white placeholder-gray-700 bg-black/50 focus:bg-black transition-colors border-white/10 focus:border-(--accent) h-12" required />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] text-(--accent) font-bold tracking-widest uppercase">Card Number</label>
                                                <input type="text" placeholder="4444 4444 4444 4444" value={newCard.cardNumber} onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })} className="cyber-input font-bold text-white placeholder-gray-700 font-mono bg-black/50 focus:bg-black transition-colors border-white/10 focus:border-(--accent) h-12" required />
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Expiry Date</label>
                                                <input type="text" placeholder="MM/YYYY" value={newCard.expiry} onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })} className="cyber-input font-mono bg-black/50 h-10 text-sm" />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">CVV Code</label>
                                                <input type="text" placeholder="123" value={newCard.cvv} onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })} className="cyber-input font-mono bg-black/50 h-10 text-sm" />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Holder Name</label>
                                                <input type="text" placeholder="JOHN DOE" value={newCard.holder} onChange={(e) => setNewCard({ ...newCard, holder: e.target.value })} className="cyber-input uppercase bg-black/50 h-10 text-sm" />
                                            </div>

                                            {/* Detailed fields */}
                                            <div className="col-span-1 md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-8 border-t border-white/5">
<<<<<<< HEAD
                                                <input type="text" placeholder="Bank Name" value={newCard.bank} onChange={(e) => setNewCard({ ...newCard, bank: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 transition-colors" />
                                                <input type="text" placeholder="Type (Debit/Credit)" value={newCard.type} onChange={(e) => setNewCard({ ...newCard, type: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 transition-colors" />
                                                <input type="text" placeholder="Address" value={newCard.address} onChange={(e) => setNewCard({ ...newCard, address: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 transition-colors" />
                                                <input type="text" placeholder="City" value={newCard.city} onChange={(e) => setNewCard({ ...newCard, city: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 transition-colors" />
                                                <input type="text" placeholder="State" value={newCard.state} onChange={(e) => setNewCard({ ...newCard, state: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 transition-colors" />
                                                <input type="text" placeholder="ZIP" value={newCard.zip} onChange={(e) => setNewCard({ ...newCard, zip: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 transition-colors" />
                                                <input type="text" placeholder="Country" value={newCard.country} onChange={(e) => setNewCard({ ...newCard, country: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 transition-colors" />
                                                <input type="text" placeholder="SSN" value={newCard.ssn} onChange={(e) => setNewCard({ ...newCard, ssn: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 transition-colors" />
=======
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-gray-500 font-bold uppercase">Bank Name</label>
                                                    <input type="text" placeholder="Bank Name" value={newCard.bank} onChange={(e) => setNewCard({ ...newCard, bank: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 h-10 w-full" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-gray-500 font-bold uppercase">Type (Visa/Master)</label>
                                                    <input type="text" placeholder="Visa/Master" value={newCard.type} onChange={(e) => setNewCard({ ...newCard, type: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 h-10 w-full" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-gray-500 font-bold uppercase">Personal Email</label>
                                                    <input type="email" placeholder="Gmail/Email" value={newCard.email} onChange={(e) => setNewCard({ ...newCard, email: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 h-10 w-full" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-gray-500 font-bold uppercase">DOB</label>
                                                    <input type="text" placeholder="MM/DD/YYYY" value={newCard.dob} onChange={(e) => setNewCard({ ...newCard, dob: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 h-10 w-full" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-gray-500 font-bold uppercase">Address (Opt)</label>
                                                    <input type="text" placeholder="Street Address" value={newCard.address} onChange={(e) => setNewCard({ ...newCard, address: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 h-10 w-full" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-gray-500 font-bold uppercase">City</label>
                                                    <input type="text" placeholder="City" value={newCard.city} onChange={(e) => setNewCard({ ...newCard, city: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 h-10 w-full" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-gray-500 font-bold uppercase">State</label>
                                                    <input type="text" placeholder="State" value={newCard.state} onChange={(e) => setNewCard({ ...newCard, state: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 h-10 w-full" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-gray-500 font-bold uppercase">Zipcode</label>
                                                    <input type="text" placeholder="Zipcode" value={newCard.zip} onChange={(e) => setNewCard({ ...newCard, zip: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 h-10 w-full" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-gray-500 font-bold uppercase">Country</label>
                                                    <input type="text" placeholder="Country" value={newCard.country} onChange={(e) => setNewCard({ ...newCard, country: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 h-10 w-full" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-gray-500 font-bold uppercase">Phone (Opt)</label>
                                                    <input type="text" placeholder="Phone" value={newCard.phone} onChange={(e) => setNewCard({ ...newCard, phone: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 h-10 w-full" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-gray-500 font-bold uppercase">SSN</label>
                                                    <input type="text" placeholder="SSN" value={newCard.ssn} onChange={(e) => setNewCard({ ...newCard, ssn: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 h-10 w-full" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-gray-500 font-bold uppercase">Proxy</label>
                                                    <input type="text" placeholder="Proxy" value={newCard.proxy} onChange={(e) => setNewCard({ ...newCard, proxy: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 h-10 w-full" />
                                                </div>
>>>>>>> f082feee3760cd76e32931d83abc25fd295865ef
                                            </div>
                                        </div>
                                        <div className="flex justify-end mt-10">
                                            <button type="submit" className="px-12 py-5 text-sm font-black tracking-[0.2em] transition-all skew-x-[-15deg] border-2 border-(--accent) bg-(--accent) text-black hover:bg-black hover:text-(--accent) shadow-[0_0_20px_rgba(255,0,51,0.3)] hover:shadow-[0_0_30px_var(--accent)] hover:scale-105 active:scale-95 group">
                                                <span className="skew-x-15 flex items-center gap-3">
                                                    PUBLISH TO MARKET <span className="text-xl group-hover:rotate-90 transition-transform">↗</span>
                                                </span>
                                            </button>
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>

                            {/* Cards List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
<<<<<<< HEAD
                                {cards.map((card, index) => (
                                    <motion.div
                                        key={card.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group relative perspective-[1000px] h-[240px]"
                                        style={{ padding: '0' }}
                                    >
                                        {/* 3D Card Container */}
                                        <div className="relative w-full h-full transition-all duration-700 transform-style-3d group-hover:rotate-y-180">

                                            {/* FRONT SIDE (Blue Card) */}
                                            <div className="absolute inset-0 backface-hidden">
                                                <div className="relative w-full h-full bg-[#111] rounded-2xl shadow-xl overflow-hidden text-white p-6 border border-gray-800 group-hover:border-(--accent) transition-colors duration-300 flex flex-col justify-between">

                                                    {/* Background texture */}
                                                    <div className="absolute inset-0 opacity-20 bg-[url('/grid.png')] bg-cover"></div>
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-(--accent)/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                                                    {/* Top Row: Chip and Price */}
                                                    <div className="relative z-10 flex justify-between items-start" style={{ padding: '10px' }}>
                                                        <div className="w-12 h-9 bg-yellow-400 rounded-md shadow-sm border border-yellow-500/50 relative overflow-hidden flex items-center justify-center">
                                                            <div className="grid grid-cols-2 gap-1 w-full h-full p-[2px] opacity-50">
                                                                <div className="border border-black/20 rounded-sm"></div>
                                                                <div className="border border-black/20 rounded-sm"></div>
                                                                <div className="border border-black/20 rounded-sm"></div>
                                                                <div className="border border-black/20 rounded-sm"></div>
=======
                                {cards
                                    .slice((cardsPage - 1) * cardsPerPage, cardsPage * cardsPerPage)
                                    .map((card, index) => (
                                        <motion.div
                                            key={card.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="group relative perspective-[1000px] h-[240px]"
                                            style={{ padding: '0' }}
                                        >
                                            {/* 3D Card Container */}
                                            <div className={`relative w-full h-full transition-all duration-700 transform-style-3d group-hover:rotate-y-180 ${!card.forSale ? 'opacity-40 grayscale-[0.5]' : ''}`}>

                                                {/* Sold Overlay */}
                                                {!card.forSale && (
                                                    <div className="absolute inset-x-0 bottom-4 z-50 flex flex-col items-center justify-center pointer-events-none">
                                                        <span className="bg-white text-black px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transform skew-x-[-12deg]">
                                                            Sold on : {card.soldAt ? formatDate(card.soldAt) : 'RECENTLY'}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* FRONT SIDE (Blue Card) */}
                                                <div className="absolute inset-0 backface-hidden">
                                                    <div className="relative w-full h-full bg-[#111] rounded-2xl shadow-xl overflow-hidden text-white p-6 border border-gray-800 group-hover:border-(--accent) transition-colors duration-300 flex flex-col justify-between">

                                                        {/* Background texture */}
                                                        <div className="absolute inset-0 opacity-20 bg-grid pointer-events-none"></div>
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-(--accent)/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                                                        {/* Top Row: Chip and Price */}
                                                        <div className="relative z-10 flex justify-between items-start" style={{ padding: '10px' }}>
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
>>>>>>> f082feee3760cd76e32931d83abc25fd295865ef
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="bg-(--accent)/20 border border-(--accent)/50 px-3 py-1 rounded-full text-xs font-black shadow-[0_0_15px_rgba(255,0,51,0.3)] text-(--accent)">
                                                                {card.price} USDT
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Card Number */}
                                                    <div className="mt-2" style={{ padding: '10px' }}>
                                                        <p className="text-xl md:text-2xl font-mono font-bold tracking-widest drop-shadow-md whitespace-nowrap">
                                                            {formatCardNumber(card.cardNumber).replace(/\*/g, 'X')}
                                                        </p>
                                                    </div>

                                                    {/* Bottom Info */}
                                                    <div className="flex justify-between items-end mt-2 px-1" style={{ padding: '12px' }}>
                                                        <div>
                                                            <p className="text-[9px] uppercase opacity-75 font-bold mb-0.5">Card Holder</p>
                                                            <p className="font-mono font-bold text-xs tracking-wide uppercase">{maskStart(card.holder).replace(/\*/g, 'X')}</p>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <p className="text-[9px] uppercase opacity-75 font-bold mb-0.5">Expires</p>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-mono font-bold text-xs tracking-wide">{card.expiry ? card.expiry.replace(/\*\*/g, 'XX/XX') : '12/XX'}</p>
                                                                <h3 className="text-xl font-black italic tracking-tighter leading-none">VISA</h3>
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
                                                            <h3 className="text-xl font-black italic text-white tracking-tighter mb-2 opacity-80">VISA</h3>
                                                        </div>
                                                    </div>

                                                    {/* Delete Button Overlay */}
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-[2px] z-10">
                                                        <button
                                                            onClick={() => handleDeleteCard(card.id)}
                                                            className="px-6 py-2 bg-red-600 text-white text-xs font-black rounded hover:bg-red-500 hover:scale-105 transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)] uppercase tracking-widest flex items-center gap-2"
                                                        >
                                                            <span>✕ DELETE ASSET</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {cards.length === 0 && !showAddCard && (
                                <div className="p-12 border border-dashed border-(--border) rounded-lg text-center bg-(--bg-secondary)/50">
                                    <p className="text-gray-500 font-mono tracking-widest">INVENTORY EMPTY - ADD NEW ASSETS</p>
                                </div>
                            )}
                        </motion.div>
                    )
                }

                {/* Orders Tab */}
                {
                    activeTab === 'orders' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            {/* Edit Order Modal */}
                            <AnimatePresence>
                                {editingOrder && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-[#0f0f0f] border border-gray-800 p-8 rounded-xl w-full max-w-md shadow-2xl relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1 bg-(--accent)"></div>

                                            <h3 className="text-xl font-black text-white mb-6 tracking-widest flex items-center gap-3">
                                                <span className="text-(--accent)">EDIT</span> ORDER
                                            </h3>

                                            <form onSubmit={handleUpdateOrder} className="space-y-4">
                                                <div>
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1">Asset Title</label>
                                                    <input
                                                        type="text"
                                                        value={editOrderForm.cardTitle || ''}
                                                        onChange={(e) => setEditOrderForm({ ...editOrderForm, cardTitle: e.target.value })}
                                                        className="w-full bg-black/50 border border-gray-800 rounded p-3 text-white focus:border-(--accent) focus:outline-none transition-colors text-sm font-bold"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1">Price (USDT)</label>
                                                    <input
                                                        type="number"
                                                        value={editOrderForm.price || ''}
                                                        onChange={(e) => setEditOrderForm({ ...editOrderForm, price: parseFloat(e.target.value) })}
                                                        className="w-full bg-black/50 border border-gray-800 rounded p-3 text-white focus:border-(--accent) focus:outline-none transition-colors text-sm font-mono"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1">Date & Time</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={editOrderForm.purchaseDate ? new Date(editOrderForm.purchaseDate).toISOString().slice(0, 16) : ''}
                                                        onChange={(e) => setEditOrderForm({ ...editOrderForm, purchaseDate: new Date(e.target.value) })}
                                                        className="w-full bg-black/50 border border-gray-800 rounded p-3 text-white focus:border-(--accent) focus:outline-none transition-colors text-sm font-mono"
                                                    />
                                                </div>

                                                <div className="flex gap-3 pt-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingOrder(null)}
                                                        className="flex-1 py-3 text-xs font-bold tracking-widest bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors rounded"
                                                    >
                                                        CANCEL
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="flex-1 py-3 text-xs font-bold tracking-widest bg-(--accent) text-black hover:bg-white transition-colors rounded shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                                                    >
                                                        SAVE CHANGES
                                                    </button>
                                                </div>
                                            </form>
                                        </motion.div>
                                    </div>
                                )}
                            </AnimatePresence>

                            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-800">
                                <h2 className="text-2xl font-black tracking-widest text-white">
                                    SALES HISTORY <span className="text-(--accent) text-lg align-top ml-2">({orders.length})</span>
                                </h2>
                                <div className="px-3 py-1 bg-(--accent)/10 border border-(--accent)/30 rounded text-[10px] text-(--accent) font-bold tracking-widest uppercase">
                                    LIVE DATA
                                </div>
                            </div>

                            {orders.length > 0 ? (
                                <div className="bg-[#0a0a0a]/80 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden shadow-2xl relative">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-(--accent) to-transparent opacity-50"></div>

                                    {/* Table Header - Improved Alignment and Visibility */}
<<<<<<< HEAD
                                    <div className="grid grid-cols-5 p-4 bg-[#0f0f0f] border-b border-gray-800 text-[10px] text-gray-400 tracking-wider font-black uppercase whitespace-nowrap">
                                        <div className="col-span-2">ITEM SOLD</div>
                                        <div className="text-center">PRICE</div>
                                        <div className="text-center">BUYER ID</div>
=======
                                    <div className="grid grid-cols-7 p-4 bg-[#0f0f0f] border-b border-gray-800 text-[10px] text-gray-400 tracking-wider font-black uppercase whitespace-nowrap">
                                        <div className="col-span-2">ITEM SOLD</div>
                                        <div className="text-center">PRICE</div>
                                        <div className="text-center">PURCHASER</div>
                                        <div className="text-center">GMAIL/EMAIL</div>
>>>>>>> f082feee3760cd76e32931d83abc25fd295865ef
                                        <div className="text-right">DATE & TIME</div>
                                        <div className="text-right">ACTIONS</div>
                                    </div>

                                    {/* Table Body - Better spacing and hover effects */}
                                    <div className="divide-y divide-white/5">
                                        {orders
                                            .slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage)
                                            .map((order, index) => (
                                                <motion.div
                                                    key={order.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    className="grid grid-cols-6 p-4 hover:bg-[#111] transition-all duration-300 items-center group relative overflow-hidden"
                                                >
                                                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-(--accent) opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                                    {/* Item Name */}
                                                    <div className="col-span-2 pr-4">
                                                        <div className="font-bold text-white group-hover:text-(--accent) transition-colors text-sm wrap-break-word leading-tight">
                                                            {order.cardTitle || 'Unknown Item'}
                                                        </div>
                                                        <div className="text-[10px] text-gray-600 font-mono mt-1 group-hover:text-gray-500">
                                                            ID: {(order._id || order.id || 'N/A').slice(0, 8)}...
                                                        </div>
                                                    </div>

                                                    {/* Price Badge */}
                                                    <div className="text-center">
                                                        <span className="inline-block px-3 py-1 bg-[#1a1a1a] border border-gray-800 rounded text-green-500 font-mono text-xs font-bold group-hover:border-green-900 group-hover:bg-green-900/10 transition-colors">
                                                            ${(order.price || 0).toLocaleString()}
                                                        </span>
                                                    </div>

                                                    {/* Buyer ID */}
                                                    <div className="text-center">
                                                        <div className="inline-flex items-center gap-2 px-2 py-1 bg-[#1a1a1a] rounded border border-transparent group-hover:border-gray-800 transition-colors">
                                                            <div className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center text-[8px] text-gray-400">
                                                                U
                                                            </div>
                                                            <span className="font-mono text-gray-500 text-xs">
                                                                {(order.userId || 'UNKNOWN').slice(0, 8)}...
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Date */}
                                                    <div className="text-right">
                                                        <div className="text-gray-400 font-mono text-xs group-hover:text-white transition-colors">
                                                            {new Date(order.purchaseDate || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                        <div className="text-[10px] text-gray-600 font-mono mt-0.5">
                                                            {new Date(order.purchaseDate || Date.now()).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="text-right flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingOrder(order);
                                                                setEditOrderForm(order);
                                                            }}
                                                            className="p-2 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                                                            title="Edit Order"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteOrder(order._id || order.id)}
                                                            className="p-2 hover:bg-(--accent)/20 rounded text-gray-500 hover:text-(--accent) transition-colors"
                                                            title="Delete Order"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                    </div>

                                    {/* Pagination Controls */}
                                    {orders.length > ordersPerPage && (
                                        <div className="p-4 border-t border-gray-800 flex justify-center gap-2">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded disabled:opacity-50 hover:text-white transition-colors text-xs font-bold"
                                            >
                                                PREV
                                            </button>
                                            <div className="flex items-center gap-2">
                                                {Array.from({ length: Math.min(5, Math.ceil(orders.length / ordersPerPage)) }, (_, i) => {
                                                    // Intelligent pagination logic to show relevant pages
                                                    let pageNum = i + 1;
                                                    const totalPages = Math.ceil(orders.length / ordersPerPage);

                                                    if (totalPages > 5) {
                                                        if (currentPage > 3) {
                                                            pageNum = currentPage - 2 + i;
                                                        }
                                                        if (pageNum > totalPages) {
                                                            pageNum = totalPages - (4 - i);
                                                        }
                                                    }

                                                    return (
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
                                                    );
                                                })}
                                            </div>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(orders.length / ordersPerPage), p + 1))}
                                                disabled={currentPage === Math.ceil(orders.length / ordersPerPage)}
                                                className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded disabled:opacity-50 hover:text-white transition-colors text-xs font-bold"
                                            >
                                                NEXT
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-16 border border-dashed border-gray-800 rounded-lg text-center bg-[#0a0a0a]/50">
                                    <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-800">
                                        <span className="text-2xl text-gray-700">∅</span>
                                    </div>
                                    <h3 className="text-white font-bold tracking-widest mb-2">NO SALES RECORDED</h3>
                                    <p className="text-gray-600 text-sm font-mono">Transactions will appear here once processed.</p>
                                </div>
                            )}
                        </motion.div>
                    )
                }
            </div >
        </div >
    );
}
