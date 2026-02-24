import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, User, Loader, Package, ShoppingBag, Stethoscope, ChevronRight, Utensils, Trash2, Star, Briefcase } from 'lucide-react';
import { database } from '../utils/database';

const UserDashboard = ({ user, onClose }) => {
    const [appointments, setAppointments] = useState([]); // Doctor/General
    const [schedules, setSchedules] = useState([]); // Interviews
    const [orders, setOrders] = useState([]);
    const [bookings, setBookings] = useState([]); // Tables
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('appointments');
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        if (user) {
            loadUserData();
        }
    }, [user]);

    const deduplicate = (arr) => {
        if (!arr || arr.length === 0) return [];
        const seen = new Set();
        return arr.filter(item => {
            // Prefer _id or id for absolute uniqueness
            const uid = item._id || item.id;
            if (uid && !uid.includes('local_')) {
                if (seen.has(uid)) return false;
                seen.add(uid);
                return true;
            }

            // Normalize for semantic deduplication of local/fallback data
            const dateVal = item.date || (item.created_at ? new Date(item.created_at).toLocaleDateString() : 'no-date');
            const timeVal = item.time || 'no-time';
            const key = `${item.entity_name}-${dateVal}-${timeVal}-${item.item || item.type || 'none'}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    };

    const loadUserData = async () => {
        try {
            setLoading(true);

            // Fetch data using our unified database utility (now MongoDB)
            const [appointmentsData, ordersData, feedbackData] = await Promise.all([
                database.getAppointments(null, user.email),
                database.getOrders(user.email),
                database.getFeedback(user.email)
            ]);

            // Helper to sort by created_at descending (newest first)
            const sortByNewest = (arr) => {
                if (!arr) return [];
                return [...arr].sort((a, b) => {
                    const dateA = new Date(a.created_at || a.timestamp || 0);
                    const dateB = new Date(b.created_at || b.timestamp || 0);
                    return dateB - dateA; // Descending
                });
            };

            // Filter out clearly "fake" or old data (anything before 2025)
            const filterJunk = (arr) => {
                if (!arr) return [];
                return arr.filter(item => {
                    const dateStr = item.date || item.created_at;
                    if (!dateStr) return true;
                    const year = new Date(dateStr).getFullYear();
                    return year >= 2025; // Keep only recent data
                });
            };

            const cleanApps = filterJunk(sortByNewest(appointmentsData || []));
            const cleanOrders = filterJunk(sortByNewest(ordersData || []));
            const cleanFeedback = filterJunk(sortByNewest(feedbackData || []));

            setAppointments(deduplicate(cleanApps.filter(a => a.type !== 'table' && a.type !== 'interview')));
            setSchedules(deduplicate(cleanApps.filter(a => a.type === 'interview')));
            setBookings(deduplicate(cleanApps.filter(a => a.type === 'table')));
            setOrders(deduplicate(cleanOrders));
            setFeedback(deduplicate(cleanFeedback));
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (type, id) => {
        try {
            setDeletingId(id);
            let success = false;
            if (type === 'appointment' || type === 'booking') {
                success = await database.deleteAppointment(id);
                if (success) {
                    setAppointments(prev => prev.filter(a => a._id !== id));
                    setBookings(prev => prev.filter(b => b._id !== id));
                }
            } else if (type === 'order') {
                success = await database.deleteOrder(id);
                if (success) setOrders(prev => prev.filter(o => o._id !== id));
            } else if (type === 'feedback') {
                success = await database.deleteFeedback(id);
                if (success) setFeedback(prev => prev.filter(f => f._id !== id));
            }
        } catch (err) {
            console.error('Delete failed:', err);
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const lower = dateString.toLowerCase();
        if (lower.includes('tomorrow')) return 'Tomorrow';
        if (lower.includes('today')) return 'Today';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getStatusStyle = (status) => {
        const styles = {
            scheduled: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
            confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
        return styles[status] || 'bg-slate-50 text-slate-700 border-slate-200';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <Loader size={48} className="animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Fetching your data...</p>
                </div>
            </div>
        );
    }

    const currentData =
        activeTab === 'appointments' ? appointments :
            activeTab === 'schedules' ? schedules :
                activeTab === 'bookings' ? bookings :
                    activeTab === 'orders' ? orders :
                        feedback;

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            {/* Expanded Sidebar UI (from reference) */}
            <div className="sidebar-container-custom hidden lg:flex w-72">
                <div className="px-8 mb-12">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-4">
                        <ShoppingBag size={28} />
                    </div>
                    <h2 className="text-white text-xl font-black tracking-tight">Callix AI</h2>
                </div>

                <nav className="flex-1 space-y-1">
                    <TabButton
                        active={activeTab === 'appointments'}
                        onClick={() => setActiveTab('appointments')}
                        icon={<Calendar size={20} />}
                        label="Appointments"
                        count={appointments.length}
                    />
                    <TabButton
                        active={activeTab === 'schedules'}
                        onClick={() => setActiveTab('schedules')}
                        icon={<Briefcase size={20} />}
                        label="Schedules"
                        count={schedules.length}
                    />
                    <TabButton
                        active={activeTab === 'bookings'}
                        onClick={() => setActiveTab('bookings')}
                        icon={<Utensils size={20} />}
                        label="Table Bookings"
                        count={bookings.length}
                    />
                    <TabButton
                        active={activeTab === 'orders'}
                        onClick={() => setActiveTab('orders')}
                        icon={<ShoppingBag size={20} />}
                        label="My Orders"
                        count={orders.length}
                    />
                    <TabButton
                        active={activeTab === 'feedback'}
                        onClick={() => setActiveTab('feedback')}
                        icon={<Star size={20} />}
                        label="Feedback"
                        count={feedback.length}
                    />
                </nav>

                <div className="px-4 mt-auto">
                    <button
                        onClick={onClose}
                        className="w-full flex items-center space-x-3 px-6 py-4 text-white/60 hover:text-white hover:bg-white/10 rounded-2xl transition-all font-bold"
                    >
                        <ChevronRight size={20} className="rotate-180" />
                        <span>Exit Dashboard</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Top Nav Bar (from reference) */}
                <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-40">
                    <div className="flex items-center bg-slate-100 rounded-xl px-4 py-1.5 w-80">
                        <Loader size={16} className="text-slate-400 mr-2" />
                        <input
                            type="text"
                            placeholder="Search records..."
                            className="bg-transparent border-none outline-none text-xs text-slate-600 w-full"
                        />
                    </div>

                    <div className="flex items-center space-x-6">
                        <button className="text-slate-400 hover:text-slate-600">
                            <Clock size={20} />
                        </button>
                        <div className="h-8 w-[1px] bg-slate-200"></div>
                        <div className="flex items-center space-x-3">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-slate-900">{user?.name || 'User'}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user?.email}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Banner (from reference) */}
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-6 relative overflow-hidden rounded-3xl bg-orange-50 border border-orange-100 p-6 flex items-center justify-between">
                            <div className="relative z-10">
                                <h1 className="text-2xl font-black text-slate-900 mb-1">Hello, {user?.name?.split(' ')[0] || 'there'}!</h1>
                                <p className="text-slate-600 text-sm font-medium mb-4">Welcome back. You have {appointments.length + bookings.length + schedules.length} active items today.</p>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={async () => {
                                            if (window.confirm("This will clear all local records. Continue?")) {
                                                localStorage.removeItem('callix_appointments');
                                                localStorage.removeItem('callix_orders');
                                                localStorage.removeItem('callix_feedback');
                                                await loadUserData();
                                            }
                                        }}
                                        className="px-4 py-2 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-xl text-xs font-bold border border-slate-200 transition-all flex items-center shadow-sm"
                                    >
                                        <Trash2 size={14} className="mr-2" />
                                        Reset History
                                    </button>
                                </div>
                            </div>
                            <div className="relative hidden md:block text-orange-200 opacity-50">
                                <Calendar size={80} strokeWidth={1.5} />
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-black text-slate-900">
                                        {activeTab === 'orders' ? 'Recent Orders' :
                                            activeTab === 'bookings' ? 'Reservations' :
                                                activeTab === 'appointments' ? 'Medical Consulting' :
                                                    activeTab === 'schedules' ? 'Interviews' :
                                                        'Reviews'}
                                    </h2>
                                </div>

                                {currentData.length === 0 ? (
                                    <EmptyState
                                        icon={
                                            activeTab === 'orders' ? <Package size={64} /> :
                                                activeTab === 'bookings' ? <Utensils size={64} /> :
                                                    activeTab === 'schedules' ? <Briefcase size={64} /> :
                                                        activeTab === 'appointments' ? <Calendar size={64} /> :
                                                            <Star size={64} />
                                        }
                                        message={`No records in ${activeTab}`}
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {currentData.map((record) => (
                                            <RecordCard
                                                key={record._id}
                                                record={record}
                                                type={activeTab === 'feedback' ? 'feedback' : (activeTab === 'orders' ? 'order' : (activeTab === 'schedules' ? 'interview' : 'appointment'))}
                                                onDelete={() => handleDelete(activeTab === 'feedback' ? 'feedback' : (activeTab === 'orders' ? 'order' : (activeTab === 'bookings' ? 'booking' : (activeTab === 'schedules' ? 'interview' : 'appointment'))), record._id)}
                                                isDeleting={deletingId === record._id}
                                                formatDate={formatDate}
                                                getStatusStyle={getStatusStyle}
                                            />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
};

const RecordCard = ({ record, type, onDelete, isDeleting, formatDate, getStatusStyle }) => {
    const isOrder = type === 'order';
    const isFeedback = type === 'feedback';
    const isBooking = record.type === 'table';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative p-6 rounded-[2rem] border border-slate-100 bg-white hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300"
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isOrder ? 'bg-emerald-50 text-emerald-600' :
                    isBooking ? 'bg-orange-50 text-orange-600' :
                        record.type === 'doctor' ? 'bg-blue-50 text-blue-600' :
                            isFeedback ? 'bg-amber-50 text-amber-600' :
                                'bg-indigo-50 text-indigo-600'
                    }`}>
                    {isOrder ? <ShoppingBag size={28} /> :
                        isBooking ? <Utensils size={28} /> :
                            record.type === 'doctor' ? <Stethoscope size={28} /> :
                                isFeedback ? <Star size={28} /> :
                                    record.type === 'interview' ? <Briefcase size={28} /> :
                                        <Calendar size={28} />}
                </div>

                <div className="flex items-center space-x-2">
                    {!isFeedback && (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusStyle(record.status)}`}>
                            {isBooking ? 'Confirmed' : record.status}
                        </span>
                    )}
                    <button
                        onClick={onDelete}
                        disabled={isDeleting}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    >
                        {isDeleting ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <h3 className="font-black text-slate-900 text-lg mb-1">
                    {isOrder ? (record.item) :
                        isFeedback ? (record.entity_name) :
                            record.type === 'doctor' ? `Dr. ${record.person_name}` :
                                record.type === 'interview' ? `Interview: ${record.person_name}` :
                                    record.type === 'table' ? record.person_name :
                                        record.entity_name}
                </h3>
                {(record.type === 'doctor' || record.type === 'interview') && (
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">{record.entity_name}</p>
                )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex flex-col">
                    {isOrder ? (
                        <>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
                            <span className="text-xl font-black text-slate-900">₹{record.total_price}</span>
                        </>
                    ) : isFeedback ? (
                        <div className="flex items-center space-x-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} className={i < record.rating ? "text-amber-400 fill-amber-400" : "text-slate-100 fill-slate-100"} />
                            ))}
                        </div>
                    ) : (
                        <>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date & Time</span>
                            <div className="flex items-center text-slate-900 font-bold text-sm mt-1">
                                <Clock size={14} className="mr-2 text-slate-400" />
                                {formatDate(record.date)} • {record.time}
                            </div>
                        </>
                    )}
                </div>

                <span className="text-[10px] text-slate-300 font-bold tracking-widest uppercase">
                    ID: {(record._id || record.id || 'TEMP').toString().slice(-6).toUpperCase()}
                </span>
            </div>
        </motion.div>
    );
};

const TabButton = ({ active, onClick, icon, label, count }) => (
    <button
        onClick={onClick}
        className={`tab-button-custom ${active ? 'active' : ''}`}
    >
        <span className="mr-4">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        {count > 0 && (
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${active ? 'bg-purple-100 text-purple-600' : 'bg-white/20 text-white'}`}>
                {count}
            </span>
        )}
        <div className="sidebar-curve-top" />
        <div className="sidebar-curve-bottom" />
    </button>
);

const EmptyState = ({ icon, message }) => (
    <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/30">
        <div className="flex items-center justify-center text-slate-200 mb-6 drop-shadow-sm">{icon}</div>
        <h3 className="text-xl font-bold text-slate-400">{message}</h3>
        <p className="text-slate-300 text-sm mt-2 font-medium">Any actions you take with our AI will appear here.</p>
    </div>
);

export default UserDashboard;
