import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const AuthModal = ({ isOpen, onClose, onSuccess, mode = 'signin' }) => {
    const [authMode, setAuthMode] = useState(mode); // 'signin' or 'signup'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        address: '',
        preferredLanguage: 'en-US'
    });

    const languages = [
        { code: 'en-US', name: 'English' },
        { code: 'hi-IN', name: 'Hindi (हिंदी)' },
        { code: 'te-IN', name: 'Telugu (తెలుగు)' },
        { code: 'ta-IN', name: 'Tamil (தமிழ்)' },
        { code: 'kn-IN', name: 'Kannada (ಕನ್ನಡ)' },
        { code: 'ml-IN', name: 'Malayalam (മലയാളം)' },
        { code: 'mr-IN', name: 'Marathi (मराठी)' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (authMode === 'signup') {
                // Sign up new user
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.fullName,
                            phone: formData.phone,
                            preferred_language: formData.preferredLanguage
                        }
                    }
                });

                if (authError) throw authError;

                // Insert additional user data
                if (authData.user) {
                    const { error: insertError } = await supabase
                        .from('users')
                        .insert([{
                            id: authData.user.id,
                            email: formData.email,
                            full_name: formData.fullName,
                            phone: formData.phone,
                            date_of_birth: formData.dateOfBirth || null,
                            gender: formData.gender || null,
                            address: formData.address || null,
                            preferred_language: formData.preferredLanguage,
                            email_verified: false
                        }]);

                    if (insertError) console.warn('User profile creation warning:', insertError);
                }

                alert('Sign up successful! Please check your email to verify your account.');
                setAuthMode('signin');
            } else {
                // Sign in existing user
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password
                });

                if (signInError) throw signInError;

                // Update last login
                if (data.user) {
                    await supabase
                        .from('users')
                        .update({ last_login: new Date().toISOString() })
                        .eq('id', data.user.id);
                }

                onSuccess(data.user);
                onClose();
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
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-bold text-gradient-purple">
                            {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-text-gray hover:text-text-dark transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Sign Up Fields */}
                        {authMode === 'signup' && (
                            <>
                                <div>
                                    <label className="flex items-center space-x-2 text-sm font-medium text-text-dark mb-2">
                                        <User size={16} />
                                        <span>Full Name</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-purple-primary focus:outline-none text-text-dark"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                            </>
                        )}

                        {/* Common Fields */}
                        <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-text-dark mb-2">
                                <Mail size={16} />
                                <span>Email</span>
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-purple-primary focus:outline-none text-text-dark"
                                placeholder="your.email@example.com"
                            />
                        </div>

                        <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-text-dark mb-2">
                                <Lock size={16} />
                                <span>Password</span>
                            </label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-purple-primary focus:outline-none text-text-dark"
                                placeholder="Enter your password"
                                minLength={6}
                            />
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            className="w-full px-6 py-4 rounded-xl bg-gradient-purple text-white font-bold text-lg shadow-premium hover:shadow-premium-lg transition-all disabled:opacity-50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {loading ? 'Please wait...' : authMode === 'signin' ? 'Sign In' : 'Sign Up'}
                        </motion.button>
                    </form>

                    {/* Toggle Mode */}
                    <div className="mt-6 text-center">
                        <p className="text-text-gray text-sm">
                            {authMode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                            <button
                                onClick={toggleMode}
                                className="text-purple-primary font-semibold hover:underline"
                            >
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
