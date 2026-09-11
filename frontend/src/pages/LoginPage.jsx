import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, UserCheck, Key, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const [username, setUsername] = useState('field_eng');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleQuickRoleSelect = (roleUsername) => {
        setUsername(roleUsername);
        setPassword('password123');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setError(data.error || 'Invalid username or password');
                setLoading(false);
                return;
            }

            login(data.user, data.token);

            if (data.user.role === 'DATA_ADMIN') {
                navigate('/admin');
            } else {
                navigate('/initialize');
            }
        } catch (err) {
            // Server offline / network failure fallback for demo resilience
            if (password === 'password123' && (username === 'field_eng' || username === 'data_admin')) {
                if (username === 'data_admin') {
                    const mockUser = { id: 2, username: 'data_admin', role: 'DATA_ADMIN', fullName: 'Ananya Roy (Data Admin)' };
                    login(mockUser, 'mock_token_admin');
                    navigate('/admin');
                } else {
                    const mockUser = { id: 1, username: 'field_eng', role: 'FIELD_ENGINEER', fullName: 'Rohan Sharma (Field Engineer)' };
                    login(mockUser, 'mock_token_field');
                    navigate('/initialize');
                }
            } else {
                setError('Invalid username or password.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors">
            {/* Ambient Background Lights */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md bg-white border border-slate-200/90 dark:bg-slate-900/90 dark:border-slate-800 rounded-2xl shadow-xl p-6 md:p-8 backdrop-blur z-10 text-slate-900 dark:text-slate-100">
                {/* Header Logo */}
                <div className="flex flex-col items-center mb-6 text-center">
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-blue-600 dark:bg-cyan-500/20 dark:border-cyan-500/40 dark:text-cyan-400 mb-3">
                        <Activity className="w-8 h-8 animate-pulse" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">RigMind-NWIS</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                        AI-Powered Offset Well Knowledge & Decision Support Platform for Oil India Limited
                    </p>
                </div>

                {/* Role Switcher Shortcuts */}
                <div className="mb-6 bg-slate-50 dark:bg-slate-950/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <label className="block text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 mb-2 font-semibold">
                        Select Demo Role Preset:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => handleQuickRoleSelect('field_eng')}
                            className={`px-3 py-2 text-xs rounded-lg border text-left flex items-center justify-between transition ${
                                username === 'field_eng'
                                    ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-cyan-950 dark:border-cyan-500 dark:text-cyan-300 font-semibold shadow-xs'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700'
                            }`}
                        >
                            <span className="truncate">Field Engineer</span>
                            <UserCheck className="w-3.5 h-3.5 ml-1 shrink-0 text-blue-600 dark:text-cyan-400" />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickRoleSelect('data_admin')}
                            className={`px-3 py-2 text-xs rounded-lg border text-left flex items-center justify-between transition ${
                                username === 'data_admin'
                                    ? 'bg-amber-50 border-amber-500 text-amber-800 dark:bg-amber-950 dark:border-amber-500 dark:text-amber-300 font-semibold shadow-xs'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700'
                            }`}
                        >
                            <span className="truncate">Data Admin</span>
                            <ShieldCheck className="w-3.5 h-3.5 ml-1 shrink-0 text-amber-600 dark:text-amber-400" />
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 dark:bg-red-950/50 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Username
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-cyan-500 dark:focus:ring-0 transition"
                                placeholder="Enter username"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-cyan-500 dark:focus:ring-0 transition"
                                placeholder="Enter password"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-cyan-600 dark:to-blue-600 dark:hover:from-cyan-500 dark:hover:to-blue-500 text-white font-semibold text-xs py-2.5 rounded-lg shadow-sm flex items-center justify-center space-x-2 transition"
                    >
                        <span>{loading ? 'Authenticating...' : 'Sign In to RigMind'}</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-[11px] text-slate-500">
                        Default password: <code className="text-blue-600 dark:text-cyan-400 font-mono font-semibold">password123</code>
                    </p>
                </div>
            </div>
        </div>
    );
}
