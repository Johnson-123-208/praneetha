import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User } from 'lucide-react';

const API_URL = (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '/api' : 'http://localhost:5000/api');

const AuthModal = ({ isOpen, onClose, onSuccess, mode = 'signin' }) => {
    const [authMode, setAuthMode] = useState(mode);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        preferredLanguage: 'en-US'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (authMode === 'signup') {
                const res = await fetch(`${API_URL}/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password,
                        full_name: formData.fullName,
                        phone: formData.phone,
                        preferred_language: formData.preferredLanguage
                    })
                }).catch(() => null);

                if (res && res.ok) {
                    const data = await res.json();
                    alert('Sign up successful! You can now sign in.');
                    setAuthMode('signin');
                } else {
                    // Local Fallback for standalone demo
                    const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
                    localUsers.push({
                        email: formData.email,
                        password: formData.password,
                        full_name: formData.fullName,
                        phone: formData.phone,
                        preferred_language: formData.preferredLanguage
                    });
                    localStorage.setItem('local_users', JSON.stringify(localUsers));
                    alert('Sign up successful (DEMO MODE)! You can now sign in.');
                    setAuthMode('signin');
                }
            } else {
                const res = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password
                    })
                }).catch(() => null);

                if (res && res.ok) {
                    const data = await res.json();
                    localStorage.setItem('user', JSON.stringify(data.user));
                    onSuccess(data.user);
                    onClose();
                } else {
                    // Local Fallback for standalone demo
                    const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
                    const user = localUsers.find(u => u.email === formData.email && u.password === formData.password);

                    // Specific bypass for demo - any login works if no local users exist
                    const demoUser = user || {
                        email: formData.email,
                        full_name: 'Guest User',
                        preferred_language: 'en-US',
                        isDemo: true
                    };

                    localStorage.setItem('user', JSON.stringify(demoUser));
                    onSuccess(demoUser);
                    onClose();
                }
            }
        } catch (err) {
            console.error('Auth error:', err);
            setError(err.message || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
        setError('');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-premium-lg"
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
                            {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {authMode === 'signup' && (
                            <div>
                                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                    <User size={16} />
                                    <span>Full Name</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="Enter your name"
                                />
                            </div>
                        )}

                        <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                <Mail size={16} />
                                <span>Email</span>
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                <Lock size={16} />
                                <span>Password</span>
                            </label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="••••••••"
                                minLength={6}
                                autoComplete="current-password"
                            />
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {loading ? 'Please wait...' : authMode === 'signin' ? 'Sign In' : 'Sign Up'}
                        </motion.button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600 text-sm">
                            {authMode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                            <button onClick={toggleMode} className="text-purple-600 font-semibold hover:underline">
                                {authMode === 'signin' ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AuthModal;
