import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
    const icons = {
        success: <CheckCircle className="text-emerald-500" size={16} />,
        error: <XCircle className="text-rose-500" size={16} />,
        warning: <AlertCircle className="text-amber-500" size={16} />,
        info: <Info className="text-blue-500" size={16} />,
    };

    const bgColors = {
        success: 'bg-emerald-50 border-emerald-100',
        error: 'bg-rose-50 border-rose-100',
        warning: 'bg-amber-50 border-amber-100',
        info: 'bg-blue-50 border-blue-100',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`flex items-center gap-3 px-4 py-2 rounded-xl border shadow-lg ${bgColors[type]} pointer-events-auto min-w-[280px] max-w-sm`}
        >
            <div className="shrink-0">{icons[type]}</div>
            <p className="flex-1 text-[11px] font-black text-slate-800 tracking-tight leading-tight">{message}</p>
            <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-md transition-colors text-slate-400">
                <X size={14} />
            </button>
        </motion.div>
    );
};

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default Toast;
