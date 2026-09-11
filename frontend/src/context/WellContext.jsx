import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const WellContext = createContext();

export const WellProvider = ({ children }) => {
    const [activeWell, setActiveWell] = useState(() => {
        const saved = localStorage.getItem('rigmind_active_well');
        return saved ? JSON.parse(saved) : {
            wellId: 'ACTIVE-001',
            wellName: 'Active Well NHK-PROTOTYPE',
            latitude: 27.38,
            longitude: 95.32,
            radiusKm: 10,
            targetDepth: 3500
        };
    });

    const [nearbyWells, setNearbyWells] = useState([]);
    const [telemetryHistory, setTelemetryHistory] = useState([]);
    const [currentTelemetry, setCurrentTelemetry] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [riskAlert, setRiskAlert] = useState(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const socketUrl = import.meta.env.VITE_SOCKET_URL || '/';
        const newSocket = io(socketUrl, { autoConnect: true, transports: ['polling', 'websocket'] });
        setSocket(newSocket);

        newSocket.on('telemetry:data', (dataPoint) => {
            setCurrentTelemetry(dataPoint);
            setTelemetryHistory(prev => [...prev.slice(-30), dataPoint]);
        });

        newSocket.on('risk:detected', (alertData) => {
            setRiskAlert(alertData);
        });

        newSocket.on('telemetry:status', (status) => {
            setIsSimulating(status.isSimulating);
        });

        return () => newSocket.close();
    }, []);

    const initializeWell = (wellData, nearby) => {
        setActiveWell(wellData);
        setNearbyWells(nearby);
        localStorage.setItem('rigmind_active_well', JSON.stringify(wellData));
    };

    const startSimulation = () => {
        if (socket) {
            socket.emit('telemetry:start');
            setIsSimulating(true);
        }
    };

    const stopSimulation = () => {
        if (socket) {
            socket.emit('telemetry:stop');
            setIsSimulating(false);
        }
    };

    return (
        <WellContext.Provider value={{
            activeWell,
            nearbyWells,
            currentTelemetry,
            telemetryHistory,
            isSimulating,
            riskAlert,
            setRiskAlert,
            initializeWell,
            startSimulation,
            stopSimulation
        }}>
            {children}
        </WellContext.Provider>
    );
};

export const useWell = () => useContext(WellContext);
