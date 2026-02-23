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
            // Normalize date for better deduplication (ignore time/seconds in the key)
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

            const allApps = sortByNewest(appointmentsData || []);

            setAppointments(deduplicate(allApps.filter(a => a.type !== 'table' && a.type !== 'interview')));
            setSchedules(deduplicate(allApps.filter(a => a.type === 'interview')));
            setBookings(deduplicate(allApps.filter(a => a.type === 'table')));
            setOrders(deduplicate(sortByNewest(ordersData)));
            setFeedback(deduplicate(sortByNewest(feedbackData)));
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
        <div className="min-h-screen bg-[#F8FAFC] relative">
            <div className="max-w-6xl mx-auto px-4 pt-24 pb-20 relative z-10">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                    {/* Header */}
                    <div className="p-6 md:p-8 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">My Dashboard</h1>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
                        {/* Sidebar Navigation */}
                        <div className="lg:col-span-3 border-r border-slate-200 bg-slate-50/50">
                            <nav className="p-4 space-y-2">
                                <TabButton
                                    active={activeTab === 'appointments'}
                                    onClick={() => setActiveTab('appointments')}
                                    icon={<Calendar size={18} />}
                                    label="Appointments"
                                    count={appointments.length}
                                />
                                <TabButton
                                    active={activeTab === 'schedules'}
                                    onClick={() => setActiveTab('schedules')}
                                    icon={<Briefcase size={18} />}
                                    label="Schedules"
                                    count={schedules.length}
                                />
                                <TabButton
                                    active={activeTab === 'bookings'}
                                    onClick={() => setActiveTab('bookings')}
                                    icon={<Utensils size={18} />}
                                    label="Table Bookings"
                                    count={bookings.length}
                                />
                                <TabButton
                                    active={activeTab === 'orders'}
                                    onClick={() => setActiveTab('orders')}
                                    icon={<ShoppingBag size={18} />}
                                    label="My Orders"
                                    count={orders.length}
                                />
                                <TabButton
                                    active={activeTab === 'feedback'}
                                    onClick={() => setActiveTab('feedback')}
                                    icon={<Star size={18} />}
                                    label="Feedback"
                                    count={feedback.length}
                                />
                            </nav>
                        </div>

                        {/* Content Area */}
                        <div className="lg:col-span-9 bg-white">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="p-6 md:p-8"
                                >
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-2xl font-bold text-slate-900 capitalize">
                                            {activeTab === 'orders' ? 'Order History' :
                                                activeTab === 'bookings' ? 'Restaurant Bookings' :
                                                    activeTab === 'appointments' ? 'Medical Consulting' :
                                                        activeTab === 'schedules' ? 'Interview Schedules' :
                                                            'Feedback & Ratings'}
                                        </h2>
                                        <div className="text-sm text-slate-400 font-medium bg-slate-50 px-3 py-1 rounded-full">
                                            {currentData.length} records found
                                        </div>
                                    </div>

                                    {currentData.length === 0 ? (
                                        <EmptyState
                                            icon={
                                                activeTab === 'orders' ? <Package size={48} /> :
                                                    activeTab === 'bookings' ? <Utensils size={48} /> :
                                                        activeTab === 'schedules' ? <Briefcase size={48} /> :
                                                            activeTab === 'appointments' ? <Calendar size={48} /> :
                                                                <Star size={48} />
                                            }
                                            message={`No ${activeTab} found yet`}
                                        />
                                    ) : (
                                        <div className="space-y-4">
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
                    </div>
                </div>
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
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative p-5 rounded-2xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-md transition-all duration-300"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm ${isOrder ? 'bg-green-50 text-green-600' :
                        isBooking ? 'bg-orange-50 text-orange-600' :
                            record.type === 'doctor' ? 'bg-blue-50 text-blue-600' :
                                isFeedback ? 'bg-amber-50 text-amber-600' :
                                    'bg-purple-50 text-purple-600'
                        }`}>
                        {isOrder ? <ShoppingBag size={24} /> :
                            isBooking ? <Utensils size={24} /> :
                                record.type === 'doctor' ? <Stethoscope size={24} /> :
                                    isFeedback ? <Star size={24} /> :
                                        record.type === 'interview' ? <Briefcase size={24} /> :
                                            <Calendar size={24} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg leading-tight">
                            {isOrder ? (record.item) :
                                isFeedback ? (record.entity_name) :
                                    record.type === 'doctor' ? `Dr. ${record.person_name}` :
                                        record.type === 'interview' ? `Interview: ${record.person_name}` :
                                            record.entity_name}
                        </h3>
                        {(record.type === 'doctor' || record.type === 'interview') && (
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{record.entity_name}</p>
                        )}
                        <div className="flex items-center space-x-3 mt-2">
                            {!isFeedback && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusStyle(record.status)}`}>
                                    {isBooking ? 'Confirmed' : record.status}
                                </span>
                            )}
                            {isFeedback ? (
                                <div className="flex items-center space-x-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        < Star key={i} size={12} className={i < record.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />
                                    ))}
                                </div>
                            ) : (
                                <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">ID: {record._id.slice(-6).toUpperCase()}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="text-right flex flex-col items-end min-w-[120px]">
                        {isOrder ? (
                            <>
                                <p className="text-lg font-black text-slate-900">₹{record.total_price}</p>
                                <p className="text-xs text-slate-500 font-medium">Qty: {record.quantity || 1}</p>
                            </>
                        ) : isFeedback ? (
                            <>
                                <p className="text-[10px] text-slate-400 mt-1">{formatDate(record.created_at)}</p>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center text-slate-900 font-bold text-sm">
                                    <Calendar size={14} className="mr-2 text-purple-500" />
                                    {formatDate(record.date)}
                                </div>
                                <div className="flex items-center text-slate-500 text-xs mt-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                    <Clock size={12} className="mr-1.5 text-slate-400" />
                                    {record.time}
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={onDelete}
                        disabled={isDeleting}
                        className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        title="Delete record"
                    >
                        {isDeleting ? <Loader size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const TabButton = ({ active, onClick, icon, label, count }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm relative group ${active
            ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 translate-x-1'
            : 'text-slate-500 hover:bg-white hover:text-purple-600 hover:shadow-sm'
            }`}
    >
        <span className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-purple-500'} transition-colors`}>{icon}</span>
        <span>{label}</span>
        {count > 0 && (
            <span className={`ml-auto px-2 py-0.5 rounded-lg text-[10px] font-black ${active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600 group-hover:bg-purple-100 group-hover:text-purple-600'
                }`}>
                {count}
            </span>
        )}
        {active && (
            <motion.div
                layoutId="activeTab"
                className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
            />
        )}
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
