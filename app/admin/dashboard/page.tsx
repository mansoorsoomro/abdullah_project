'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Payment, Card, Order, User, ActivityLog, BundleOrder, Offer } from '../../../types';
import { NotificationToast, ConfirmDialog } from '../../components/NotificationToast';
import type { ConfirmState } from '../../components/NotificationToast';
import AdminGridBackground from '../../theme/AdminGridBackground';
import {
    Trash2, Edit, FileText, Key, Shield, UserX,
    ChevronLeft, ChevronRight, Activity, DollarSign,
    Users, CreditCard, ShoppingBag, AlertTriangle,
    CheckCircle, XCircle, Search, MoreHorizontal,
    Plus, Tag, ToggleLeft, ToggleRight, Eye, EyeOff, Save, X
} from 'lucide-react';

export default function AdminDashboard() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState<string | null>(null);
    const [showAddCard, setShowAddCard] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [activeTab, setActiveTab] = useState<'payments' | 'cards' | 'orders' | 'users' | 'bundles' | 'offers' | 'settings'>('payments');
    const [orders, setOrders] = useState<Order[]>([]);
    const [bundleOrders, setBundleOrders] = useState<BundleOrder[]>([]);
    const [adminOffers, setAdminOffers] = useState<Offer[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    // Edit Modal States
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editUserForm, setEditUserForm] = useState<Partial<User>>({});

    // Card Edit State
    const [editingCard, setEditingCard] = useState<Card | null>(null);
    const [editCardForm, setEditCardForm] = useState<Partial<Card>>({});

    // Pagination for Users
    const [usersPage, setUsersPage] = useState(1);
    const usersPerPage = 20;

    // Pagination for Cards
    const [cardsPage, setCardsPage] = useState(1);
    const cardsPerPage = 9;

    // Activity Logs
    const [userLogs, setUserLogs] = useState<ActivityLog[]>([]);
    const [viewingLogsUserId, setViewingLogsUserId] = useState<string | null>(null);
    const ordersPerPage = 40;


    // Pagination for Payments Tab
    const [alertsPage, setAlertsPage] = useState(1);
    const alertsPerPage = 10;
    const [paymentsPage, setPaymentsPage] = useState(1);
    const paymentsPerPage = 40;

    // Notification State
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info'; id?: number } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<ConfirmState | null>(null);

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
        videoLink: '',
        proxy: ''
    });

    // Settings State
    const [appSettings, setAppSettings] = useState({ signupAmount: 2000, minDepositAmount: 7000 });
    const [settingsSaving, setSettingsSaving] = useState(false);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.settings) setAppSettings(data.settings);
        } catch (e) { console.error('Failed to fetch settings', e); }
    };

    useEffect(() => {
        const adminAuth = localStorage.getItem('adminAuth');
        if (!adminAuth) {
            router.push('/admin');
            return;
        }
        fetchPayments();
        fetchCards();
        fetchOrders();
        fetchUsers();
        fetchBundleOrders();
        fetchAdminOffers();
        fetchSettings();
    }, [router]);

    const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
        setNotification({ message, type, id: Date.now() });
        setTimeout(() => setNotification(null), 3000);
    };

    const showConfirm = (cfg: ConfirmState) => setConfirmDialog(cfg);

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

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSettingsSaving(true);
        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appSettings),
            });
            if (response.ok) {
                showNotification('✓ Settings updated successfully!', 'success');
            } else {
                showNotification('Failed to update settings', 'error');
            }
        } catch (error) {
            showNotification('Connection error', 'error');
        } finally {
            setSettingsSaving(false);
        }
    };

    const fetchCards = async () => {
        try {
            const response = await fetch('/api/admin/cards');

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
            const formattedOrders = (data.orders || []).map((o: any) => ({
                ...o,
                id: o._id || o.id
            }));
            setOrders(formattedOrders);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        }
    };

    const fetchBundleOrders = async () => {
        try {
            const response = await fetch('/api/admin/bundle-orders');
            const data = await response.json();
            setBundleOrders(data.bundleOrders || []);
        } catch (error) {
            console.error('Failed to fetch bundle orders:', error);
        }
    };

    // ── Offer CRUD ──────────────────────────────────────────────────────────
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
    const [offerSaving, setOfferSaving] = useState(false);
    const STYLE_NAMES = ['Blue', 'Green', 'Yellow', 'Purple', 'Red', 'Accent'];
    const blankOffer = () => ({
        title: '', description: '', cardCount: 10, discount: 10,
        originalPrice: 0, price: 0, badge: '', isActive: true, styleIndex: 0,
    });
    const [offerForm, setOfferForm] = useState<any>(blankOffer());

    const fetchAdminOffers = async () => {
        try {
            const res = await fetch('/api/admin/offers');
            const data = await res.json();
            setAdminOffers(data.offers || []);
        } catch (e) { console.error(e); }
    };

    const openCreateOffer = () => { setEditingOffer(null); setOfferForm(blankOffer()); setShowOfferModal(true); };
    const openEditOffer = (o: Offer) => { setEditingOffer(o); setOfferForm({ ...o }); setShowOfferModal(true); };

    const handleSaveOffer = async () => {
        setOfferSaving(true);
        try {
            const url = editingOffer ? `/api/admin/offers/${editingOffer._id}` : '/api/admin/offers';
            const method = editingOffer ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(offerForm) });
            const data = await res.json();
            if (res.ok) {
                showNotification(editingOffer ? '✓ Offer updated!' : '✓ Offer created!', 'success');
                setShowOfferModal(false);
                fetchAdminOffers();
            } else { showNotification(data.error || 'Failed', 'error'); }
        } catch { showNotification('Connection error', 'error'); }
        finally { setOfferSaving(false); }
    };

    const handleDeleteOffer = async (id: string) => {
        showConfirm({
            title: 'DELETE OFFER',
            message: 'This offer will be permanently removed and will no longer appear to users. This action cannot be undone.',
            type: 'danger',
            confirmLabel: 'DELETE OFFER',
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/admin/offers/${id}`, { method: 'DELETE' });
                    if (res.ok) { showNotification('✓ Offer deleted', 'success'); fetchAdminOffers(); }
                    else showNotification('Failed to delete', 'error');
                } catch { showNotification('Connection error', 'error'); }
            },
        });
    };

    const handleToggleOffer = async (o: Offer) => {
        try {
            const res = await fetch(`/api/admin/offers/${o._id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !o.isActive }),
            });
            if (res.ok) { fetchAdminOffers(); showNotification(`Offer ${!o.isActive ? 'activated' : 'deactivated'}`, 'success'); }
        } catch { showNotification('Failed to toggle', 'error'); }
    };

    // recalculate price when form values change
    const offerFieldChange = (key: string, val: any) => {
        setOfferForm((prev: any) => {
            const next = { ...prev, [key]: val };
            // Auto-calc discounted price when originalPrice or discount changes
            if (key === 'originalPrice' || key === 'discount') {
                const op = key === 'originalPrice' ? Number(val) : Number(next.originalPrice);
                const dc = key === 'discount' ? Number(val) : Number(next.discount);
                if (op > 0) next.price = parseFloat((op * (1 - dc / 100)).toFixed(2));
            }
            return next;
        });
    };

    const fetchUsers = async () => {
        try {
            console.log('Fetching users...');
            const response = await fetch('/api/admin/users', { cache: 'no-store' });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.error || 'Failed to fetch');
            }

            const data = await response.json();
            console.log('Users fetched:', data);

            // Handle both _id and id
            const formattedUsers = (data.users || []).map((u: any) => ({
                ...u,
                id: u._id || u.id,
                // Ensure status is valid or default to NOT_APPROVED
                status: u.status || 'NOT_APPROVED',
                // Ensure balance is number
                balance: typeof u.balance === 'number' ? u.balance : (parseFloat(u.balance) || 0)
            }));

            setUsers(formattedUsers);
        } catch (error: any) {
            console.error('Failed to fetch users:', error);
            showNotification(`User Sync Failed: ${error.message}`, 'error');
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
                    password: '', ip: '', videoLink: '', proxy: ''
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

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to permanently delete this user? This cannot be undone.')) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                showNotification('✓ User deleted successfully!', 'success');
                fetchUsers();
            } else {
                showNotification('Failed to delete user', 'error');
            }
        } catch (error) {
            showNotification('Delete failed. Check server.', 'error');
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            // Ensure we use _id if id is missing or mapped
            const userId = (editUserForm as any)._id || (editUserForm as any).id;
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editUserForm),
            });

            if (response.ok) {
                showNotification('✓ User updated successfully!', 'success');
                setEditingUser(null);
                fetchUsers();
            } else {
                showNotification('Failed to update user', 'error');
            }
        } catch (error) {
            showNotification('Update failed.', 'error');
        }
    };

    const handleUpdateCard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCard) return;

        try {
            const cardId = (editCardForm as any)._id || (editCardForm as any).id;
            const response = await fetch(`/api/admin/cards/${cardId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editCardForm),
            });

            if (response.ok) {
                showNotification('✓ Card updated successfully!', 'success');
                setEditingCard(null);
                fetchCards();
            } else {
                showNotification('Failed to update card', 'error');
            }
        } catch (error) {
            showNotification('Update failed.', 'error');
        }
    };

    const fetchActivityLogs = async (userId: string) => {
        setViewingLogsUserId(userId);
        setUserLogs([]); // Clear previous
        try {
            const response = await fetch(`/api/admin/activities?userId=${userId}`);
            const data = await response.json();
            if (response.ok) {
                setUserLogs(data.activities || []);
            }
        } catch (error) {
            console.error('Failed to fetch logs', error);
        }
    };

    const handleImpersonateUser = async (user: User) => {
        if (!confirm(`⚠ SECURITY WARNING ⚠\n\nYou are about to login as ${user.username}.\nThis will grant you full access to their account.\n\nProceed?`)) return;

        try {
            // Get user ID properly
            const userId = user.id || (user as any)._id;

            const response = await fetch(`/api/admin/users/${userId}/impersonate`, {
                method: 'POST'
            });
            const data = await response.json();

            if (response.ok && data.success) {
                // Set the session
                localStorage.setItem('user', JSON.stringify(data.user));
                // Open in new tab so admin session stays alive
                window.open('/dashboard', '_blank');
                showNotification(`Logged in as ${user.username} in new tab`, 'success');
            } else {
                showNotification('Impersonation failed', 'error');
            }
        } catch (error) {
            showNotification('Server connection error', 'error');
        }
    };

    // Calculate Dashboard Stats
    const totalRevenue = orders.reduce((sum, order) => sum + (order.price || 0), 0);
    const totalUsers = users.length;
    const activeCards = cards.filter(c => c.forSale).length;

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

    // Helper to mask sensitive strings completely for preview
    const maskStart = (str: string | undefined) => {
        return str || 'N/A';
    };


    const formatCardNumber = (num: string) => {
        if (!num) return 'XXXX XXXX XXXX XXXX';
        const clean = num.replace(/\s+/g, '');
        const matches = clean.match(/.{1,4}/g);
        return matches ? matches.join(' ') : clean;
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

            {/* ── Premium Notification Toast ── */}
            <NotificationToast
                notification={notification}
                onClose={() => setNotification(null)}
                duration={3000}
            />

            {/* ── Themed Confirm Dialog ── */}
            <ConfirmDialog
                state={confirmDialog}
                onClose={() => setConfirmDialog(null)}
            />

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
                                <h1 className="text-lg font-black text-white tracking-widest text-shadow-sm flex items-center gap-2">
                                    SUPER <span className="text-(--accent)">ADMIN</span> <span className="px-1.5 py-0.5 bg-(--accent) text-black text-[10px] rounded font-bold">ROOT</span>
                                </h1>
                                <p className="text-[10px] terminal-text tracking-[0.3em] text-(--accent)/80 font-bold flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    UNRESTRICTED ACCESS
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
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-8 py-3 text-sm font-black tracking-widest transition-all skew-x-[-15deg] border-2 uppercase relative overflow-hidden group ${activeTab === 'users'
                            ? 'bg-(--accent) text-black border-(--accent) shadow-[0_0_20px_var(--accent)] scale-105'
                            : 'bg-black/50 text-gray-500 border-gray-800 hover:border-(--accent) hover:text-(--accent) hover:shadow-[0_0_10px_rgba(255,0,51,0.3)]'
                            }`}
                    >
                        <span className="block skew-x-15 relative z-10">USER MANAGEMENT</span>
                        {activeTab !== 'users' && <div className="absolute inset-0 bg-(--accent)/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('bundles')}
                        className={`px-8 py-3 text-sm font-black tracking-widest transition-all skew-x-[-15deg] border-2 uppercase relative overflow-hidden group ${activeTab === 'bundles'
                            ? 'bg-(--accent) text-black border-(--accent) shadow-[0_0_20px_var(--accent)] scale-105'
                            : 'bg-black/50 text-gray-500 border-gray-800 hover:border-(--accent) hover:text-(--accent) hover:shadow-[0_0_10px_rgba(255,0,51,0.3)]'
                            }`}
                    >
                        <span className="block skew-x-15 relative z-10">BUNDLE ORDERS</span>
                        {activeTab !== 'bundles' && <div className="absolute inset-0 bg-(--accent)/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('offers')}
                        className={`px-8 py-3 text-sm font-black tracking-widest transition-all skew-x-[-15deg] border-2 uppercase relative overflow-hidden group ${activeTab === 'offers'
                            ? 'bg-(--accent) text-black border-(--accent) shadow-[0_0_20px_var(--accent)] scale-105'
                            : 'bg-black/50 text-gray-500 border-gray-800 hover:border-(--accent) hover:text-(--accent) hover:shadow-[0_0_10px_rgba(255,0,51,0.3)]'
                            }`}
                    >
                        <span className="block skew-x-15 relative z-10">OFFERS MANAGER</span>
                        {activeTab !== 'offers' && <div className="absolute inset-0 bg-(--accent)/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-8 py-3 text-sm font-black tracking-widest transition-all skew-x-[-15deg] border-2 uppercase relative overflow-hidden group ${activeTab === 'settings'
                            ? 'bg-(--accent) text-black border-(--accent) shadow-[0_0_20px_var(--accent)] scale-105'
                            : 'bg-black/50 text-gray-500 border-gray-800 hover:border-(--accent) hover:text-(--accent) hover:shadow-[0_0_10px_rgba(255,0,51,0.3)]'
                            }`}
                    >
                        <span className="block skew-x-15 relative z-10">SYST SETTINGS</span>
                        {activeTab !== 'settings' && <div className="absolute inset-0 bg-(--accent)/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>}
                    </button>
                </div>

                {/* Stats Bar - Always Visible */}

                {/* Unified Dashboard Stats Grid - Only on Payments Tab (First Page) */}
                {activeTab === 'payments' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {[
                            {
                                label: 'TOTAL REVENUE',
                                value: `$${totalRevenue.toLocaleString()}`,
                                exactValue: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                                color: 'text-green-500',
                                subValue: 'USDT EARNED',
                                icon: <DollarSign className="w-8 h-8 opacity-50" />
                            },
                            {
                                label: 'TOTAL USERS',
                                value: totalUsers,
                                color: 'text-white',
                                subValue: 'REGISTERED ACCOUNTS',
                                icon: <Users className="w-8 h-8 opacity-50" />
                            },
                            {
                                label: 'ACTIVE ASSETS',
                                value: activeCards,
                                color: 'text-(--accent)',
                                subValue: 'INVENTORY COUNT',
                                icon: <CreditCard className="w-8 h-8 opacity-50" />
                            },
                            {
                                label: 'TOTAL TRAFFIC',
                                value: payments.length,
                                color: 'text-white',
                                subValue: 'ALL PAYMENTS',
                                icon: <Activity className="w-8 h-8 opacity-50" />
                            },
                            {
                                label: 'PENDING REQUESTS',
                                value: pendingPayments.length,
                                color: 'text-(--accent)',
                                animate: true,
                                subValue: 'ACTION REQUIRED',
                                icon: <AlertTriangle className="w-8 h-8 opacity-50" />
                            },
                            {
                                label: 'VERIFIED AGENTS',
                                value: approvedPayments.length,
                                color: 'text-green-500',
                                subValue: 'CLEARED TRANSACTIONS',
                                icon: <CheckCircle className="w-8 h-8 opacity-50" />
                            }
                        ].map((stat, i) => (
                            <div key={i} className="relative bg-[#0a0a0a] p-8 rounded-xl border border-(--border) overflow-hidden group hover:border-(--accent)/50 transition-colors shadow-lg min-h-[180px] flex flex-col justify-between" style={{ padding: '32px' }}>
                                <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-(--accent)/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute -right-4 -bottom-4 text-9xl font-black opacity-[0.03] select-none pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                                    {stat.icon}
                                </div>

                                <div className="relative z-10 w-full">
                                    <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em] mb-4 uppercase flex items-center gap-2">
                                        {stat.icon}
                                        {stat.label}
                                    </p>
                                    <div className="flex items-center w-full">
                                        {/* Revenue card gets ellipsis + tooltip; others render normally */}
                                        {stat.label === 'TOTAL REVENUE' ? (
                                            <div className="relative w-full group/rev">
                                                <p className={`text-3xl lg:text-4xl xl:text-5xl font-black ${stat.color} ${stat.animate ? 'animate-pulse' : ''} text-glow tracking-tighter leading-none truncate w-full`}>
                                                    {stat.value}
                                                </p>
                                                {/* Themed tooltip */}
                                                <div className="
                                                    absolute bottom-full left-0 mb-2 z-50
                                                    pointer-events-none
                                                    opacity-0 group-hover/rev:opacity-100
                                                    translate-y-1 group-hover/rev:translate-y-0
                                                    transition-all duration-200
                                                ">
                                                    <div className="
                                                        relative px-4 py-2.5
                                                        bg-black border border-(--accent)/60
                                                        rounded-lg shadow-[0_0_20px_rgba(255,0,51,0.25)]
                                                        whitespace-nowrap
                                                    ">
                                                        {/* Accent top bar */}
                                                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-(--accent) rounded-t-lg"></div>
                                                        <p className="text-[9px] text-gray-500 font-bold tracking-[0.2em] uppercase mb-1">EXACT AMOUNT</p>
                                                        <p className={`text-lg font-black font-mono ${stat.color} text-glow tracking-tight`}>
                                                            {(stat as any).exactValue || stat.value} <span className="text-[10px] text-gray-500 font-mono">USDT</span>
                                                        </p>
                                                        {/* Arrow — inline style needed so CSS var resolves correctly */}
                                                        <div className="absolute top-full left-6 w-0 h-0"
                                                            style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid rgba(255,0,51,0.5)' }}>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className={`text-3xl lg:text-4xl xl:text-5xl font-black ${stat.color} ${stat.animate ? 'animate-pulse' : ''} text-glow tracking-tighter break-all w-full leading-none`} title={stat.value.toString()}>
                                                {stat.value}
                                            </p>
                                        )}
                                    </div>
                                    {stat.subValue && <p className="text-[10px] text-gray-600 font-mono mt-2 tracking-widest">{stat.subValue}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Payments Tab */}
                {activeTab === 'payments' && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        {/* Stats */}


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
                                                <input type="text" placeholder="Bank Name" value={newCard.bank} onChange={(e) => setNewCard({ ...newCard, bank: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 transition-colors" />
                                                <input type="text" placeholder="Type (Debit/Credit)" value={newCard.type} onChange={(e) => setNewCard({ ...newCard, type: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 transition-colors" />
                                                <input type="text" placeholder="Address" value={newCard.address} onChange={(e) => setNewCard({ ...newCard, address: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 transition-colors" />
                                                <input type="text" placeholder="City" value={newCard.city} onChange={(e) => setNewCard({ ...newCard, city: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 transition-colors" />
                                                <input type="text" placeholder="State" value={newCard.state} onChange={(e) => setNewCard({ ...newCard, state: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 transition-colors" />
                                                <input type="text" placeholder="ZIP" value={newCard.zip} onChange={(e) => setNewCard({ ...newCard, zip: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 transition-colors" />
                                                <input type="text" placeholder="Country" value={newCard.country} onChange={(e) => setNewCard({ ...newCard, country: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 transition-colors" />
                                                <input type="text" placeholder="SSN" value={newCard.ssn} onChange={(e) => setNewCard({ ...newCard, ssn: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 transition-colors" />
                                                <input type="text" placeholder="Proxy (IP:PORT:USER:PASS)" value={newCard.proxy} onChange={(e) => setNewCard({ ...newCard, proxy: e.target.value })} className="cyber-input text-sm bg-black/30 border-white/5 hover:border-white/20 transition-colors" />
                                            </div>

                                        </div>
                                        <div className="flex justify-end mt-10">
                                            <button type="submit" className="px-12 py-5 text-sm font-black tracking-[0.2em] transition-all skew-x-[-15deg] border-2 border-white bg-white text-black hover:bg-(--accent) hover:border-(--accent) hover:text-white shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_var(--accent)] hover:scale-105 active:scale-95 group">
                                                <span className="skew-x-15 flex items-center gap-3">
                                                    PUBLISH TO MARKET <span className="text-xl group-hover:rotate-90 transition-transform">↗</span>
                                                </span>
                                            </button>
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>


                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                                            <div className="relative w-full h-full transition-all duration-700 transform-style-3d group-hover:rotate-y-180">

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
                                                            </div>
                                                        </div>

                                                        {/* Card Number */}
                                                        <div className="mt-2" style={{ padding: '10px' }}>
                                                            <p className="text-xl md:text-2xl font-mono font-bold tracking-widest drop-shadow-md whitespace-nowrap">
                                                                {formatCardNumber(card.cardNumber)}


                                                            </p>
                                                        </div>

                                                        {/* Bottom Info */}
                                                        <div className="flex justify-between items-end mt-2 px-1" style={{ padding: '12px' }}>
                                                            <div>
                                                                <p className="text-[9px] uppercase opacity-75 font-bold mb-0.5">Card Holder</p>
                                                                <p className="font-mono font-bold text-xs tracking-wide uppercase">{maskStart(card.holder)}</p>


                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <p className="text-[9px] uppercase opacity-75 font-bold mb-0.5">Expires</p>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-mono font-bold text-xs tracking-wide">{card.expiry || 'XX/XX'}</p>


                                                                    <h3 className="text-xl font-black italic tracking-tighter leading-none">{card.type || 'VISA'}</h3>

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
                                                                    <span className="font-mono font-bold text-black tracking-widest">{card.cvv || 'XXX'}</span>


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

                                                        {/* Action Buttons Overlay */}
                                                        <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 backdrop-blur-[2px] z-10 p-6">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingCard(card);
                                                                    setEditCardForm(card);
                                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                }}
                                                                className="w-full py-3 bg-white text-black text-xs font-black rounded hover:bg-gray-200 transition-all uppercase tracking-widest flex items-center justify-center gap-2 mb-2"
                                                            >
                                                                <span>✎ EDIT ASSET</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteCard(card.id)}
                                                                className="w-full py-3 bg-red-600 text-white text-xs font-black rounded hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)] uppercase tracking-widest flex items-center justify-center gap-2"
                                                            >
                                                                <span>✕ DELETE</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                        </motion.div>
                                    ))}
                            </div>

                            {/* Cards Pagination Controls */}
                            {cards.length > cardsPerPage && (
                                <div className="p-4 border-t border-gray-800 flex justify-center gap-2 mt-8">
                                    <button
                                        onClick={() => setCardsPage(p => Math.max(1, p - 1))}
                                        disabled={cardsPage === 1}
                                        className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded disabled:opacity-50 hover:text-white transition-colors text-xs font-bold"
                                    >
                                        PREV
                                    </button>
                                    <div className="flex items-center gap-2">
                                        {Array.from({ length: Math.ceil(cards.length / cardsPerPage) }, (_, i) => i + 1)
                                            .slice(Math.max(0, cardsPage - 3), Math.min(Math.ceil(cards.length / cardsPerPage), cardsPage + 2))
                                            .map(pageNum => (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCardsPage(pageNum)}
                                                    className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-colors ${cardsPage === pageNum
                                                        ? 'bg-(--accent) text-black'
                                                        : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            ))}
                                    </div>
                                    <button
                                        onClick={() => setCardsPage(p => Math.min(Math.ceil(cards.length / cardsPerPage), p + 1))}
                                        disabled={cardsPage === Math.ceil(cards.length / cardsPerPage)}
                                        className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded disabled:opacity-50 hover:text-white transition-colors text-xs font-bold"
                                    >
                                        NEXT
                                    </button>
                                </div>
                            )}

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
                                    <div className="grid grid-cols-5 p-4 bg-[#0f0f0f] border-b border-gray-800 text-[10px] text-gray-400 tracking-wider font-black uppercase whitespace-nowrap">
                                        <div className="col-span-2">ITEM SOLD</div>
                                        <div className="text-center">PRICE</div>
                                        <div className="text-center">BUYER ID</div>
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


                {/* Users Tab */}
                {
                    activeTab === 'users' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            {/* Edit User Modal */}
                            <AnimatePresence>
                                {editingUser && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-[#0f0f0f] border border-gray-800 p-8 rounded-xl w-full max-w-md shadow-2xl relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1 bg-(--accent)"></div>
                                            <h3 className="text-xl font-black text-white mb-6 tracking-widest flex items-center gap-3">
                                                <span className="text-(--accent)">EDIT</span> USER
                                            </h3>

                                            <form onSubmit={handleUpdateUser} className="space-y-4">
                                                <div>
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1">Username</label>
                                                    <input
                                                        type="text"
                                                        value={editUserForm.username || ''}
                                                        onChange={(e) => setEditUserForm({ ...editUserForm, username: e.target.value })}
                                                        className="w-full bg-black/50 border border-gray-800 rounded p-3 text-white focus:border-(--accent) focus:outline-none transition-colors text-sm font-bold"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1">Email</label>
                                                    <input
                                                        type="email"
                                                        value={editUserForm.email || ''}
                                                        onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                                                        className="w-full bg-black/50 border border-gray-800 rounded p-3 text-white focus:border-(--accent) focus:outline-none transition-colors text-sm font-bold"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1">Status</label>
                                                    <select
                                                        value={editUserForm.status || 'NOT_APPROVED'}
                                                        onChange={(e) => setEditUserForm({ ...editUserForm, status: e.target.value as any })}
                                                        className="w-full bg-black/50 border border-gray-800 rounded p-3 text-white focus:border-(--accent) focus:outline-none transition-colors text-sm font-bold"
                                                    >
                                                        <option value="NOT_APPROVED">NOT APPROVED</option>
                                                        <option value="APPROVED">APPROVED</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1">Balance</label>
                                                    <input
                                                        type="number"
                                                        value={editUserForm.balance || 0}
                                                        onChange={(e) => setEditUserForm({ ...editUserForm, balance: parseFloat(e.target.value) })}
                                                        className="w-full bg-black/50 border border-gray-800 rounded p-3 text-white focus:border-(--accent) focus:outline-none transition-colors text-sm font-bold"
                                                    />
                                                </div>

                                                <div className="flex gap-3 pt-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingUser(null)}
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

                            {/* Activity Logs Modal */}
                            <AnimatePresence>
                                {viewingLogsUserId && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-[#0f0f0f] border border-gray-800 p-8 rounded-xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]"
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-xl font-black text-white tracking-widest flex items-center gap-3">
                                                    <span className="text-blue-500">ACTIVITY</span> LOGS
                                                </h3>
                                                <button onClick={() => setViewingLogsUserId(null)} className="text-gray-500 hover:text-white">✕</button>
                                            </div>

                                            <div className="overflow-y-auto flex-1 pr-2 space-y-2">
                                                {userLogs.length > 0 ? (
                                                    userLogs.map((log) => (
                                                        <div key={log._id} className="bg-black/40 p-3 rounded border border-white/5 text-xs font-mono">
                                                            <div className="flex justify-between text-gray-500 mb-1">
                                                                <span className="text-blue-400 font-bold">{log.action}</span>
                                                                <span>{new Date(log.createdAt).toLocaleString()}</span>
                                                            </div>
                                                            <p className="text-gray-300">{log.details}</p>
                                                            <div className="mt-1 flex gap-4 text-[10px] text-gray-600">
                                                                <span>IP: {log.ip}</span>
                                                                <span>UA: {log.userAgent?.substring(0, 30)}...</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-10 text-gray-500 font-mono">NO ACTIVITY RECORDED</div>
                                                )}
                                            </div>
                                        </motion.div>
                                    </div>
                                )}
                            </AnimatePresence>

                            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-800">
                                <h2 className="text-2xl font-black tracking-widest text-white">
                                    USER MANAGEMENT <span className="text-(--accent) text-lg align-top ml-2">({users.length})</span>
                                </h2>
                            </div>

                            <div className="bg-[#0a0a0a]/80 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden shadow-2xl relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>

                                {/* Enhanced User Table Header */}
                                <div className="grid grid-cols-12 p-6 bg-[#0f0f0f] border-b border-gray-800 text-[10px] text-gray-400 tracking-wider font-black uppercase whitespace-nowrap gap-4">
                                    <div className="col-span-1">ID</div>
                                    <div className="col-span-4">USER DETAILS</div>
                                    <div className="col-span-2 text-center">STATUS</div>
                                    <div className="col-span-2 text-center">BALANCE</div>
                                    <div className="col-span-3 text-right">ACTIONS</div>
                                </div>

                                <div className="divide-y divide-white/5">
                                    {users.length > 0 ? (
                                        users
                                            .slice((usersPage - 1) * usersPerPage, usersPage * usersPerPage)
                                            .map((user, index) => (
                                                <motion.div
                                                    key={user.id || (user as any)._id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    className="grid grid-cols-12 p-6 hover:bg-[#111] transition-all duration-300 items-center group relative overflow-hidden gap-4"
                                                >
                                                    <div className="col-span-1 font-mono text-[10px] text-gray-600 truncate pr-2">{(user.id || (user as any)._id || '').substring(0, 8)}...</div>

                                                    <div className="col-span-4 pr-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-400">
                                                                <Users size={14} />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">{user.username}</div>
                                                                <div className="text-xs text-gray-500 font-mono">{user.email}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="col-span-2 text-center">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${user.status === 'APPROVED'
                                                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                            }`}>
                                                            {user.status === 'APPROVED' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                                            {user.status}
                                                        </span>
                                                    </div>

                                                    <div className="col-span-2 text-center">
                                                        <div className="font-mono text-sm text-gray-300 bg-black/30 py-1 px-2 rounded inline-block">
                                                            ${(user.balance || 0).toLocaleString()}
                                                        </div>
                                                    </div>

                                                    <div className="col-span-3 text-right flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => fetchActivityLogs(user.id || (user as any)._id)}
                                                            className="p-2.5 bg-blue-500/5 hover:bg-blue-500/20 rounded-lg text-gray-400 hover:text-blue-400 transition-all border border-transparent hover:border-blue-500/30 group/btn"
                                                            title="View Activity Logs"
                                                        >
                                                            <FileText size={16} className="group-hover/btn:scale-110 transition-transform" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleImpersonateUser(user)}
                                                            className="p-2.5 bg-green-500/5 hover:bg-green-500/20 rounded-lg text-gray-400 hover:text-green-400 transition-all border border-transparent hover:border-green-500/30 group/btn"
                                                            title="Login as User"
                                                        >
                                                            <Key size={16} className="group-hover/btn:scale-110 transition-transform" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingUser(user);
                                                                setEditUserForm(user);
                                                            }}
                                                            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all border border-transparent hover:border-white/20 group/btn"
                                                            title="Edit User"
                                                        >
                                                            <Edit size={16} className="group-hover/btn:scale-110 transition-transform" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id || (user as any)._id)}
                                                            className="p-2.5 bg-red-500/5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-all border border-transparent hover:border-red-500/30 group/btn"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))
                                    ) : (
                                        <div className="p-12 text-center text-gray-500 font-mono tracking-widest flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center">
                                                <UserX size={32} />
                                            </div>
                                            NO USERS FOUND
                                        </div>
                                    )}
                                </div>

                                {/* Pagination */}
                                {users.length > usersPerPage && (
                                    <div className="p-6 border-t border-gray-800 flex justify-center items-center gap-3 bg-[#0f0f0f]">
                                        <button
                                            onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                                            disabled={usersPage === 1}
                                            className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded-lg disabled:opacity-50 hover:text-white hover:bg-gray-800 transition-all text-xs font-bold flex items-center gap-2"
                                        >
                                            <ChevronLeft size={14} /> PREV
                                        </button>

                                        <div className="flex items-center gap-2">
                                            {Array.from({ length: Math.ceil(users.length / usersPerPage) }, (_, i) => i + 1)
                                                .slice(Math.max(0, usersPage - 3), Math.min(Math.ceil(users.length / usersPerPage), usersPage + 2))
                                                .map(pageNum => (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setUsersPage(pageNum)}
                                                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all border ${usersPage === pageNum
                                                            ? 'bg-(--accent) text-black border-(--accent) shadow-[0_0_10px_var(--accent)]'
                                                            : 'bg-[#1a1a1a] text-gray-400 border-gray-800 hover:border-gray-600 hover:text-white'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                ))}
                                        </div>

                                        <button
                                            onClick={() => setUsersPage(p => Math.min(Math.ceil(users.length / usersPerPage), p + 1))}
                                            disabled={usersPage === Math.ceil(users.length / usersPerPage)}
                                            className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded-lg disabled:opacity-50 hover:text-white hover:bg-gray-800 transition-all text-xs font-bold flex items-center gap-2"
                                        >
                                            NEXT <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )
                }

                {/* ── BUNDLE ORDERS TAB ── */}
                {activeTab === 'bundles' && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-widest mb-1">BUNDLE ORDERS</h2>
                                <p className="text-xs text-gray-500 font-mono tracking-widest">{bundleOrders.length} TOTAL BUNDLE PURCHASES</p>
                            </div>
                            <div className="px-6 py-3 bg-black border border-(--accent)/30 rounded">
                                <span className="text-xs font-bold text-(--accent) tracking-widest">
                                    TOTAL REVENUE: ${bundleOrders.reduce((s, b) => s + b.price, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
                                </span>
                            </div>
                        </div>

                        {bundleOrders.length === 0 ? (
                            <div className="p-16 text-center text-gray-500 font-mono tracking-widest border border-dashed border-gray-800 rounded-xl">
                                <ShoppingBag size={40} className="mx-auto mb-4 opacity-30" />
                                NO BUNDLE ORDERS YET
                            </div>
                        ) : (
                            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-800 bg-black/50">
                                            {['USER', 'BUNDLE', 'CARDS', 'DISCOUNT', 'ORIGINAL', 'PAID', 'DATE'].map(h => (
                                                <th key={h} className="px-5 py-4 text-left text-[10px] font-black tracking-[0.2em] text-gray-500">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-900">
                                        {bundleOrders.map((bo, index) => (
                                            <motion.tr
                                                key={bo._id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: index * 0.03 }}
                                                className="group hover:bg-white/2 transition-colors"
                                            >
                                                <td className="px-5 py-4">
                                                    <span className="text-xs font-bold text-white font-mono">{bo.username}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="text-xs text-(--accent) font-black italic">{bo.bundleTitle}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="px-2 py-0.5 bg-(--accent)/10 border border-(--accent)/20 rounded text-[10px] font-black text-(--accent)">
                                                        {bo.cardCount} CARDS
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="text-xs font-bold text-green-400">{bo.discount}% OFF</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="text-xs text-gray-500 line-through font-mono">
                                                        ${bo.originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="text-sm font-black text-white font-mono">
                                                        ${bo.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <span className="text-[9px] text-gray-600 ml-1 font-mono">USDT</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="text-[10px] text-gray-500 font-mono">
                                                        {new Date(bo.purchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── OFFERS MANAGER TAB ── */}
                {activeTab === 'offers' && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>

                        {/* Header */}
                        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-widest mb-1">OFFERS MANAGER</h2>
                                <p className="text-xs text-gray-500 font-mono tracking-widest">{adminOffers.length} OFFERS — {adminOffers.filter(o => o.isActive).length} ACTIVE</p>
                            </div>
                            <button
                                onClick={openCreateOffer}
                                className="flex items-center gap-2 px-6 py-3 bg-(--accent) text-black font-black text-xs tracking-widest rounded hover:bg-white transition-all"
                            >
                                <Plus className="w-4 h-4" /> CREATE OFFER
                            </button>
                        </div>

                        {/* Offers Grid */}
                        {adminOffers.length === 0 ? (
                            <div className="p-16 text-center border border-dashed border-gray-800 rounded-xl">
                                <Tag size={40} className="mx-auto mb-4 text-gray-700" />
                                <p className="text-gray-500 font-mono text-sm tracking-widest">NO OFFERS CREATED YET</p>
                                <p className="text-gray-700 text-xs font-mono mt-1">Click "CREATE OFFER" to add your first bundle offer</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {adminOffers.map((offer, index) => {
                                    const COLORS = [
                                        { border: 'border-blue-500/40', text: 'text-blue-400', bg: 'bg-blue-500/10' },
                                        { border: 'border-green-500/40', text: 'text-green-400', bg: 'bg-green-500/10' },
                                        { border: 'border-yellow-500/40', text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                                        { border: 'border-purple-500/40', text: 'text-purple-400', bg: 'bg-purple-500/10' },
                                        { border: 'border-red-500/40', text: 'text-red-400', bg: 'bg-red-500/10' },
                                        { border: 'border-(--accent)/40', text: 'text-(--accent)', bg: 'bg-(--accent)/10' },
                                    ];
                                    const c = COLORS[offer.styleIndex % 6];
                                    return (
                                        <motion.div key={offer._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
                                            className={`relative bg-[#0a0a0a] border ${c.border} rounded-xl overflow-hidden ${!offer.isActive ? 'opacity-50 grayscale' : ''}`}>
                                            {/* Active badge */}
                                            <div className={`h-1 w-full ${offer.isActive ? 'bg-(--accent)' : 'bg-gray-700'}`}></div>

                                            <div className="p-6">
                                                {/* Top row */}
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className={`text-lg font-black italic ${c.text}`}>{offer.title}</h3>
                                                        <p className="text-[10px] text-gray-600 font-mono mt-0.5">{offer.cardCount} CARDS · {offer.discount}% OFF</p>
                                                    </div>
                                                    {offer.badge && (
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest border ${c.border} ${c.text} ${c.bg}`}>{offer.badge}</span>
                                                    )}
                                                </div>

                                                <p className="text-xs text-gray-500 font-mono mb-4 line-clamp-2">{offer.description || '—'}</p>

                                                {/* Price row */}
                                                <div className="flex justify-between items-end mb-5 pb-4 border-b border-gray-900">
                                                    <div>
                                                        <span className="text-[10px] text-gray-600 line-through font-mono block">${offer.originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                        <span className="text-xl font-black text-white">${offer.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}<span className="text-xs text-gray-500 ml-1 font-mono">USDT</span></span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[9px] text-gray-600 block uppercase tracking-widest">Per Card</span>
                                                        <span className={`text-sm font-black font-mono ${c.text}`}>${offer.avgPricePerCard.toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                {/* Action row */}
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleToggleOffer(offer)}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-[10px] font-black tracking-wider transition-all ${offer.isActive ? 'border-green-700 text-green-400 hover:bg-green-900/20' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}>
                                                        {offer.isActive ? <><Eye className="w-3 h-3" />LIVE</> : <><EyeOff className="w-3 h-3" />HIDDEN</>}
                                                    </button>
                                                    <div className="flex-1"></div>
                                                    <button onClick={() => openEditOffer(offer)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-gray-700 text-gray-300 hover:border-white hover:text-white rounded text-[10px] font-black tracking-wider transition-all">
                                                        <Edit className="w-3 h-3" /> EDIT
                                                    </button>
                                                    <button onClick={() => handleDeleteOffer(offer._id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/10 border border-red-800/40 text-red-500 hover:bg-red-900/30 rounded text-[10px] font-black tracking-wider transition-all">
                                                        <Trash2 className="w-3 h-3" /> DEL
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}
            </div >

            {/* ══════════ OFFER CREATE / EDIT MODAL ══════════ */}
            <AnimatePresence>
                {showOfferModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-9999 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => { if (!offerSaving) setShowOfferModal(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.92, y: 24, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.92, y: 24, opacity: 0 }}
                            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                            onClick={e => e.stopPropagation()}
                            className="relative bg-[#0a0a0a] border border-(--accent)/70 rounded-2xl w-full max-w-2xl shadow-[0_0_80px_rgba(255,0,51,0.18)] overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            {/* Accent top bar */}
                            <div className="h-[2px] w-full bg-linear-to-r from-transparent via-[--accent] to-transparent shrink-0" />
                            {/* Glow orb */}
                            <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-20" style={{ background: 'var(--accent)' }} />

                            {/* ── Modal Header ── */}
                            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-800/80 bg-black/50 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-(--accent)/10 border border-(--accent)/30 rounded-xl">
                                        <Tag className="w-6 h-6 text-(--accent)" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white tracking-widest uppercase">
                                            {editingOffer ? 'EDIT OFFER' : 'CREATE OFFER'}
                                        </h2>
                                        <p className="text-[10px] text-gray-500 font-mono tracking-widest mt-0.5">
                                            {editingOffer ? `ID: ${editingOffer._id.slice(0, 16)}…` : 'Define a new bundle offer for users'}
                                        </p>
                                    </div>
                                </div>
                                {!offerSaving && (
                                    <button
                                        onClick={() => setShowOfferModal(false)}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-700 text-gray-500 hover:text-white hover:border-gray-500 transition-all"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* ── Modal Body (scrollable) ── */}
                            <div className="overflow-y-auto flex-1 p-8 space-y-6">

                                {/* Title + Badge */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-gray-400 font-black tracking-[0.2em] uppercase block">
                                            Offer Title <span className="text-(--accent)">*</span>
                                        </label>
                                        <input
                                            value={offerForm.title}
                                            onChange={e => offerFieldChange('title', e.target.value)}
                                            placeholder="e.g. GOD MODE VAULT"
                                            className="w-full bg-[#0d0d0d] border border-gray-700 hover:border-gray-600 focus:border-(--accent) text-white font-mono text-sm px-4 py-3.5 rounded-xl outline-none transition-colors placeholder-gray-700"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-gray-400 font-black tracking-[0.2em] uppercase block">
                                            Badge Label <span className="text-gray-600 font-normal normal-case tracking-normal">optional</span>
                                        </label>
                                        <input
                                            value={offerForm.badge}
                                            onChange={e => offerFieldChange('badge', e.target.value)}
                                            placeholder="e.g. BEST VALUE"
                                            className="w-full bg-[#0d0d0d] border border-gray-700 hover:border-gray-600 focus:border-yellow-500 text-white font-mono text-sm px-4 py-3.5 rounded-xl outline-none transition-colors placeholder-gray-700"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-400 font-black tracking-[0.2em] uppercase block">
                                        Description
                                    </label>
                                    <textarea
                                        value={offerForm.description}
                                        onChange={e => offerFieldChange('description', e.target.value)}
                                        rows={2}
                                        placeholder="Short description shown on offer card to users..."
                                        className="w-full bg-[#0d0d0d] border border-gray-700 hover:border-gray-600 focus:border-(--accent) text-white font-mono text-sm px-4 py-3.5 rounded-xl outline-none transition-colors resize-none placeholder-gray-700"
                                    />
                                </div>

                                {/* Divider */}
                                <div className="border-t border-gray-800/60" />

                                {/* Card Count + Discount */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-gray-400 font-black tracking-[0.2em] uppercase block">
                                            Card Count <span className="text-(--accent)">*</span>
                                        </label>
                                        <input
                                            type="number" min={1}
                                            value={offerForm.cardCount}
                                            onChange={e => offerFieldChange('cardCount', e.target.value)}
                                            className="w-full bg-[#0d0d0d] border border-gray-700 hover:border-gray-600 focus:border-(--accent) text-white font-mono text-sm px-4 py-3.5 rounded-xl outline-none transition-colors"
                                        />
                                        <p className="text-[9px] text-gray-600 font-mono">Number of cards in this bundle</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-gray-400 font-black tracking-[0.2em] uppercase block">
                                            Discount % <span className="text-(--accent)">*</span>
                                        </label>
                                        <input
                                            type="number" min={0} max={99}
                                            value={offerForm.discount}
                                            onChange={e => offerFieldChange('discount', e.target.value)}
                                            className="w-full bg-[#0d0d0d] border border-gray-700 hover:border-gray-600 focus:border-green-500 text-white font-mono text-sm px-4 py-3.5 rounded-xl outline-none transition-colors"
                                        />
                                        <p className="text-[9px] text-gray-600 font-mono">Auto-calculates final price from original</p>
                                    </div>
                                </div>

                                {/* Prices */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-gray-400 font-black tracking-[0.2em] uppercase block">
                                            Original Price <span className="text-gray-600 text-[9px] font-mono normal-case tracking-normal">USDT</span>
                                            <span className="text-(--accent) ml-1">*</span>
                                        </label>
                                        <input
                                            type="number" min={0}
                                            value={offerForm.originalPrice}
                                            onChange={e => offerFieldChange('originalPrice', e.target.value)}
                                            className="w-full bg-[#0d0d0d] border border-gray-700 hover:border-gray-600 focus:border-(--accent) text-white font-mono text-sm px-4 py-3.5 rounded-xl outline-none transition-colors"
                                        />
                                        <p className="text-[9px] text-gray-600 font-mono">Strike-through price shown to users</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-gray-400 font-black tracking-[0.2em] uppercase block">
                                            Final Price <span className="text-gray-600 text-[9px] font-mono normal-case tracking-normal">USDT</span>
                                            <span className="text-(--accent) ml-1">*</span>
                                        </label>
                                        <input
                                            type="number" min={0}
                                            value={offerForm.price}
                                            onChange={e => offerFieldChange('price', e.target.value)}
                                            className="w-full bg-[#0d0d0d] border border-(--accent)/40 hover:border-(--accent)/60 focus:border-(--accent) text-(--accent) font-black font-mono text-sm px-4 py-3.5 rounded-xl outline-none transition-colors"
                                        />
                                        <p className="text-[9px] text-gray-600 font-mono">
                                            Per card = ${offerForm.price && offerForm.cardCount ? (offerForm.price / offerForm.cardCount).toFixed(2) : '0.00'} USDT
                                        </p>
                                    </div>
                                </div>

                                {/* Style + Visibility */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-3">
                                        <label className="text-[10px] text-gray-400 font-black tracking-[0.2em] uppercase block">
                                            Colour Theme
                                        </label>
                                        <div className="flex gap-3 flex-wrap">
                                            {['blue', 'green', 'yellow', 'purple', 'red', 'accent'].map((col, i) => (
                                                <button
                                                    key={col} type="button"
                                                    onClick={() => offerFieldChange('styleIndex', i)}
                                                    title={STYLE_NAMES[i]}
                                                    className={`w-9 h-9 rounded-lg border-2 transition-all ${offerForm.styleIndex === i ? 'border-white scale-110 shadow-lg' : 'border-gray-800 opacity-50 hover:opacity-80'}`}
                                                    style={{ background: ['#1d4ed8', '#15803d', '#a16207', '#7c3aed', '#dc2626', 'var(--accent)'][i] }}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-[9px] text-gray-600 font-mono">Selected: {STYLE_NAMES[offerForm.styleIndex ?? 0]}</p>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] text-gray-400 font-black tracking-[0.2em] uppercase block">
                                            Visibility
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => offerFieldChange('isActive', !offerForm.isActive)}
                                            className={`flex items-center gap-3 px-5 py-3.5 border rounded-xl text-xs font-black tracking-widest transition-all w-full ${offerForm.isActive
                                                ? 'border-green-600/60 text-green-400 bg-green-900/10 hover:bg-green-900/20'
                                                : 'border-gray-700 text-gray-500 bg-gray-900/20 hover:border-gray-600'
                                                }`}
                                        >
                                            {offerForm.isActive
                                                ? <><ToggleRight className="w-5 h-5 text-green-400" /> ACTIVE — VISIBLE</>
                                                : <><ToggleLeft className="w-5 h-5 text-gray-600" /> INACTIVE — HIDDEN</>
                                            }
                                        </button>
                                        <p className="text-[9px] text-gray-600 font-mono">
                                            {offerForm.isActive ? 'Users can see and purchase this offer' : 'Offer hidden from users'}
                                        </p>
                                    </div>
                                </div>

                                {/* Live Preview */}
                                {offerForm.title && offerForm.price > 0 && (
                                    <div className="rounded-xl border border-gray-800 overflow-hidden">
                                        <div className="px-5 py-2.5 bg-gray-900/40 border-b border-gray-800">
                                            <p className="text-[9px] text-gray-500 font-bold tracking-[0.18em] uppercase">
                                                Live Preview — as users will see
                                            </p>
                                        </div>
                                        <div className="p-5 bg-black/40 flex justify-between items-center gap-4">
                                            <div>
                                                <p className="text-base font-black italic text-white mb-0.5">{offerForm.title}</p>
                                                <p className="text-[10px] text-gray-500 font-mono">
                                                    {offerForm.cardCount} CARDS · {offerForm.discount}% OFF
                                                    {offerForm.badge && <span className="ml-2 px-1.5 py-0.5 bg-yellow-900/30 border border-yellow-700/40 text-yellow-400 rounded text-[8px] font-black">{offerForm.badge}</span>}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs text-gray-600 line-through font-mono">${Number(offerForm.originalPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                                <p className="text-xl font-black text-(--accent)">${Number(offerForm.price).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs text-gray-500 font-mono">USDT</span></p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Modal Footer ── */}
                            <div className="flex gap-3 px-8 py-5 border-t border-gray-800/80 bg-black/50 shrink-0">
                                <button
                                    onClick={() => setShowOfferModal(false)}
                                    disabled={offerSaving}
                                    className="flex-1 py-3.5 border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white rounded-xl font-black text-xs tracking-widest transition-all disabled:opacity-40"
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={handleSaveOffer}
                                    disabled={offerSaving || !offerForm.title || !offerForm.price}
                                    className="flex-1 py-3.5 bg-(--accent) hover:bg-white text-black font-black text-xs tracking-widest rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,0,51,0.3)] hover:shadow-none"
                                >
                                    {offerSaving
                                        ? <><span className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full inline-block" /> SAVING...</>
                                        : <><Save className="w-4 h-4" />{editingOffer ? 'SAVE CHANGES' : 'CREATE OFFER'}</>
                                    }
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* App Settings Tab */}
            {
                activeTab === 'settings' && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-[#0f0f0f] border border-gray-800 p-8 rounded-xl w-full max-w-2xl shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-(--accent)"></div>
                        <h3 className="text-xl font-black text-white mb-6 tracking-widest flex items-center gap-3">
                            <span className="text-(--accent)">SYSTEM</span> INTERNAL SETTINGS
                        </h3>

                        <form onSubmit={handleSaveSettings} className="space-y-6">
                            <div>
                                <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-2">Account Creation Fee (USDT)</label>
                                <input
                                    type="number"
                                    value={appSettings.signupAmount}
                                    onChange={(e) => setAppSettings({ ...appSettings, signupAmount: parseFloat(e.target.value) })}
                                    className="w-full bg-black/50 border border-gray-800 rounded p-3 text-white focus:border-(--accent) focus:outline-none transition-colors text-sm font-bold"
                                    required
                                />
                                <p className="text-[10px] text-gray-600 font-mono mt-1">This is the amount seen on the Access Protocol page.</p>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-2">Minimum Deposit Amount (USDT)</label>
                                <input
                                    type="number"
                                    value={appSettings.minDepositAmount}
                                    onChange={(e) => setAppSettings({ ...appSettings, minDepositAmount: parseFloat(e.target.value) })}
                                    className="w-full bg-black/50 border border-gray-800 rounded p-3 text-white focus:border-(--accent) focus:outline-none transition-colors text-sm font-bold"
                                    required
                                />
                                <p className="text-[10px] text-gray-600 font-mono mt-1">This is the minimum deposit accepted in the Dashboard deposit form.</p>
                            </div>
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={settingsSaving}
                                    className="w-full py-3 text-xs font-bold tracking-widest bg-(--accent) text-black hover:bg-white transition-colors rounded shadow-[0_0_15px_rgba(220,38,38,0.3)] flex justify-center items-center"
                                >
                                    {settingsSaving ? 'SAVING...' : 'SAVE SETTINGS'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )
            }

        </div >
    );
}
