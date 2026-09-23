// Managed Socket.IO Telemetry Simulation Engine for RigMind-NWIS

let activeSimulationInterval = null;
let currentDepth = 2750.0;
let isSimulating = false;
let telemetryBuffer = [];
let lastDraftedDepth = 0;

// Generate realistic telemetry parameter set based on depth progression
function generateTelemetryPoint(depth) {
    let rpm = 120;
    let torque = 12.0;
    let wob = 35.0;
    let rop = 18.5;
    let spp = 2100;
    let flowRate = 450;
    let mudWeight = 1.18;
    let formation = 'Barail Main Formation';

    // Simulate anomaly between 2800m and 2860m (Approaching historical stuck pipe hazard depth)
    if (depth >= 2800 && depth <= 2860) {
        const factor = (depth - 2800) / 60.0; // 0.0 to 1.0
        rpm = Math.max(40, Math.round(120 - factor * 75 + (Math.random() * 5 - 2.5)));
        torque = parseFloat((12.0 + factor * 26.0 + (Math.random() * 2 - 1)).toFixed(1));
        wob = Math.round(35 + factor * 25 + (Math.random() * 4 - 2));
        rop = parseFloat((18.5 - factor * 12.0 + (Math.random() * 2 - 1)).toFixed(1));
        spp = Math.round(2100 + factor * 350 + (Math.random() * 30 - 15));
    } else {
        // Normal minor fluctuations
        rpm += Math.round(Math.random() * 6 - 3);
        torque = parseFloat((torque + Math.random() * 0.8 - 0.4).toFixed(1));
        wob += Math.round(Math.random() * 2 - 1);
        rop = parseFloat((rop + Math.random() * 1.0 - 0.5).toFixed(1));
    }

    return {
        timestamp: new Date().toISOString(),
        depth: parseFloat(depth.toFixed(1)),
        rop,
        wob,
        rpm,
        torque,
        hookload: 120 + Math.round(Math.random() * 4 - 2),
        spp,
        flowRate,
        mudWeight,
        formation
    };
}

function initTelemetrySocket(io) {
    io.on('connection', (socket) => {
        console.log(`Client connected to telemetry stream: ${socket.id}`);

        socket.on('telemetry:start', () => {
            console.log('Telemetry simulation requested by client...');
            if (isSimulating) {
                socket.emit('telemetry:status', { message: 'Simulation already running', isSimulating: true });
                return;
            }

            isSimulating = true;
            currentDepth = 2750.0;
            telemetryBuffer = [];
            lastDraftedDepth = 0;
            io.emit('telemetry:status', { message: 'Simulation started', isSimulating: true });

            activeSimulationInterval = setInterval(() => {
                currentDepth += 2.5; // Advances ~2.5m per 2 seconds
                if (currentDepth > 2920.0) {
                    currentDepth = 2750.0; // Loop demo scenario
                }

                const dataPoint = generateTelemetryPoint(currentDepth);
                telemetryBuffer.push(dataPoint);
                if (telemetryBuffer.length > 50) {
                    telemetryBuffer.shift();
                }

                io.emit('telemetry:data', dataPoint);

                // Proactive local alert broadcast for dashboard UI
                if (dataPoint.depth >= 2820 && dataPoint.rpm < 65 && dataPoint.torque > 28.0) {
                    io.emit('risk:detected', {
                        riskType: 'HIGH RISK — STUCK PIPE',
                        depth: dataPoint.depth,
                        formation: dataPoint.formation,
                        riskScore: 0.88,
                        confidence: 'Prototype Risk Score',
                        reasons: [
                            'Historical stuck-pipe event in nearby offset well NHK-112 at 2850m',
                            'Current depth approaching historical event depth within 30m proximity',
                            'RPM decreased significantly (120 RPM -> ' + dataPoint.rpm + ' RPM)',
                            'Torque spike observed (12 kN.m -> ' + dataPoint.torque + ' kN.m)'
                        ],
                        nearbyOffsetWell: 'WELL-005 (Offset Well NHK-112, 5.5 km away)'
                    });

                    // Trigger AI Auto-Drafted DDR when anomaly reaches peak (~2840m+)
                    if (dataPoint.depth >= 2840 && Math.abs(dataPoint.depth - lastDraftedDepth) > 50) {
                        lastDraftedDepth = dataPoint.depth;
                        const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
                        fetch(`${aiUrl}/rag/generate-ddr`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                telemetryWindow: telemetryBuffer,
                                wellId: 'WELL-007',
                                wellName: 'Active Rig WELL-007'
                            })
                        })
                        .then(res => res.json())
                        .then(data => {
                            if (data && data.draftEvent) {
                                const historicalRouter = require('../routes/historical');
                                return historicalRouter.addHistoricalEvent(data.draftEvent);
                            }
                        })
                        .then(savedEvent => {
                            if (savedEvent) {
                                console.log('⚡ AI Auto-Drafted DDR created:', savedEvent.id);
                                io.emit('telemetry:ddr_drafted', {
                                    message: `⚡ AI Auto-Drafted DDR report created for WELL-007 at ${dataPoint.depth}m. Pending Engineer Sign-off.`,
                                    event: savedEvent
                                });
                            }
                        })
                        .catch(err => console.warn('Auto-DDR draft creation note:', err.message));
                    }
                }
            }, 2000);
        });

        socket.on('telemetry:stop', () => {
            console.log('Telemetry simulation stopped.');
            if (activeSimulationInterval) {
                clearInterval(activeSimulationInterval);
                activeSimulationInterval = null;
            }
            isSimulating = false;
            io.emit('telemetry:status', { message: 'Simulation stopped', isSimulating: false });
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
}

module.exports = {
    initTelemetrySocket
};
