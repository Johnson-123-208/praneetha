import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Loader, Package, ShoppingBag, Stethoscope, ChevronRight, Utensils } from 'lucide-react';
import { database } from '../utils/database';

const UserDashboard = ({ user, onClose }) => {
    const [appointments, setAppointments] = useState([]);
    const [orders, setOrders] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('appointments');

    useEffect(() => {
        if (user) {
            loadUserData();
        }
    }, [user]);

    const loadUserData = async () => {
        try {
            setLoading(true);

            // Fetch data using our unified database utility (now MongoDB)
            const [appointmentsData, ordersData, feedbackData] = await Promise.all([
                database.getAppointments(null, user.email),
                database.getOrders(user.email),
                database.getFeedback(user.email)
            ]);

            setAppointments(appointmentsData || []);
            setOrders(ordersData || []);
            // For now, bookings are mixed in appointments in our MongoDB schema
            setBookings(appointmentsData.filter(a => a.type === 'table') || []);
            setFeedback(feedbackData || []);
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';

        // Handle natural language dates from AI
        const lower = dateString.toLowerCase();
        if (lower.includes('tomorrow')) return 'Tomorrow';
        if (lower.includes('today')) return 'Today';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Return as-is if it's natural language (e.g. "Next Monday")

        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        return timeString;
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

    return (
        <div className="min-h-screen bg-[#F8FAFC] relative">
            <div className="max-w-6xl mx-auto px-4 pt-24 pb-20 relative z-10">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                    {/* Header */}
                    <div className="p-6 md:p-8 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">My Dashboard</h1>
                                <p className="text-slate-500">
                                    Welcome back, <span className="font-bold text-slate-900">{user.full_name || user.email}</span>
                                </p>
                            </div>
                            <div className="flex items-center space-x-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                                    <User size={20} />
                                </div>
                                <div className="pr-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logged in as</p>
                                    <p className="text-sm font-bold text-slate-700">{user.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
                        {/* Sidebar */}
                        <div className="lg:col-span-3 border-r border-slate-200 bg-slate-50/50">
                            <nav className="p-4 space-y-1">
                                <TabButton
                                    active={activeTab === 'appointments'}
                                    onClick={() => setActiveTab('appointments')}
                                    icon={<Calendar size={18} />}
                                    label="Appointments"
                                    count={appointments.length - bookings.length}
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
                                    label="Orders"
                                    count={orders.length}
                                />
                                <TabButton
                                    active={activeTab === 'feedback'}
                                    onClick={() => setActiveTab('feedback')}
                                    icon={<span>⭐</span>}
                                    label="Feedback"
                                    count={feedback.length}
                                />
                            </nav>
                        </div>

                        {/* Content */}
                        <div className="lg:col-span-9">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 md:p-8"
                            >
                                {activeTab === 'appointments' && (
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 mb-6">Your Appointments</h2>
                                        {appointments.filter(a => a.type !== 'table').length === 0 ? (
                                            <EmptyState icon={<Calendar size={40} />} message="No upcoming appointments" />
                                        ) : (
                                            <div className="space-y-3">
                                                {appointments.filter(a => a.type !== 'table').map((appointment) => (
                                                    <div key={appointment._id} className="group p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:border-purple-300 hover:shadow-sm transition-all bg-white">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-purple-50 transition-colors">
                                                                {appointment.type === 'doctor' ? <Stethoscope size={20} className="text-blue-500" /> : <Calendar size={20} className="text-purple-500" />}
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-slate-900 text-sm">{appointment.entity_name}</h3>
                                                                <div className="flex items-center space-x-2 mt-1">
                                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getStatusStyle(appointment.status)}`}>{appointment.status}</span>
                                                                    <span className="text-[10px] text-slate-400 font-medium">Ref: {appointment._id.slice(-6).toUpperCase()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex flex-col items-end">
                                                            <div className="flex items-center text-slate-900 font-bold text-sm">
                                                                <Calendar size={14} className="mr-1.5 text-slate-400" />
                                                                {formatDate(appointment.date)}
                                                            </div>
                                                            <div className="flex items-center text-slate-500 text-xs mt-1">
                                                                <Clock size={12} className="mr-1 text-slate-400" />
                                                                {formatTime(appointment.time)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'bookings' && (
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 mb-6">Table Bookings</h2>
                                        {bookings.length === 0 ? (
                                            <EmptyState icon={<Utensils size={40} />} message="No table reservations" />
                                        ) : (
                                            <div className="space-y-3">
                                                {bookings.map((booking) => (
                                                    <div key={booking._id} className="group p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:border-orange-300 hover:shadow-sm transition-all bg-white">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                                                                <Utensils size={20} className="text-orange-500" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-slate-900 text-sm">{booking.entity_name}</h3>
                                                                <div className="flex items-center space-x-2 mt-1">
                                                                    <span className="text-[10px] text-slate-500 font-bold bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">Party of {booking.user_info?.party_size || 1}</span>
                                                                    <span className="text-[10px] text-slate-400 font-medium tracking-tight">Booking confirmed</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex flex-col items-end">
                                                            <div className="flex items-center text-slate-900 font-bold text-sm">
                                                                <Calendar size={14} className="mr-1.5 text-slate-400" />
                                                                {formatDate(booking.date)}
                                                            </div>
                                                            <div className="flex items-center text-slate-500 text-xs mt-1">
                                                                <Clock size={12} className="mr-1 text-slate-400" />
                                                                {formatTime(booking.time)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'orders' && (
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 mb-6">Your Orders</h2>
                                        {orders.length === 0 ? (
                                            <EmptyState icon={<ShoppingBag size={40} />} message="No orders placed" />
                                        ) : (
                                            <div className="space-y-3">
                                                {orders.map((order) => (
                                                    <div key={order._id} className="group p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:border-green-300 hover:shadow-sm transition-all bg-white">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-green-50 transition-colors">
                                                                <ShoppingBag size={20} className="text-green-500" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-slate-900 text-sm">{order.item}</h3>
                                                                <div className="flex items-center space-x-2 mt-1">
                                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getStatusStyle(order.status)}`}>{order.status}</span>
                                                                    <span className="text-[10px] text-slate-400 font-medium">Qty: {order.quantity || 1}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-base font-bold text-slate-900">₹{order.total_price}</p>
                                                            <p className="text-[10px] text-slate-400 mt-1 font-medium italic">#{order.id?.slice(-8) || order._id?.slice(-8)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'feedback' && (
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 mb-6">Your Feedback</h2>
                                        {feedback.length === 0 ? (
                                            <EmptyState icon={<div className="text-4xl">⭐</div>} message="No feedback given yet" />
                                        ) : (
                                            <div className="space-y-4">
                                                {feedback.map((item) => (
                                                    <div key={item._id} className="group p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-300 transition-all shadow-sm">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-8 h-8 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-xs group-hover:bg-amber-50 group-hover:border-amber-100 transition-colors">🏢</div>
                                                                <div>
                                                                    <h3 className="font-bold text-slate-900 text-sm">{item.entity_name}</h3>
                                                                    <p className="text-[10px] text-slate-400 font-medium">{formatDate(item.created_at)}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-0.5">
                                                                {[...Array(5)].map((_, i) => (<span key={i} className={`text-sm ${i < item.rating ? "text-amber-400" : "text-slate-200"}`}>★</span>))}
                                                            </div>
                                                        </div>
                                                        <div className="mt-2.5 pl-11">
                                                            <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50 italic">"{item.comment}"</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label, count }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${active ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-600 hover:bg-white'}`}
    >
        {icon}
        <span>{label}</span>
        {count > 0 && <span className={`ml-auto px-2 py-0.5 rounded-md text-[10px] ${active ? 'bg-purple-500 text-white' : 'bg-slate-200 text-slate-700'}`}>{count}</span>}
    </button>
);

const EmptyState = ({ icon, message }) => (
    <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
        <div className="flex items-center justify-center text-slate-300 mb-4">{icon}</div>
        <h3 className="text-lg font-bold text-slate-900">{message}</h3>
    </div>
);

export default UserDashboard;
