import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('rigmind_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem('rigmind_token') || '');

    const login = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('rigmind_user', JSON.stringify(userData));
        localStorage.setItem('rigmind_token', authToken);
    };

    const logout = () => {
        setUser(null);
        setToken('');
        localStorage.removeItem('rigmind_user');
        localStorage.removeItem('rigmind_token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: Boolean(token && user) }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
