import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, User, Loader, Package, ShoppingBag, Stethoscope, ChevronRight } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const UserDashboard = ({ user, onClose }) => {
    const [appointments, setAppointments] = useState([]);
    const [orders, setOrders] = useState([]);
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
          companies:entity_id (name, industry),
          doctors:doctor_id (name, specialization)
        `)
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (appointmentsError) throw appointmentsError;

            // Fetch user orders
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select(`
          *,
          companies:company_id (name, industry)
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            setAppointments(appointmentsData || []);
            setOrders(ordersData || []);
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
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
            paid: 'bg-emerald-50 text-emerald-700 border-emerald-100'
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
            {/* Background Orbs */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-100 rounded-full blur-[120px] opacity-40"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-blue-100 rounded-full blur-[120px] opacity-40"></div>
            </div>

            <div className="max-w-6xl mx-auto px-4 pt-24 pb-20 relative z-10 transition-all duration-500">
                {/* Unified Dashboard Container */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-300 overflow-hidden">

                    {/* Integrated Header Section */}
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
                        {/* Decorative pattern */}
                        <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.02] pointer-events-none translate-x-1/4 -translate-y-1/4">
                            <div className="w-full h-full border-[40px] border-[#000080] rounded-full"></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
                        {/* Integrated Vertical Sidebar */}
                        <div className="lg:col-span-3 border-r border-slate-300 bg-slate-50/50">
                            <div className="p-6">
                                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 px-2">Overview</h3>
                                <nav className="space-y-2">
                                    <button
                                        onClick={() => setActiveTab('appointments')}
                                        className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all duration-300 font-bold text-sm ${activeTab === 'appointments'
                                            ? 'bg-[#000080] text-white shadow-xl shadow-blue-900/20'
                                            : 'text-slate-600 hover:bg-white hover:shadow-md hover:text-slate-900 border border-transparent'
                                            }`}
                                    >
                                        <Calendar size={18} />
                                        <span>Appointments</span>
                                        <span className={`ml-auto px-2 py-0.5 rounded-md text-[10px] ${activeTab === 'appointments' ? 'bg-white/20' : 'bg-slate-200 text-slate-700'
                                            }`}>
                                            {appointments.length}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('orders')}
                                        className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all duration-300 font-bold text-sm ${activeTab === 'orders'
                                            ? 'bg-[#000080] text-white shadow-xl shadow-blue-900/20'
                                            : 'text-slate-500 hover:bg-white hover:shadow-md hover:text-slate-900 border border-transparent'
                                            }`}
                                    >
                                        <ShoppingBag size={18} />
                                        <span>Orders</span>
                                        <span className={`ml-auto px-2 py-0.5 rounded-md text-[10px] ${activeTab === 'orders' ? 'bg-white/20' : 'bg-slate-200 text-slate-700'
                                            }`}>
                                            {orders.length}
                                        </span>
                                    </button>
                                </nav>

                                <div className="mt-12 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-3 relative z-10">Quick Tip</p>
                                    <p className="text-xs text-slate-600 leading-relaxed relative z-10 font-medium">Use our AI agent to schedule meetings or place orders instantly via voice calls.</p>
                                    <div className="absolute bottom-[-10px] right-[-10px] text-[#000080]/5 rotate-12">
                                        <ShoppingBag size={64} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Integrated Content Area */}
                        <div className="lg:col-span-9 bg-white p-8 md:p-10">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {activeTab === 'appointments' ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between mb-8">
                                            <h2 className="text-2xl font-black text-slate-900 leading-none">Your Appointments</h2>
                                            <span className="text-sm font-bold text-slate-500 bg-slate-50 px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                                                {appointments.length} active schedules
                                            </span>
                                        </div>

                                        {appointments.length === 0 ? (
                                            <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
                                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                                                    <Calendar size={40} className="text-slate-300" />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-900 mb-2">No upcoming appointments</h3>
                                                <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed font-medium">Your scheduled calls and meetings will appear here once booked.</p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4">
                                                {appointments.map((appointment, index) => (
                                                    <div
                                                        key={appointment.id}
                                                        className="group p-6 rounded-[2rem] border border-slate-200 hover:border-[#000080]/30 hover:bg-slate-50/50 transition-all duration-300"
                                                    >
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                            <div className="flex items-center space-x-5">
                                                                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:border-[#000080]/20 transition-all">
                                                                    {appointment.appointment_type === 'doctor' ? (
                                                                        <Stethoscope className="text-[#000080]" size={26} />
                                                                    ) : (
                                                                        <Calendar className="text-[#000080]" size={26} />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-lg font-black text-slate-900 mb-1">
                                                                        {appointment.companies?.name || appointment.entity_name}
                                                                    </h3>
                                                                    <div className="flex items-center space-x-2">
                                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border tracking-wider ${getStatusStyle(appointment.status)}`}>
                                                                            {appointment.status.toUpperCase()}
                                                                        </span>
                                                                        <span className="text-slate-300">•</span>
                                                                        <span className="text-slate-500 text-xs font-bold uppercase tracking-tight">
                                                                            {appointment.appointment_type === 'doctor' ? 'Healthcare' : 'Business'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center md:space-x-8 space-x-4">
                                                                <div className="text-left md:text-right">
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Schedule</p>
                                                                    <p className="text-sm font-bold text-slate-700">{formatDate(appointment.date)}</p>
                                                                    <p className="text-xs text-slate-500 font-bold">{formatTime(appointment.time)}</p>
                                                                </div>
                                                                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-[#000080] group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-900/20 transition-all">
                                                                    <ChevronRight size={20} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between mb-8">
                                            <h2 className="text-2xl font-black text-slate-900 leading-none">Your Orders</h2>
                                            <span className="text-sm font-bold text-slate-500 bg-slate-50 px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                                                {orders.length} total orders
                                            </span>
                                        </div>

                                        {orders.length === 0 ? (
                                            <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
                                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                                                    <Package size={40} className="text-slate-300" />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-900 mb-2">No orders placed</h3>
                                                <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed font-medium">Place an order through our AI agent to see it here.</p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4">
                                                {orders.map((order, index) => (
                                                    <div
                                                        key={order.id}
                                                        className="group p-6 rounded-[2.5rem] border border-slate-200 hover:border-[#000080]/30 hover:bg-slate-50/50 transition-all duration-300"
                                                    >
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                            <div className="flex items-center space-x-5">
                                                                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:border-[#000080]/20 transition-all">
                                                                    <ShoppingBag className="text-[#000080]" size={26} />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-lg font-black text-slate-900 mb-1">
                                                                        Order #{order.id}
                                                                    </h3>
                                                                    <div className="flex items-center space-x-2">
                                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border tracking-wider ${getStatusStyle(order.status)}`}>
                                                                            {order.status.toUpperCase()}
                                                                        </span>
                                                                        <span className="text-slate-300">•</span>
                                                                        <span className="text-slate-500 text-xs font-bold uppercase tracking-tight">
                                                                            {order.companies?.name}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center md:space-x-8 space-x-4">
                                                                <div className="text-left md:text-right">
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Value</p>
                                                                    <p className="text-xl font-black text-slate-900 tracking-tighter">
                                                                        {order.currency} {order.total_price || (order.unit_price * order.quantity).toFixed(2)}
                                                                    </p>
                                                                    <p className="text-xs text-slate-500 font-bold">{order.item} × {order.quantity}</p>
                                                                </div>
                                                                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#000080] group-hover:text-white transition-all">
                                                                    <ChevronRight size={20} />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {order.delivery_address && (
                                                            <div className="mt-6 pt-5 border-t border-slate-200 flex items-start space-x-4">
                                                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#000080]/10 group-hover:text-[#000080] transition-colors border border-slate-100">
                                                                    <MapPin size={14} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination</p>
                                                                    <p className="text-sm text-slate-700 font-bold leading-tight">{order.delivery_address}</p>
                                                                </div>
                                                            </div>
                                                        )}
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
