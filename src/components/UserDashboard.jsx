import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, User, Loader, Package, ShoppingBag, Stethoscope, ChevronRight, Utensils } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

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

            // Fetch user appointments
            const { data: appointmentsData, error: appointmentsError } = await supabase
                .from('appointments')
                .select(`
          *,
          companies:entity_id (name, industry)
        `)
                .eq('user_email', user.email)
                .order('appointment_date', { ascending: false });

            if (appointmentsError) throw appointmentsError;

            // Fetch user orders
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select(`
          *,
          companies:company_id (name, industry)
        `)
                .eq('user_email', user.email)
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            // Fetch restaurant bookings
            const { data: bookingsData, error: bookingsError } = await supabase
                .from('restaurant_bookings')
                .select('*')
                .eq('user_email', user.email)
                .order('booking_date', { ascending: false });

            if (bookingsError) throw bookingsError;

            // Fetch feedback
            const { data: feedbackData, error: feedbackError } = await supabase
                .from('feedbacks')
                .select('*')
                .eq('user_email', user.email)
                .order('created_at', { ascending: false });

            if (feedbackError) throw feedbackError;

            setAppointments(appointmentsData || []);
            setOrders(ordersData || []);
            setBookings(bookingsData || []);
            setFeedback(feedbackData || []);
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getStatusStyle = (status) => {
        const styles = {
            scheduled: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
            'no-show': 'bg-slate-50 text-slate-700 border-slate-200',
            pending: 'bg-amber-50 text-amber-700 border-amber-200',
            processing: 'bg-blue-50 text-blue-700 border-blue-200',
            paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
        return styles[status] || 'bg-slate-50 text-slate-700 border-slate-200';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <Loader size={48} className="animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Brewing your data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] relative">
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-100 rounded-full blur-[120px] opacity-40"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-blue-100 rounded-full blur-[120px] opacity-40"></div>
            </div>

            <div className="max-w-6xl mx-auto px-4 pt-24 pb-20 relative z-10">
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-300 overflow-hidden">
                    <div className="p-8 md:p-10 border-b border-slate-300 relative overflow-hidden bg-gradient-to-r from-white to-slate-50/50">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">My Dashboard</h1>
                                <p className="text-slate-500 text-lg">
                                    Welcome back, <span className="font-bold text-slate-900">{user.user_metadata?.full_name || user.email}</span>
                                </p>
                            </div>
                            <div className="flex items-center space-x-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm self-start md:self-center">
                                <div className="w-10 h-10 rounded-xl bg-[#000080]/10 flex items-center justify-center text-[#000080]">
                                    <User size={20} />
                                </div>
                                <div className="pr-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged in as</p>
                                    <p className="text-sm font-bold text-slate-700">{user.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
                        <div className="lg:col-span-3 border-r border-slate-300 bg-slate-50/50">
                            <div className="p-6">
                                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 px-2">Overview</h3>
                                <nav className="space-y-2">
                                    <button
                                        onClick={() => setActiveTab('appointments')}
                                        className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all duration-300 font-bold text-sm ${activeTab === 'appointments' ? 'bg-[#000080] text-white shadow-xl' : 'text-slate-600 hover:bg-white'}`}
                                    >
                                        <Calendar size={18} />
                                        <span>Appointments</span>
                                        <span className="ml-auto px-2 py-0.5 rounded-md text-[10px] bg-slate-200 text-slate-700">{appointments.length}</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('bookings')}
                                        className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all duration-300 font-bold text-sm ${activeTab === 'bookings' ? 'bg-[#000080] text-white shadow-xl' : 'text-slate-600 hover:bg-white'}`}
                                    >
                                        <Utensils size={18} />
                                        <span>Table Bookings</span>
                                        <span className="ml-auto px-2 py-0.5 rounded-md text-[10px] bg-slate-200 text-slate-700">{bookings.length}</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('orders')}
                                        className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all duration-300 font-bold text-sm ${activeTab === 'orders' ? 'bg-[#000080] text-white shadow-xl' : 'text-slate-600 hover:bg-white'}`}
                                    >
                                        <ShoppingBag size={18} />
                                        <span>Orders</span>
                                        <span className="ml-auto px-2 py-0.5 rounded-md text-[10px] bg-slate-200 text-slate-700">{orders.length}</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('feedback')}
                                        className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all duration-300 font-bold text-sm ${activeTab === 'feedback' ? 'bg-[#000080] text-white shadow-xl' : 'text-slate-600 hover:bg-white'}`}
                                    >
                                        <div className="flex items-center justify-center w-[18px]">⭐</div>
                                        <span>Feedback</span>
                                        <span className="ml-auto px-2 py-0.5 rounded-md text-[10px] bg-slate-200 text-slate-700">{feedback.length}</span>
                                    </button>
                                </nav>
                            </div>
                        </div>

                        <div className="lg:col-span-9 bg-white p-8 md:p-10">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {activeTab === 'appointments' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between mb-8">
                                            <h2 className="text-2xl font-black text-slate-900 leading-none">Your Appointments</h2>
                                        </div>
                                        {appointments.length === 0 ? (
                                            <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
                                                <Calendar size={40} className="text-slate-300 mx-auto mb-4" />
                                                <h3 className="text-xl font-bold text-slate-900 mb-2">No upcoming appointments</h3>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4">
                                                {appointments.map((appointment) => (
                                                    <div key={appointment.id} className="p-6 rounded-[2rem] border border-slate-200 hover:bg-slate-50/50 transition-all flex items-center justify-between">
                                                        <div className="flex items-center space-x-5">
                                                            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                                                {appointment.type === 'doctor' ? <Stethoscope size={26} className="text-[#000080]" /> : <Calendar size={26} className="text-[#000080]" />}
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-black text-slate-900">{appointment.companies?.name || appointment.entity_name}</h3>
                                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border tracking-wider mt-1 inline-block ${getStatusStyle(appointment.status)}`}>{appointment.status.toUpperCase()}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex items-center space-x-6">
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-700">{formatDate(appointment.appointment_date)}</p>
                                                                <p className="text-xs text-slate-500 font-bold">{formatTime(appointment.appointment_time)}</p>
                                                            </div>
                                                            <ChevronRight size={20} className="text-slate-300" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'bookings' && (
                                    <div className="space-y-6">
                                        <h2 className="text-2xl font-black text-slate-900 mb-8">Table Bookings</h2>
                                        {bookings.length === 0 ? (
                                            <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
                                                <Utensils size={40} className="text-slate-300 mx-auto mb-4" />
                                                <h3 className="text-xl font-bold text-slate-900 mb-2">No table reservations</h3>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4">
                                                {bookings.map((booking) => (
                                                    <div key={booking.id} className="p-6 rounded-[2rem] border border-slate-200 hover:bg-slate-50/50 transition-all flex items-center justify-between">
                                                        <div className="flex items-center space-x-5">
                                                            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm"><Utensils size={26} className="text-[#000080]" /></div>
                                                            <div>
                                                                <h3 className="text-lg font-black text-slate-900">{booking.restaurant_name}</h3>
                                                                <span className="text-slate-500 text-xs font-bold uppercase">{booking.party_size} People</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-slate-700">{formatDate(booking.booking_date)}</p>
                                                            <p className="text-xs text-slate-500 font-bold">{formatTime(booking.booking_time)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'orders' && (
                                    <div className="space-y-6">
                                        <h2 className="text-2xl font-black text-slate-900 mb-8">Your Orders</h2>
                                        {orders.length === 0 ? (
                                            <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
                                                <ShoppingBag size={40} className="text-slate-300 mx-auto mb-4" />
                                                <h3 className="text-xl font-bold text-slate-900 mb-2">No orders placed</h3>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4">
                                                {orders.map((order) => (
                                                    <div key={order.id} className="p-6 rounded-[2rem] border border-slate-200 hover:bg-slate-50/50 transition-all flex items-center justify-between">
                                                        <div className="flex items-center space-x-5">
                                                            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm"><ShoppingBag size={26} className="text-[#000080]" /></div>
                                                            <div>
                                                                <h3 className="text-lg font-black text-slate-900">Order #{order.id}</h3>
                                                                <p className="text-xs text-slate-500 font-bold uppercase">{order.item} × {order.quantity}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xl font-black text-slate-900 leading-none">₹{order.total_price}</p>
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black border mt-2 inline-block ${getStatusStyle(order.status)}`}>{order.status.toUpperCase()}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'feedback' && (
                                    <div className="space-y-6">
                                        <h2 className="text-2xl font-black text-slate-900 mb-8">Your Feedback</h2>
                                        {feedback.length === 0 ? (
                                            <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
                                                <div className="text-4xl mb-4">⭐</div>
                                                <h3 className="text-xl font-bold text-slate-900 mb-2">No feedback given yet</h3>
                                            </div>
                                        ) : (
                                            <div className="grid gap-6">
                                                {feedback.map((item) => (
                                                    <div key={item.id} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-200">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center space-x-4">
                                                                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm text-xl">🏢</div>
                                                                <div>
                                                                    <h3 className="text-lg font-black text-slate-900">{item.entity_name}</h3>
                                                                    <p className="text-xs text-slate-500 font-bold">{formatDate(item.created_at)}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-1 bg-white px-3 py-1.5 rounded-full border border-slate-200">
                                                                {[...Array(5)].map((_, i) => (<span key={i} className={i < item.rating ? "text-amber-400" : "text-slate-200"}>★</span>))}
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 text-slate-600 font-medium italic">"{item.comment}"</div>
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

export default UserDashboard;
