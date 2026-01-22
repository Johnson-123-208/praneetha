import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Package, Clock, ExternalLink } from 'lucide-react';
import { database } from '../utils/database.js';

const OperationsLog = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadOrders();
    
    // Refresh every 1 second for real-time updates
    const interval = setInterval(loadOrders, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = () => {
    const orderList = database.getOrders();
    setOrders(orderList);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCompanyName = (companyId) => {
    if (!companyId) return 'Unknown';
    const company = database.getCompany(companyId);
    return company ? company.name : 'Unknown';
  };

  return (
    <section id="operations" className="py-20 px-4 relative z-10 bg-deep-navy/50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Activity className="text-electric-cyan" size={32} />
            <h2 className="text-4xl md:text-5xl font-bold text-gradient-cyan">
              Operations Log
            </h2>
          </div>
          <p className="text-white/60 text-lg">
            Live dashboard of voice-booked orders
          </p>
        </motion.div>

        {orders.length === 0 ? (
          <motion.div
            className="text-center py-12 glass rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Package size={64} className="mx-auto mb-4 text-white/40" />
            <p className="text-white/60">No orders yet.</p>
            <p className="text-white/40 text-sm mt-2">
              Orders will appear here as they are booked through voice interactions.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                className="glass-strong rounded-xl p-6 hover:border-electric-cyan/50 transition-all duration-300"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ scale: 1.01, x: 5 }}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-electric-cyan/20 flex items-center justify-center">
                      <Package className="text-electric-cyan" size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-white">
                          Order #{order.id}
                        </h3>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-electric-cyan/20 text-electric-cyan">
                          {order.status || 'completed'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white/80">
                          <span className="font-medium">Item:</span> {order.item}
                        </p>
                        <p className="text-white/80">
                          <span className="font-medium">Quantity:</span> {order.quantity}
                        </p>
                        <p className="text-white/60 text-sm flex items-center space-x-2">
                          <Clock size={14} />
                          <span>{formatTimestamp(order.timestamp)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm text-white/60 mb-1">Company</p>
                      <p className="font-medium text-electric-cyan">
                        {getCompanyName(order.companyId)}
                      </p>
                    </div>
                    <motion.button
                      className="p-2 rounded-lg glass border border-white/20 hover:border-electric-cyan transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="View Company"
                    >
                      <ExternalLink size={20} className="text-white/60" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default OperationsLog;