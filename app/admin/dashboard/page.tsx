'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Payment, Card, Order, User, ActivityLog, BundleOrder, Offer } from '../../../types';
import { type NotifState, type ConfirmState } from '../../components/NotificationToast';
import AdminGridBackground from '../../theme/AdminGridBackground';
import {
    Trash2, Edit, Key, UserX,
    Activity, DollarSign,
    Users, CreditCard, ShoppingCart, AlertTriangle,
    CheckCircle, Search, X
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


    // Pagination for Cards
    const [cardsPage] = useState(1);
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

    const [userSearch, setUserSearch] = useState('');

    // Notification State
    const [notification, setNotification] = useState<NotifState | null>(null);
    const [, setConfirmDialog] = useState<ConfirmState | null>(null);

    const router = useRouter();

    // Edit Order State
    // Order Edit State — use a flexible map since fields come from API
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [editOrderForm, setEditOrderForm] = useState<Order>({} as Order);

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

    // Offers State
    const [showAddOffer, setShowAddOffer] = useState(false);
    const [newOffer, setNewOffer] = useState({
        title: '',
        description: '',
        cardCount: '',
        discount: '',
        originalPrice: '',
        price: '',
        badge: '',
        isActive: true,
        styleIndex: 0
    });

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        } catch {
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
            const formattedOrders = (data.orders || []).map((o: Record<string, unknown>) => ({
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
    const [, setShowOfferModal] = useState(false);
    const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
    const [, setOfferSaving] = useState(false);
    const blankOffer = () => ({
        title: '', description: '', cardCount: 10, discount: 10,
        originalPrice: 0, price: 0, badge: '', isActive: true, styleIndex: 0,
    });
    const [offerForm, setOfferForm] = useState<Record<string, unknown>>(blankOffer());

    const fetchAdminOffers = async () => {
        try {
            const res = await fetch('/api/admin/offers');
            const data = await res.json();
            setAdminOffers(data.offers || []);
        } catch (e) { console.error(e); }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const openCreateOffer = () => { setEditingOffer(null); setOfferForm(blankOffer()); setShowOfferModal(true); };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const openEditOffer = (o: Offer) => { setEditingOffer(o); setOfferForm({ ...o as unknown as Record<string, unknown> }); setShowOfferModal(true); };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/admin/offers/${id}`, { method: 'DELETE' });
                    if (res.ok) { showNotification('✓ Offer deleted', 'success'); fetchAdminOffers(); }
                    else showNotification('Failed to delete', 'error');
                } catch { showNotification('Connection error', 'error'); }
            },
        });
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const offerFieldChange = (key: string, val: unknown) => {
        setOfferForm((prev: Record<string, unknown>) => {
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
            const formattedUsers = (data.users || []).map((u: Record<string, unknown>) => ({
                ...u,
                id: u._id || u.id,
                // Ensure status is valid or default to NOT_APPROVED
                status: u.status || 'NOT_APPROVED',
                // Ensure balance is number
                balance: typeof u.balance === 'number' ? u.balance : (parseFloat(u.balance as string) || 0)
            }));

            setUsers(formattedUsers);
        } catch (error: unknown) {
            console.error('Failed to fetch users:', error);
            showNotification(`User Sync Failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }
    };

    const handleAddOffer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/admin/offers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newOffer),
            });
            if (response.ok) {
                showNotification('✓ Offer created successfully!', 'success');
                setShowAddOffer(false);
                setNewOffer({
                    title: '', description: '', cardCount: '', discount: '',
                    originalPrice: '', price: '', badge: '', isActive: true, styleIndex: 0
                });
                fetchAdminOffers();
            }
        } catch {
            showNotification('Failed to create offer', 'error');
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
        } catch {
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
        } catch {
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
        } catch {
            showNotification('Failed to add card. Check backend connection.', 'error');
        }
    };

    const handleDeleteCard = async (cardId: string) => {
        showConfirm({
            title: 'DELETE ASSET',
            message: 'Are you sure you want to delete this card? This action cannot be undone.',
            onConfirm: async () => {
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
                } catch {
                    showNotification('Failed to delete card. Check backend connection.', 'error');
                }
            }
        });
    };

    const handleDeleteOrder = async (orderId: string) => {
        showConfirm({
            title: 'DELETE ORDER',
            message: 'Are you sure you want to delete this sales record?',
            onConfirm: async () => {
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
                } catch {
                    showNotification('Failed to delete order. Check backend connection.', 'error');
                }
            }
        });
    };

    const handleUpdateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editOrderForm) return;

        try {
            const orderId = editOrderForm._id || editOrderForm.id;
            const response = await fetch(`/api/admin/orders/${orderId}`, {
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
        } catch {
            showNotification('Failed to update order', 'error');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        showConfirm({
            title: 'DELETE USER',
            message: 'Are you sure you want to permanently delete this user? This cannot be undone.',
            onConfirm: async () => {
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
                } catch {
                    showNotification('Delete failed. Check server.', 'error');
                }
            }
        });
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            // Ensure we use _id if id is missing or mapped
            const userId = (editUserForm as unknown as { _id?: string; id?: string })._id || (editUserForm as unknown as { _id?: string; id?: string }).id;
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
        } catch {
            showNotification('Update failed.', 'error');
        }
    };

    const handleUpdateCard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCard) return;

        try {
            const cardId = (editCardForm as unknown as { _id?: string; id?: string })._id || (editCardForm as unknown as { _id?: string; id?: string }).id;
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
        } catch {
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
        showConfirm({
            title: 'SECURITY WARNING',
            message: `You are about to login as ${user.username}. This will grant you full access to their account. Proceed?`,
            onConfirm: async () => {
                try {
                    const userId = user.id || (user as unknown as { _id: string })._id;
                    const response = await fetch(`/api/admin/users/${userId}/impersonate`, {
                        method: 'POST'
                    });
                    const data = await response.json();

                    if (response.ok && data.success) {
                        // Normalize: ensure `id` is always set so dashboard works
                        const normalizedUser = {
                            ...data.user,
                            id: data.user.id || data.user._id?.toString(),
                        };
                        localStorage.setItem('user', JSON.stringify(normalizedUser));
                        showNotification(`Opening dashboard as ${user.username}...`, 'success');
                        // Small delay so notification shows before tab opens
                        setTimeout(() => window.open('/dashboard', '_blank'), 400);
                    } else {
                        showNotification(data.error || 'Impersonation failed', 'error');
                    }
                } catch {
                    showNotification('Server connection error', 'error');
                }
            }
        });
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
                                <div className="col-span-1 md:col-span-2 space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Asset Title</label>
                                    <input type="text" value={editCardForm.title || ''} onChange={(e) => setEditCardForm({ ...editCardForm, title: e.target.value })} className="cyber-input py-3 px-4" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Price (USDT)</label>
                                    <input type="number" value={editCardForm.price || ''} onChange={(e) => setEditCardForm({ ...editCardForm, price: parseFloat(e.target.value) })} className="cyber-input py-3 px-4" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Card Number</label>
                                    <input type="text" value={editCardForm.cardNumber || ''} onChange={(e) => setEditCardForm({ ...editCardForm, cardNumber: e.target.value })} className="cyber-input py-3 px-4 font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Expiry</label>
                                    <input type="text" value={editCardForm.expiry || ''} onChange={(e) => setEditCardForm({ ...editCardForm, expiry: e.target.value })} className="cyber-input py-3 px-4 font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">CVV</label>
                                    <input type="text" value={editCardForm.cvv || ''} onChange={(e) => setEditCardForm({ ...editCardForm, cvv: e.target.value })} className="cyber-input py-3 px-4 font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Balance/Limit</label>
                                    <input type="text" value={editCardForm.bank || ''} onChange={(e) => setEditCardForm({ ...editCardForm, bank: e.target.value })} className="cyber-input py-3 px-4" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Proxy / SOCKS</label>
                                    <input type="text" value={editCardForm.proxy || ''} onChange={(e) => setEditCardForm({ ...editCardForm, proxy: e.target.value })} className="cyber-input py-3 px-4 font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Source IP</label>
                                    <input type="text" value={editCardForm.ip || ''} onChange={(e) => setEditCardForm({ ...editCardForm, ip: e.target.value })} className="cyber-input py-3 px-4 font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Network Type</label>
                                    <select value={editCardForm.type || ''} onChange={(e) => setEditCardForm({ ...editCardForm, type: e.target.value })} className="cyber-input py-3 px-4 appearance-none">
                                        <option value="VISA">VISA</option>
                                        <option value="MASTERCARD">MASTERCARD</option>
                                        <option value="AMEX">AMEX</option>
                                        <option value="DISCOVER">DISCOVER</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Holder Name</label>
                                    <input type="text" value={editCardForm.holder || ''} onChange={(e) => setEditCardForm({ ...editCardForm, holder: e.target.value })} className="cyber-input py-3 px-4" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">DOB</label>
                                    <input type="text" value={editCardForm.dob || ''} onChange={(e) => setEditCardForm({ ...editCardForm, dob: e.target.value })} className="cyber-input py-3 px-4 font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">SSN</label>
                                    <input type="text" value={editCardForm.ssn || ''} onChange={(e) => setEditCardForm({ ...editCardForm, ssn: e.target.value })} className="cyber-input py-3 px-4 font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Email</label>
                                    <input type="email" value={editCardForm.email || ''} onChange={(e) => setEditCardForm({ ...editCardForm, email: e.target.value })} className="cyber-input py-3 px-4" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Phone</label>
                                    <input type="text" value={editCardForm.phone || ''} onChange={(e) => setEditCardForm({ ...editCardForm, phone: e.target.value })} className="cyber-input py-3 px-4" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Password</label>
                                    <input type="text" value={editCardForm.password || ''} onChange={(e) => setEditCardForm({ ...editCardForm, password: e.target.value })} className="cyber-input py-3 px-4" />
                                </div>
                                <div className="col-span-1 md:col-span-2 space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Address</label>
                                    <input type="text" value={editCardForm.address || ''} onChange={(e) => setEditCardForm({ ...editCardForm, address: e.target.value })} className="cyber-input py-3 px-4" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">City</label>
                                    <input type="text" value={editCardForm.city || ''} onChange={(e) => setEditCardForm({ ...editCardForm, city: e.target.value })} className="cyber-input py-3 px-4" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">State</label>
                                    <input type="text" value={editCardForm.state || ''} onChange={(e) => setEditCardForm({ ...editCardForm, state: e.target.value })} className="cyber-input py-3 px-4" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Zip</label>
                                    <input type="text" value={editCardForm.zip || ''} onChange={(e) => setEditCardForm({ ...editCardForm, zip: e.target.value })} className="cyber-input py-3 px-4" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Country</label>
                                    <input type="text" value={editCardForm.country || ''} onChange={(e) => setEditCardForm({ ...editCardForm, country: e.target.value })} className="cyber-input py-3 px-4" />
                                </div>
                                <div className="col-span-1 md:col-span-2 space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Info (UserAgent)</label>
                                    <textarea value={editCardForm.userAgent || ''} onChange={(e) => setEditCardForm({ ...editCardForm, userAgent: e.target.value })} className="cyber-input py-3 px-4 w-full h-20 resize-none"></textarea>
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

            {/* Notification Toast */}
            {/* Notification Toast - High Visibility */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -50, x: '-50%' }}
                        className={`fixed top-8 left-1/2 z-9999 min-w-[320px] md:min-w-[400px] p-0 rounded-lg shadow-2xl backdrop-blur-xl border flex flex-col overflow-hidden ${notification?.type === 'success' ? 'bg-black/90 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]' :
                            notification?.type === 'error' ? 'bg-black/90 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' :
                                'bg-black/90 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                            }`}
                    >
                        <div className="flex items-center gap-4 p-5 relative">
                            {/* Icon Box */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold border ${notification?.type === 'success' ? 'bg-green-500/10 border-green-500 text-green-500' :
                                notification?.type === 'error' ? 'bg-red-500/10 border-red-500 text-red-500' :
                                    'bg-blue-500/10 border-blue-500 text-blue-500'
                                }`}>
                                {notification?.type === 'success' ? '✓' : notification?.type === 'error' ? '!' : 'i'}
                            </div>

                            {/* Message */}
                            <div className="flex-1">
                                <h4 className={`text-xs font-black tracking-widest mb-1 ${notification?.type === 'success' ? 'text-green-500' :
                                    notification?.type === 'error' ? 'text-red-500' :
                                        'text-blue-500'
                                    }`}>
                                    {notification?.type === 'success' ? 'SYSTEM SUCCESS' : notification?.type === 'error' ? 'SYSTEM ERROR' : 'INFORMATION'}
                                </h4>
                                <p className="text-sm font-bold text-white tracking-wide leading-tight">
                                    {notification?.message}
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
                            className={`h-1 w-full ${notification?.type === 'success' ? 'bg-green-500' :
                                notification?.type === 'error' ? 'bg-red-500' :
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
                <div className="flex gap-4 mb-10 overflow-x-auto pb-4 custom-scrollbar">
                    <button
                        onClick={() => setActiveTab('payments')}
                        className={`px-8 py-3 text-sm font-black tracking-widest transition-all -skew-x-12 border-2 uppercase relative overflow-hidden group min-w-max ${activeTab === 'payments'
                            ? 'bg-(--accent) text-black border-(--accent) shadow-[0_0_20px_var(--accent)] scale-105'
                            : 'bg-black/50 text-gray-500 border-gray-800 hover:border-(--accent) hover:text-(--accent) hover:shadow-[0_0_10px_rgba(255,0,51,0.3)]'
                            }`}
                    >
                        <span className="block skew-x-12 relative z-10">PAYMENTS & ALERTS</span>
                        {activeTab !== 'payments' && <div className="absolute inset-0 bg-(--accent)/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('cards')}
                        className={`px-8 py-3 text-sm font-black tracking-widest transition-all -skew-x-12 border-2 uppercase relative overflow-hidden group min-w-max ${activeTab === 'cards'
                            ? 'bg-(--accent) text-black border-(--accent) shadow-[0_0_20px_var(--accent)] scale-105'
                            : 'bg-black/50 text-gray-500 border-gray-800 hover:border-(--accent) hover:text-(--accent) hover:shadow-[0_0_10px_rgba(255,0,51,0.3)]'
                            }`}
                    >
                        <span className="block skew-x-12 relative z-10">CARD INVENTORY</span>
                        {activeTab !== 'cards' && <div className="absolute inset-0 bg-(--accent)/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-8 py-3 text-sm font-black tracking-widest transition-all -skew-x-12 border-2 uppercase relative overflow-hidden group min-w-max ${activeTab === 'orders'
                            ? 'bg-(--accent) text-black border-(--accent) shadow-[0_0_20px_var(--accent)] scale-105'
                            : 'bg-black/50 text-gray-500 border-gray-800 hover:border-(--accent) hover:text-(--accent) hover:shadow-[0_0_10px_rgba(255,0,51,0.3)]'
                            }`}
                    >
                        <span className="block skew-x-12 relative z-10">PURCHASES ({orders.length})</span>
                        {activeTab !== 'orders' && <div className="absolute inset-0 bg-(--accent)/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-8 py-3 text-sm font-black tracking-widest transition-all -skew-x-12 border-2 uppercase relative overflow-hidden group min-w-max ${activeTab === 'users'
                            ? 'bg-(--accent) text-black border-(--accent) shadow-[0_0_20px_var(--accent)] scale-105'
                            : 'bg-black/50 text-gray-500 border-gray-800 hover:border-(--accent) hover:text-(--accent) hover:shadow-[0_0_10px_rgba(255,0,51,0.3)]'
                            }`}
                    >
                        <span className="block skew-x-12 relative z-10">USER MANAGEMENT</span>
                        {activeTab !== 'users' && <div className="absolute inset-0 bg-(--accent)/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('bundles')}
                        className={`px-8 py-3 text-sm font-black tracking-widest transition-all -skew-x-12 border-2 uppercase relative overflow-hidden group min-w-max ${activeTab === 'bundles'
                            ? 'bg-(--accent) text-black border-(--accent) shadow-[0_0_20px_var(--accent)] scale-105'
                            : 'bg-black/50 text-gray-500 border-gray-800 hover:border-(--accent) hover:text-(--accent) hover:shadow-[0_0_10px_rgba(255,0,51,0.3)]'
                            }`}
                    >
                        <span className="block skew-x-12 relative z-10">BUNDLE ORDERS</span>
                        {activeTab !== 'bundles' && <div className="absolute inset-0 bg-(--accent)/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('offers')}
                        className={`px-8 py-3 text-sm font-black tracking-widest transition-all -skew-x-12 border-2 uppercase relative overflow-hidden group min-w-max ${activeTab === 'offers'
                            ? 'bg-(--accent) text-black border-(--accent) shadow-[0_0_20px_var(--accent)] scale-105'
                            : 'bg-black/50 text-gray-500 border-gray-800 hover:border-(--accent) hover:text-(--accent) hover:shadow-[0_0_10px_rgba(255,0,51,0.3)]'
                            }`}
                    >
                        <span className="block skew-x-12 relative z-10">OFFERS MANAGER</span>
                        {activeTab !== 'offers' && <div className="absolute inset-0 bg-(--accent)/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-8 py-3 text-sm font-black tracking-widest transition-all -skew-x-12 border-2 uppercase relative overflow-hidden group min-w-max ${activeTab === 'settings'
                            ? 'bg-(--accent) text-black border-(--accent) shadow-[0_0_20px_var(--accent)] scale-105'
                            : 'bg-black/50 text-gray-500 border-gray-800 hover:border-(--accent) hover:text-(--accent) hover:shadow-[0_0_10px_rgba(255,0,51,0.3)]'
                            }`}
                    >
                        <span className="block skew-x-12 relative z-10">SYST SETTINGS</span>
                        {activeTab !== 'settings' && <div className="absolute inset-0 bg-(--accent)/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>}
                    </button>
                </div>

                {/* Payments Tab */}
                {activeTab === 'payments' && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
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
                                                                    {(stat as { exactValue?: string; value: string | number }).exactValue || stat.value} <span className="text-[10px] text-gray-500 font-mono">USDT</span>
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
                {activeTab === 'cards' && (
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
                                className="px-8 py-3 text-sm font-black tracking-widest transition-all duration-300 -skew-x-15 border-2 border-(--accent) bg-(--accent) text-black hover:bg-black hover:text-(--accent) shadow-[0_0_15px_var(--accent)] hover:shadow-[0_0_25px_var(--accent)]"
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
                                        PROVISION NEW ASSET
                                    </h3>

                                    <div className="space-y-10">
                                        {/* FINANCIAL CORE */}
                                        <section>
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="h-4 w-1 bg-(--accent)"></div>
                                                <h4 className="text-xs font-black text-gray-400 tracking-[0.2em] uppercase">Core Financial Data</h4>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                                <div className="min-w-0 space-y-2">
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Asset Title</label>
                                                    <input type="text" placeholder="Platinum Business Debit" value={newCard.title} onChange={(e) => setNewCard({ ...newCard, title: e.target.value })} className="cyber-input py-3 px-4" required />
                                                </div>
                                                <div className="min-w-0 space-y-2">
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Price (USDT)</label>
                                                    <input type="number" step="0.01" placeholder="45.00" value={newCard.price} onChange={(e) => setNewCard({ ...newCard, price: e.target.value })} className="cyber-input py-3 px-4" required />
                                                </div>
                                                <div className="min-w-0 space-y-2">
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Card Number</label>
                                                    <input type="text" placeholder="4444 4444 4444 4444" value={newCard.cardNumber} onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })} className="cyber-input py-3 px-4 font-mono" required />
                                                </div>
                                                <div className="min-w-0 space-y-2">
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Expiry (MM/YYYY)</label>
                                                    <input type="text" placeholder="12/2026" value={newCard.expiry} onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })} className="cyber-input py-3 px-4 font-mono" required />
                                                </div>
                                                <div className="min-w-0 space-y-2">
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Security Code (CVV)</label>
                                                    <input type="text" placeholder="123" value={newCard.cvv} onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })} className="cyber-input py-3 px-4 font-mono" required />
                                                </div>
                                                <div className="min-w-0 space-y-2">
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Network Type</label>
                                                    <select value={newCard.type} onChange={(e) => setNewCard({ ...newCard, type: e.target.value })} className="cyber-input py-3 px-4 appearance-none">
                                                        <option value="" disabled className="bg-black">SELECT NETWORK</option>
                                                        <option value="VISA" className="bg-black">VISA</option>
                                                        <option value="MASTERCARD" className="bg-black">MASTERCARD</option>
                                                        <option value="AMEX" className="bg-black">AMEX</option>
                                                        <option value="DISCOVER" className="bg-black">DISCOVER</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </section>

                                        {/* PERSONAL DETAILS */}
                                        <section className="mt-12 pt-4">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="h-4 w-1 bg-blue-500"></div>
                                                <h4 className="text-xs font-black text-gray-400 tracking-[0.2em] uppercase">Holder Personal Data</h4>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                                <div className="min-w-0 space-y-2 sm:col-span-2">
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Legal Full Name</label>
                                                    <input type="text" placeholder="JOHN SILVER DOE" value={newCard.holder} onChange={(e) => setNewCard({ ...newCard, holder: e.target.value })} className="cyber-input py-3 px-4 uppercase" />
                                                </div>
                                                <div className="min-w-0 space-y-2">
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Date of Birth</label>
                                                    <input type="text" placeholder="MM/DD/YYYY" value={newCard.dob} onChange={(e) => setNewCard({ ...newCard, dob: e.target.value })} className="cyber-input py-3 px-4 font-mono" />
                                                </div>
                                                <div className="min-w-0 space-y-2">
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">SSN Code</label>
                                                    <input type="text" placeholder="XXX-XX-XXXX" value={newCard.ssn} onChange={(e) => setNewCard({ ...newCard, ssn: e.target.value })} className="cyber-input py-3 px-4 font-mono" />
                                                </div>
                                                <div className="min-w-0 space-y-2">
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Email</label>
                                                    <input type="email" placeholder="agent@ghostmail.net" value={newCard.email} onChange={(e) => setNewCard({ ...newCard, email: e.target.value })} className="cyber-input py-3 px-4" />
                                                </div>
                                                <div className="min-w-0 space-y-2">
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Password</label>
                                                    <input type="text" placeholder="********" value={newCard.password} onChange={(e) => setNewCard({ ...newCard, password: e.target.value })} className="cyber-input py-3 px-4" />
                                                </div>
                                                <div className="min-w-0 space-y-2 sm:col-span-2">
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Emergency Contact (Phone)</label>
                                                    <input type="text" placeholder="+1 (555) 000-0000" value={newCard.phone} onChange={(e) => setNewCard({ ...newCard, phone: e.target.value })} className="cyber-input py-3 px-4 font-mono" />
                                                </div>
                                            </div>
                                        </section>

                                        {/* BILLING & LOCATION */}
                                        <section className="mt-12 pt-4">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="h-4 w-1 bg-amber-500"></div>
                                                <h4 className="text-xs font-black text-gray-400 tracking-[0.2em] uppercase">Billing & Geolocation</h4>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                                <div className="min-w-0 space-y-2 sm:col-span-2">
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Street Address</label>
                                                    <input type="text" placeholder="123 Stealth Ave" value={newCard.address} onChange={(e) => setNewCard({ ...newCard, address: e.target.value })} className="cyber-input py-3 px-4" />
                                                </div>
                                                <div className="min-w-0 space-y-2">
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">City</label>
                                                    <input type="text" placeholder="Neo Tokyo" value={newCard.city} onChange={(e) => setNewCard({ ...newCard, city: e.target.value })} className="cyber-input py-3 px-4" />
                                                </div>
                                                <div className="min-w-0 space-y-2">
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">State/Reg</label>
                                                    <input type="text" placeholder="Kanto" value={newCard.state} onChange={(e) => setNewCard({ ...newCard, state: e.target.value })} className="cyber-input py-3 px-4" />
                                                </div>
                                                <div className="min-w-0 space-y-2">
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">ZIP Code</label>
                                                    <input type="text" placeholder="100-000" value={newCard.zip} onChange={(e) => setNewCard({ ...newCard, zip: e.target.value })} className="cyber-input py-3 px-4 font-mono" />
                                                </div>
                                                <div className="min-w-0 space-y-2">
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Country</label>
                                                    <input type="text" placeholder="UNITED STATES" value={newCard.country} onChange={(e) => setNewCard({ ...newCard, country: e.target.value })} className="cyber-input py-3 px-4 uppercase" />
                                                </div>
                                            </div>
                                        </section>

                                        {/* TECHNICAL METADATA */}
                                        <section className="mt-10 bg-white/2 p-8 rounded-2xl border border-white/5 shadow-inner">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="h-4 w-1 bg-gray-600"></div>
                                                <h4 className="text-xs font-black text-gray-400 tracking-[0.2em] uppercase">Technical Parameters</h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                                <div className="space-y-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Issuing Financial Institution</label>
                                                        <input type="text" placeholder="CyberBank International" value={newCard.bank} onChange={(e) => setNewCard({ ...newCard, bank: e.target.value })} className="cyber-input py-3 px-4" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Network Proxy / SOCKS5</label>
                                                        <input type="text" placeholder="1.2.3.4:8080" value={newCard.proxy} onChange={(e) => setNewCard({ ...newCard, proxy: e.target.value })} className="cyber-input py-3 px-4 font-mono" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Source IP Address</label>
                                                        <input type="text" placeholder="38.39.226.38" value={newCard.ip} onChange={(e) => setNewCard({ ...newCard, ip: e.target.value })} className="cyber-input py-3 px-4 font-mono" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2 flex flex-col">
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Additional Asset Intelligence (Description)</label>
                                                    <textarea
                                                        rows={4}
                                                        placeholder="Enter any additional details, security notes, or special instructions..."
                                                        value={newCard.description}
                                                        onChange={(e) => setNewCard({ ...newCard, description: e.target.value })}
                                                        className="cyber-input py-3 px-4 w-full resize-none grow"
                                                    ></textarea>
                                                </div>
                                                <div className="col-span-1 md:col-span-2 space-y-2 flex flex-col mt-4">
                                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Asset Info (System Hardware / UserAgent)</label>
                                                    <textarea
                                                        rows={3}
                                                        placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
                                                        value={newCard.userAgent}
                                                        onChange={(e) => setNewCard({ ...newCard, userAgent: e.target.value })}
                                                        className="cyber-input py-3 px-4 w-full resize-none"
                                                    ></textarea>
                                                </div>
                                            </div>
                                        </section>
                                    </div>

                                    <div className="flex justify-between items-center mt-12 pt-8 border-t border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                                            <span className="text-[9px] text-gray-600 font-black tracking-widest uppercase">Core Encryption Active</span>
                                        </div>
                                        <button type="submit" className="px-12 py-5 text-sm font-black tracking-[0.2em] transition-all -skew-x-12 border-2 border-(--accent) bg-(--accent) text-black hover:bg-black hover:text-(--accent) shadow-[0_0_20px_rgba(255,0,51,0.3)] hover:shadow-[0_0_30px_var(--accent)] hover:scale-105 active:scale-95 group">
                                            <span className="skew-x-12 flex items-center gap-3">
                                                UPLOAD TO CORE <span className="text-xl group-hover:rotate-90 transition-transform">↗</span>
                                            </span>
                                        </button>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>

                        {/* Cards List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {cards
                                .slice((cardsPage - 1) * cardsPerPage, cardsPage * cardsPerPage)
                                .map((card, index) => (
                                    <motion.div
                                        key={card.id || (card as unknown as { _id: string })._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group h-[260px] perspective-1000"
                                    >
                                        <motion.div
                                            className="relative w-full h-full transform-3d"
                                            whileHover={{ rotateY: 180 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        >
                                            {/* FRONT SIDE */}
                                            <div className="absolute inset-0 backface-hidden z-10">
                                                <div className={`
                                                        h-full w-full rounded-2xl overflow-hidden relative border border-white/10 flex flex-col justify-between
                                                        bg-linear-to-br from-[#1a1a1a] to-[#0a0a0a] shadow-2xl
                                                        ${!card.forSale ? 'grayscale-[0.8] opacity-60' : ''}
                                                    `}>
                                                    {/* Animated holographic shine */}
                                                    <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"></div>

                                                    {/* Card Header */}
                                                    <div className="p-5 flex justify-between items-start">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-(--accent) tracking-widest uppercase mb-1">ASSET_TYPE</span>
                                                            <h4 className="text-sm font-black text-white tracking-wider uppercase truncate max-w-[150px]">{card.title}</h4>
                                                        </div>
                                                        <div className="bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-xs font-black text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                                                            {card.price} USDT
                                                        </div>
                                                    </div>

                                                    {/* Card Chip & Number */}
                                                    <div className="px-5 -mt-4">
                                                        <div className="w-10 h-7 bg-linear-to-br from-yellow-300 to-yellow-600 rounded-md border border-black/20 shadow-inner flex items-center justify-center mb-4">
                                                            <div className="w-full h-px bg-black/10"></div>
                                                        </div>
                                                        <p className="text-lg md:text-xl font-mono font-bold tracking-[0.15em] text-white/90 text-glow">
                                                            {formatCardNumber(card.cardNumber).replace(/[0-9]/g, (m, i) => i < 14 ? 'X' : m)}
                                                        </p>
                                                    </div>

                                                    {/* Card Footer */}
                                                    <div className="p-5 flex justify-between items-end border-t border-white/5 bg-black/20">
                                                        <div>
                                                            <p className="text-[8px] text-gray-500 font-bold uppercase mb-0.5">Holder</p>
                                                            <p className="text-[10px] font-mono font-bold text-gray-300 truncate max-w-[120px] uppercase">
                                                                {card.holder || 'CONFIDENTIAL'}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[8px] text-gray-500 font-bold uppercase mb-0.5">Exp / Type</p>
                                                            <p className="text-[10px] font-mono font-bold text-gray-300">
                                                                {card.expiry} <span className="text-(--accent) ml-1 font-black">VISA</span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Sold Overlay Banner */}
                                                    {!card.forSale && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] z-20 pointer-events-none">
                                                            <div className="bg-red-600 text-white px-6 py-1.5 font-black text-[10px] tracking-[0.3em] uppercase -rotate-12 border-2 border-white/20 shadow-2xl">
                                                                TERMINATED / SOLD
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* BACK SIDE */}
                                            <div className="absolute inset-0 backface-hidden transform-[rotateY(180deg)] z-20">
                                                <div className="h-full w-full rounded-2xl bg-[#0a0a0a] border-2 border-(--accent)/30 overflow-hidden relative flex flex-col shadow-2xl">
                                                    {/* Magnetic Strip */}
                                                    <div className="w-full h-10 bg-black mt-6"></div>

                                                    <div className="p-6 space-y-4">
                                                        <div className="flex justify-between items-center">
                                                            <div className="bg-white/90 h-8 w-2/3 flex items-center justify-end px-3 rounded shadow-inner">
                                                                <span className="font-mono text-black font-black tracking-widest text-xs">XXX</span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-(--accent) tracking-widest">CVC_CORE</span>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                                            <div className="bg-white/5 p-2 rounded border border-white/5">
                                                                <p className="text-[7px] text-gray-500 font-bold uppercase mb-1">Bank</p>
                                                                <p className="text-[9px] font-bold text-white truncate uppercase">{card.bank || 'N/A'}</p>
                                                            </div>
                                                            <div className="bg-white/5 p-2 rounded border border-white/5">
                                                                <p className="text-[7px] text-gray-500 font-bold uppercase mb-1">Source IP</p>
                                                                <p className="text-[9px] font-mono text-gray-400">{card.ip || '---.---.---'}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons Layer */}
                                                    <div className="mt-auto p-4 flex gap-2 bg-black/50 border-t border-white/10 backdrop-blur-sm">
                                                        <button
                                                            onClick={() => {
                                                                setEditingCard(card);
                                                                setEditCardForm({ ...card });
                                                            }}
                                                            className="flex-1 py-2 bg-blue-600/10 hover:bg-blue-600 border border-blue-600/30 text-blue-400 hover:text-white transition-all text-[9px] font-black tracking-widest uppercase rounded cursor-pointer"
                                                        >
                                                            EDIT
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCard(card.id || (card as unknown as { _id: string })._id)}
                                                            className="flex-1 py-2 bg-red-600/10 hover:bg-red-600 border border-red-600/30 text-red-500 hover:text-white transition-all text-[9px] font-black tracking-widest uppercase rounded cursor-pointer"
                                                        >
                                                            PURGE
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                ))}
                        </div>

                        {cards.length === 0 && !showAddCard && (
                            <div className="p-12 border border-dashed border-(--border) rounded-lg text-center bg-(--bg-secondary)/50">
                                <p className="text-gray-500 font-mono tracking-widest">INVENTORY EMPTY - ADD NEW ASSETS</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
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
                                                    value={(editOrderForm.cardTitle as string) || ''}
                                                    onChange={(e) => setEditOrderForm({ ...editOrderForm, cardTitle: e.target.value })}
                                                    className="w-full bg-black/50 border border-gray-800 rounded p-3 text-white focus:border-(--accent) focus:outline-none transition-colors text-sm font-bold"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1">Price (USDT)</label>
                                                <input
                                                    type="number"
                                                    value={(editOrderForm.price as number) || ''}
                                                    onChange={(e) => setEditOrderForm({ ...editOrderForm, price: parseFloat(e.target.value) })}
                                                    className="w-full bg-black/50 border border-gray-800 rounded p-3 text-white focus:border-(--accent) focus:outline-none transition-colors text-sm font-mono"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1">Date & Time</label>
                                                <input
                                                    type="datetime-local"
                                                    value={editOrderForm.purchaseDate ? new Date(editOrderForm.purchaseDate as string | number | Date).toISOString().slice(0, 16) : ''}
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
                            <div className="flex items-center gap-6">
                                <div className="bg-black/50 border border-white/5 rounded-lg px-4 py-2 flex items-center gap-3">
                                    <ShoppingCart className="w-4 h-4 text-(--accent)" />
                                    <div>
                                        <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Total Purchases</p>
                                        <p className="text-sm font-black text-white">{orders.length}</p>
                                    </div>
                                </div>
                                <div className="px-3 py-1 bg-(--accent)/10 border border-(--accent)/30 rounded text-[10px] text-(--accent) font-bold tracking-widest uppercase">
                                    LIVE DATA
                                </div>
                            </div>
                        </div>

                        {orders.length > 0 ? (
                            <div className="bg-[#0a0a0a]/80 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden shadow-2xl relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-(--accent) to-transparent opacity-50"></div>

                                {/* Table Header - Improved Alignment and Visibility */}
                                <div className="grid grid-cols-7 p-4 bg-[#0f0f0f] border-b border-gray-800 text-[10px] text-gray-400 tracking-wider font-black uppercase whitespace-nowrap">
                                    <div className="col-span-2">ITEM SOLD</div>
                                    <div className="text-center">PRICE</div>
                                    <div className="text-center">PURCHASER</div>
                                    <div className="text-center">GMAIL/EMAIL</div>
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

                {/* User Management Tab */}
                {activeTab === 'users' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8"
                    >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/5">
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-wider flex items-center gap-3">
                                    <Users className="text-(--accent) w-6 h-6" />
                                    USER <span className="text-(--accent)">MANAGEMENT</span>
                                </h2>
                                <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em] mt-1 uppercase">Control center for all registered personnel</p>
                            </div>

                            <div className="relative w-full md:w-96 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-(--accent) transition-colors" />
                                <input
                                    type="text"
                                    placeholder="SEARCH OPERATORS BY ID OR EMAIL..."
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-white focus:border-(--accent) outline-none transition-all placeholder:text-gray-700"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {users
                                .filter(u =>
                                    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                                    u.email.toLowerCase().includes(userSearch.toLowerCase())
                                )
                                .map((user) => (
                                    <motion.div
                                        key={user.id}
                                        layout
                                        className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden group hover:border-(--accent)/30 transition-all shadow-xl"
                                    >
                                        <div className="p-6 relative">
                                            {/* Status Badge */}
                                            <div className={`absolute top-6 right-6 px-2 py-0.5 rounded text-[8px] font-black tracking-tighter uppercase ${user.status === 'APPROVED' ? 'bg-green-500/10 text-green-500 border border-green-500/30' : 'bg-red-500/10 text-red-500 border border-red-500/30'}`}>
                                                {user.status}
                                            </div>

                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-gray-800 to-black flex items-center justify-center border border-white/10 group-hover:border-(--accent)/40 transition-colors">
                                                    <Users className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-white tracking-widest uppercase group-hover:text-(--accent) transition-colors">{user.username}</h3>
                                                    <p className="text-[10px] text-gray-500 font-mono truncate max-w-[150px]">{user.email}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="bg-black/50 p-3 rounded-lg border border-white/5">
                                                    <p className="text-[11px] text-gray-600 font-bold uppercase mb-1">Balance</p>
                                                    <p className="text-xl font-black text-white">{user.balance || 0} <span className="text-[10px] text-(--accent)">USDT</span></p>
                                                </div>
                                                <div className="bg-black/50 p-3 rounded-lg border border-white/5">
                                                    <p className="text-[10px] text-gray-600 font-bold uppercase mb-1">Member Since</p>
                                                    <p className="text-xs font-mono text-gray-400">{new Date(user.accountExpiresAt || Date.now()).toLocaleDateString()}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => handleImpersonateUser(user)}
                                                    className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 bg-white text-black rounded-lg text-[10px] font-black tracking-widest hover:bg-(--accent) hover:text-white transition-all uppercase"
                                                >
                                                    <Key className="w-3 h-3" /> LOGIN
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingUser(user);
                                                        setEditUserForm({ ...user });
                                                    }}
                                                    className="p-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500 hover:text-white transition-all"
                                                    title="Edit User"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => fetchActivityLogs(user.id)}
                                                    className="p-2.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg hover:bg-amber-500 hover:text-white transition-all"
                                                    title="View Activity Logs"
                                                >
                                                    <Activity className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id || (user as unknown as { _id: string })._id)}
                                                    className="p-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                        </div>

                        {users.length === 0 && (
                            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                                <UserX className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                                <p className="text-gray-600 font-black tracking-[0.3em] uppercase">No operators found in sector</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Edit User Modal */}
                <AnimatePresence>
                    {editingUser && (
                        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl w-full max-w-lg shadow-[0_0_80px_rgba(255,255,255,0.05)]"
                            >
                                <h3 className="text-xl font-black text-white mb-8 tracking-widest flex items-center gap-3">
                                    <Edit className="text-(--accent) w-5 h-5" /> EDIT USER
                                </h3>
                                <form onSubmit={handleUpdateUser} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Operator Name</label>
                                            <input type="text" value={editUserForm.username || ''} onChange={e => setEditUserForm({ ...editUserForm, username: e.target.value })} className="w-full bg-black border border-white/10 rounded-xl p-4 text-white font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Email Address</label>
                                            <input type="email" value={editUserForm.email || ''} onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value })} className="w-full bg-black border border-white/10 rounded-xl p-4 text-white font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Wallet Balance</label>
                                            <input type="number" value={editUserForm.balance || 0} onChange={e => setEditUserForm({ ...editUserForm, balance: Number(e.target.value) })} className="w-full bg-black border border-white/10 rounded-xl p-4 text-white font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Access Status</label>
                                            <select
                                                value={editUserForm.status}
                                                onChange={e => setEditUserForm({ ...editUserForm, status: e.target.value as 'APPROVED' | 'NOT_APPROVED' })}
                                                className="w-full bg-black border border-white/10 rounded-xl p-4 text-white font-bold appearance-none"
                                            >
                                                <option value="APPROVED">APPROVED</option>
                                                <option value="NOT_APPROVED">NOT_APPROVED</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-4 text-xs font-black text-gray-500 bg-white/5 rounded-xl hover:bg-white/10 transition-colors uppercase">Cancel</button>
                                        <button type="submit" className="flex-1 py-4 text-xs font-black text-black bg-(--accent) rounded-xl hover:bg-white transition-all uppercase">Save Changes</button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Activity Logs Modal */}
                <AnimatePresence>
                    {viewingLogsUserId && (
                        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
                            >
                                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-widest uppercase">Operator Logs</h3>
                                        <p className="text-[10px] text-gray-600 font-mono mt-1">UUID: {viewingLogsUserId}</p>
                                    </div>
                                    <button onClick={() => setViewingLogsUserId(null)} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-4">
                                    {userLogs.length > 0 ? (
                                        userLogs.map((log) => (
                                            <div key={log._id} className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="px-2 py-0.5 bg-(--accent)/20 text-(--accent) text-[8px] font-black uppercase rounded tracking-widest">{log.action}</span>
                                                    <span className="text-[10px] text-gray-600 font-mono">{new Date(log.createdAt).toLocaleString()}</span>
                                                </div>
                                                <p className="text-white text-sm font-medium leading-relaxed">{log.details}</p>
                                                {log.ip && <p className="text-[9px] text-gray-700 font-mono mt-3 uppercase tracking-tighter">Source IP: {log.ip}</p>}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-20">
                                            <Activity className="w-12 h-12 text-gray-900 mx-auto mb-4" />
                                            <p className="text-gray-700 font-black text-xs tracking-[0.2em] uppercase">No logs recorded for this operator</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>


                {/* System Settings Tab */}
                {activeTab === 'settings' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="bg-[#0a0a0a]/80 backdrop-blur-md border border-gray-800 rounded-xl p-8 shadow-2xl">
                            <h2 className="text-2xl font-black text-white mb-8 tracking-widest border-b border-white/5 pb-4">
                                <span className="text-(--accent)">SYSTEM</span> CONFIGURATION
                            </h2>

                            {appSettings ? (
                                <form onSubmit={handleSaveSettings} className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="p-6 bg-white/5 rounded-lg border border-white/5 group hover:border-(--accent)/30 transition-colors">
                                            <div className="flex justify-between items-center mb-4">
                                                <label className="text-xs font-black tracking-widest text-gray-400 uppercase">Account Activation Fee</label>
                                                <span className="text-(--accent) font-mono text-sm font-bold">CURRENT: {appSettings.signupAmount} USDT</span>
                                            </div>
                                            <input
                                                type="number"
                                                value={appSettings.signupAmount}
                                                onChange={(e) => setAppSettings({ ...appSettings, signupAmount: Number(e.target.value) })}
                                                className="w-full bg-black border border-gray-800 rounded p-4 text-white focus:border-(--accent) transition-colors font-bold text-xl"
                                                placeholder="Enter amount"
                                            />
                                            <p className="mt-2 text-[10px] text-gray-600 font-mono tracking-wider">Fee required for new users to activate their accounts.</p>
                                        </div>

                                        <div className="p-6 bg-white/5 rounded-lg border border-white/5 group hover:border-(--accent)/30 transition-colors">
                                            <div className="flex justify-between items-center mb-4">
                                                <label className="text-xs font-black tracking-widest text-gray-400 uppercase">Minimum Deposit</label>
                                                <span className="text-(--accent) font-mono text-sm font-bold">CURRENT: {appSettings.minDepositAmount} USDT</span>
                                            </div>
                                            <input
                                                type="number"
                                                value={appSettings.minDepositAmount}
                                                onChange={(e) => setAppSettings({ ...appSettings, minDepositAmount: Number(e.target.value) })}
                                                className="w-full bg-black border border-gray-800 rounded p-4 text-white focus:border-(--accent) transition-colors font-bold text-xl"
                                                placeholder="Enter amount"
                                            />
                                            <p className="mt-2 text-[10px] text-gray-600 font-mono tracking-wider">Minimum USDT amount allowed for wallet top-ups.</p>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={settingsSaving}
                                        className="w-full py-4 bg-(--accent) text-black font-black tracking-[0.3em] uppercase rounded hover:bg-white transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] disabled:opacity-50"
                                    >
                                        {settingsSaving ? 'UPLOADING TO CORE...' : 'COMMIT CHANGES TO SYSTEM'}
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="animate-spin w-8 h-8 border-2 border-(--accent) border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <p className="text-gray-500 font-mono text-xs">COMMUNICATING WITH CORE...</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Bundle Offers Tab */}
                {activeTab === 'offers' && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                            <h2 className="text-2xl font-black text-white tracking-widest">
                                BUNDLE <span className="text-(--accent)">OFFERS</span>
                            </h2>
                            <button
                                onClick={() => setShowAddOffer(!showAddOffer)}
                                className="px-6 py-2 bg-(--accent) text-black text-xs font-black tracking-widest uppercase hover:bg-white transition-colors -skew-x-12"
                            >
                                <span className="block skew-x-12">{showAddOffer ? 'CANCEL' : '+ CREATE OFFER'}</span>
                            </button>
                        </div>

                        {showAddOffer && (
                            <motion.form
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onSubmit={handleAddOffer}
                                className="bg-[#050505] border border-(--accent)/30 p-8 rounded-xl mb-12 grid grid-cols-1 md:grid-cols-3 gap-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase">Offer Title</label>
                                    <input type="text" value={newOffer.title} onChange={e => setNewOffer({ ...newOffer, title: e.target.value })} className="w-full bg-black border border-gray-800 p-3 text-white rounded text-sm focus:border-(--accent) outline-none" placeholder="e.g. Starter Pack" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase">Card Count</label>
                                    <input type="number" value={newOffer.cardCount} onChange={e => setNewOffer({ ...newOffer, cardCount: e.target.value })} className="w-full bg-black border border-gray-800 p-3 text-white rounded text-sm focus:border-(--accent) outline-none" placeholder="50" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase">Original Price</label>
                                    <input type="number" value={newOffer.originalPrice} onChange={e => setNewOffer({ ...newOffer, originalPrice: e.target.value })} className="w-full bg-black border border-gray-800 p-3 text-white rounded text-sm focus:border-(--accent) outline-none" placeholder="500" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase">Bundle Price</label>
                                    <input type="number" value={newOffer.price} onChange={e => setNewOffer({ ...newOffer, price: e.target.value })} className="w-full bg-black border border-gray-800 p-3 text-white rounded text-sm focus:border-(--accent) outline-none" placeholder="399" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase">Discount (%)</label>
                                    <input type="number" value={newOffer.discount} onChange={e => setNewOffer({ ...newOffer, discount: e.target.value })} className="w-full bg-black border border-gray-800 p-3 text-white rounded text-sm focus:border-(--accent) outline-none" placeholder="20" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase">Badge (Optional)</label>
                                    <input type="text" value={newOffer.badge} onChange={e => setNewOffer({ ...newOffer, badge: e.target.value })} className="w-full bg-black border border-gray-800 p-3 text-white rounded text-sm focus:border-(--accent) outline-none" placeholder="BEST VALUE" />
                                </div>
                                <button type="submit" className="md:col-span-3 py-4 bg-white text-black font-black tracking-[0.2em] uppercase rounded hover:bg-(--accent) hover:text-white transition-all">
                                    PUBLISH OFFER TO MARKET
                                </button>
                            </motion.form>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {adminOffers.map((offer) => (
                                <div key={offer.id} className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-xl relative group">
                                    {offer.badge && (
                                        <div className="absolute top-4 right-4 bg-(--accent) text-black px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter rounded">
                                            {offer.badge}
                                        </div>
                                    )}
                                    <h3 className="text-white font-black tracking-widest mb-2 uppercase">{offer.title}</h3>
                                    <div className="flex items-end gap-3 mb-4">
                                        <span className="text-3xl font-black text-white">{offer.price} USDT</span>
                                        <span className="text-gray-600 line-through text-sm mb-1">{offer.originalPrice} USDT</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-gray-500 tracking-wider mb-6">
                                        <span>CARDS: {offer.cardCount}</span>
                                        <span className="text-green-500">-{offer.discount}% OFF</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteOffer(offer.id)}
                                        className="w-full py-2 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest rounded hover:bg-red-500 hover:text-white transition-colors"
                                    >
                                        DELETE OFFER
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Bundle Orders Tab */}
                {activeTab === 'bundles' && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h2 className="text-2xl font-black text-white mb-8 tracking-widest border-b border-gray-800 pb-4">
                            BUNDLE <span className="text-(--accent)">SALES</span>
                        </h2>

                        <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#0f0f0f] text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800">
                                    <tr>
                                        <th className="p-4">USER / BUNDLE</th>
                                        <th className="p-4 text-center">CARDS</th>
                                        <th className="p-4 text-center">TOTAL PAID</th>
                                        <th className="p-4 text-right">DATE</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {bundleOrders.map((bo) => (
                                        <tr key={bo.id} className="hover:bg-white/2 transition-colors group">
                                            <td className="p-4">
                                                <div className="text-white font-black tracking-widest text-xs mb-1 uppercase">{bo.bundleTitle}</div>
                                                <div className="text-gray-600 font-mono text-[10px] uppercase">{bo.username}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-bold text-white">
                                                    {bo.cardCount}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="text-green-500 font-black tracking-widest">{bo.price} USDT</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="text-white font-mono text-[10px]">
                                                    {new Date(bo.purchaseDate).toLocaleDateString()}
                                                </div>
                                                <div className="text-gray-600 font-mono text-[8px]">
                                                    {new Date(bo.purchaseDate).toLocaleTimeString()}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {bundleOrders.length === 0 && (
                                <div className="p-20 text-center text-gray-600 font-mono text-xs tracking-[0.3em]">
                                    NO BUNDLE ORDERS DETECTED IN CORE
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </div >
        </div >
    );
}
