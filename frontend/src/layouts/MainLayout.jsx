import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWell } from '../context/WellContext';
import {
    Activity,
    Compass,
    Layers,
    BookOpen,
    ShieldAlert,
    LogOut,
    Sun,
    Moon,
    Radio,
    FileText,
    AlertTriangle,
    ChevronRight
} from 'lucide-react';

export default function MainLayout() {
    const { user, logout } = useAuth();
    const { isSimulating, currentTelemetry, activeWell } = useWell();
    const location = useLocation();
    const navigate = useNavigate();

    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('rigmind_theme');
        return saved !== null ? saved === 'dark' : true;
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('rigmind_theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('rigmind_theme', 'light');
        }
    }, [darkMode]);

    const toggleTheme = () => {
        setDarkMode(prev => !prev);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isFieldEngineer = user?.role === 'FIELD_ENGINEER';
    const isDataAdmin = user?.role === 'DATA_ADMIN';

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors duration-200`}>
            {/* Top Engineering Status Header */}
            <header className="bg-white/95 border-b border-slate-200 shadow-xs backdrop-blur dark:bg-slate-900/90 dark:border-slate-800 sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link to="/initialize" className="flex items-center space-x-2.5">
                        <div className="bg-blue-50 p-2 rounded-lg border border-blue-200 text-blue-600 dark:bg-cyan-500/20 dark:border-cyan-500/40 dark:text-cyan-400">
                            <Activity className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <span className="text-lg font-bold tracking-tight text-slate-900 dark:bg-gradient-to-r dark:from-cyan-400 dark:to-blue-500 dark:bg-clip-text dark:text-transparent">
                                RigMind-NWIS
                            </span>
                        </div>
                    </Link>

                    {activeWell && (
                        <div className="hidden md:flex items-center space-x-2 text-xs font-mono bg-slate-100 px-3 py-1 rounded-md border border-slate-200 text-slate-700 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200">
                            <span className="text-slate-400 dark:text-slate-400">WELL:</span>
                            <span className="text-blue-700 dark:text-cyan-400 font-semibold">{activeWell.wellName}</span>
                            <span className="text-slate-300 dark:text-slate-500">|</span>
                            <span className="text-slate-400 dark:text-slate-400">LAT/LON:</span>
                            <span className="text-slate-700 dark:text-slate-200">{activeWell.latitude}, {activeWell.longitude}</span>
                        </div>
                    )}
                </div>

                {/* Telemetry Stream Badge & User Controls */}
                <div className="flex items-center space-x-3">
                    <div className={`flex items-center space-x-2 text-xs px-2.5 py-1 rounded-full font-mono font-medium border ${isSimulating
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-700/60 animate-pulse'
                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}>
                        <Radio className={`w-3.5 h-3.5 ${isSimulating ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                        <span>{isSimulating ? 'TELEMETRY LIVE (2s)' : 'TELEMETRY IDLE'}</span>
                        {currentTelemetry && (
                            <span className="text-emerald-700 dark:text-emerald-300 font-bold ml-1">[{currentTelemetry.depth}m]</span>
                        )}
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 dark:border-transparent transition"
                        title="Toggle Dark/Light Mode"
                    >
                        {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                    </button>

                    <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                        <div className="text-right text-xs">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{user?.fullName || 'Operator'}</p>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-blue-600 dark:text-cyan-400 font-bold">{user?.role}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/80 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/60 dark:border-red-800/50 transition"
                            title="Log Out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="bg-white border-b border-slate-200 px-4 py-1.5 flex space-x-1.5 overflow-x-auto text-xs font-medium dark:bg-slate-900 dark:border-slate-800">
                <Link
                    to="/initialize"
                    className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition ${location.pathname === '/initialize'
                            ? 'bg-blue-600 text-white font-semibold shadow-xs dark:bg-cyan-600 dark:text-white'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
                        }`}
                >
                    <Compass className="w-4 h-4" />
                    <span>Well Initialization</span>
                </Link>

                <Link
                    to="/subsurface-map"
                    className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition ${location.pathname === '/subsurface-map'
                            ? 'bg-blue-600 text-white font-semibold shadow-xs dark:bg-cyan-600 dark:text-white'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
                        }`}
                >
                    <Layers className="w-4 h-4" />
                    <span>3D Subsurface Map</span>
                </Link>

                <Link
                    to="/dashboard"
                    className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition ${location.pathname === '/dashboard'
                            ? 'bg-blue-600 text-white font-semibold shadow-xs dark:bg-cyan-600 dark:text-white'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
                        }`}
                >
                    <Activity className="w-4 h-4" />
                    <span>Live Drilling Dashboard</span>
                </Link>

                <Link
                    to="/knowledge-base"
                    className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition ${location.pathname === '/knowledge-base'
                            ? 'bg-blue-600 text-white font-semibold shadow-xs dark:bg-cyan-600 dark:text-white'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
                        }`}
                >
                    <BookOpen className="w-4 h-4" />
                    <span>Historical Knowledge Base</span>
                </Link>

                {isDataAdmin && (
                    <Link
                        to="/admin"
                        className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition ${location.pathname === '/admin'
                                ? 'bg-amber-600 text-white font-semibold shadow-xs dark:bg-amber-600 dark:text-white'
                                : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-slate-800'
                            }`}
                    >
                        <FileText className="w-4 h-4" />
                        <span>Data Admin Portal</span>
                    </Link>
                )}
            </nav>

            {/* Main Application Body */}
            <main className="flex-1 p-4 overflow-y-auto">
                <Outlet />
            </main>

            {/* Engineering Disclaimer Footer */}
            <footer className="bg-white border-t border-slate-200 px-4 py-2 text-[11px] text-slate-500 dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                    <span>
                        <strong>Prototype Notice:</strong> Synthetic Demonstration Data & Simulated Real-Time Telemetry. AI-assisted decision support system for Oil India Limited (SIH 2026).
                    </span>
                </div>
                <div className="font-mono text-slate-400 dark:text-slate-500">
                    RigMind-NWIS v1.0.0 | PostGIS & RAG Decision Engine
                </div>
            </footer>
        </div>
    );
}
