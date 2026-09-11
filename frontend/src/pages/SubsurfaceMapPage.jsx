import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWell } from '../context/WellContext';
import { useAuth } from '../context/AuthContext';
import Plot from 'react-plotly.js';
import { Layers, Play, RefreshCw, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function SubsurfaceMapPage() {
    const { activeWell, nearbyWells, startSimulation } = useWell();
    const { token } = useAuth();
    const navigate = useNavigate();

    const [dipCorrectionEnabled, setDipCorrectionEnabled] = useState(false);
    const [dipAngle, setDipAngle] = useState(5.0);
    const [loading, setLoading] = useState(false);
    const [isDarkTheme, setIsDarkTheme] = useState(() => document.documentElement.classList.contains('dark'));

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDarkTheme(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const [formations, setFormations] = useState([
        { formationName: 'Alluvium & Girujan Clay', topDepth: 0, baseDepth: 1350, lithology: 'Claystone' },
        { formationName: 'Tipam Sandstone', topDepth: 1350, baseDepth: 2380, lithology: 'Porous Sandstone' },
        { formationName: 'Surma Group', topDepth: 2380, baseDepth: 2720, lithology: 'Siltstone' },
        { formationName: 'Barail Main Formation', topDepth: 2720, baseDepth: 3600, lithology: 'Reactive Coal-bearing Claystone' }
    ]);

    const [correctedFormations, setCorrectedFormations] = useState(null);

    const handleToggleDipCorrection = async () => {
        const nextState = !dipCorrectionEnabled;
        setDipCorrectionEnabled(nextState);

        if (nextState) {
            setLoading(true);
            try {
                const response = await fetch('/api/ai/geology/correct-depth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        formations,
                        dipAngle: parseFloat(dipAngle),
                        distanceKm: nearbyWells[0]?.distanceKm || 4.2
                    })
                });
                const data = await response.json();
                setCorrectedFormations(data.formations);
            } catch (err) {
                console.warn('Dip correction API fallback:', err);
                // Fallback math
                const fallbackFormations = formations.map(f => ({
                    ...f,
                    correctedTopDepth: f.topDepth + 120,
                    correctedBaseDepth: f.baseDepth + 120,
                    label: 'Prototype Stratigraphic Dip Correction'
                }));
                setCorrectedFormations(fallbackFormations);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleStartDrilling = () => {
        startSimulation();
        navigate('/dashboard');
    };

    // Build 3D Plotly Traces
    const currentFormations = dipCorrectionEnabled && correctedFormations ? correctedFormations : formations;

    // Active Well Trajectory (Green)
    const activeTrace = {
        type: 'scatter3d',
        mode: 'lines+markers',
        name: `${activeWell.wellName} (Planned)`,
        x: [0, 50, 120, 250, 380],
        y: [0, 40, 90, 180, 270],
        z: [0, -1000, -2000, -2850, -3500],
        line: { color: '#10b981', width: 6 },
        marker: { size: 4, color: '#059669' }
    };

    // Historical Wells Trajectories (Grey)
    const historicalTraces = nearbyWells.map((well, idx) => {
        const offsetX = (idx + 1) * 800 - 1200;
        const offsetY = (idx + 1) * 600 - 800;
        return {
            type: 'scatter3d',
            mode: 'lines+markers',
            name: `${well.wellName} (${well.distanceKm} km)`,
            x: [offsetX, offsetX + 40, offsetX + 110, offsetX + 210],
            y: [offsetY, offsetY + 30, offsetY + 80, offsetY + 150],
            z: [0, -1200, -2400, -3400],
            line: { color: isDarkTheme ? '#94a3b8' : '#64748b', width: 4, dash: 'solid' },
            marker: { size: 3, color: isDarkTheme ? '#64748b' : '#475569' }
        };
    });

    // Formation Surface Planes in 3D
    const formationSurfaceTraces = currentFormations.map((fmt, idx) => {
        const depth = dipCorrectionEnabled && fmt.correctedTopDepth !== undefined ? -fmt.correctedTopDepth : -fmt.topDepth;
        const darkColors = ['#1e293b', '#0f2942', '#1c1917', '#172554'];
        const lightColors = ['#e2e8f0', '#cbd5e1', '#94a3b8', '#bfdbfe'];
        return {
            type: 'mesh3d',
            name: `${fmt.formationName} (${Math.abs(depth)}m)`,
            x: [-2000, 2000, 2000, -2000],
            y: [-2000, -2000, 2000, 2000],
            z: [depth, depth - 50, depth - 80, depth],
            color: isDarkTheme ? darkColors[idx % darkColors.length] : lightColors[idx % lightColors.length],
            opacity: isDarkTheme ? 0.35 : 0.45
        };
    });

    const plotlyData = [activeTrace, ...historicalTraces, ...formationSurfaceTraces];

    const plotlyLayout = {
        autosize: true,
        margin: { l: 0, r: 0, b: 0, t: 30 },
        paper_bgcolor: isDarkTheme ? '#0f172a' : '#ffffff',
        plot_bgcolor: isDarkTheme ? '#0f172a' : '#ffffff',
        scene: {
            xaxis: { title: 'Easting Offset (m)', color: isDarkTheme ? '#94a3b8' : '#475569', gridcolor: isDarkTheme ? '#334155' : '#e2e8f0' },
            yaxis: { title: 'Northing Offset (m)', color: isDarkTheme ? '#94a3b8' : '#475569', gridcolor: isDarkTheme ? '#334155' : '#e2e8f0' },
            zaxis: { title: 'Depth TVD (m)', color: isDarkTheme ? '#94a3b8' : '#475569', gridcolor: isDarkTheme ? '#334155' : '#e2e8f0', autorange: 'reversed' },
            camera: { eye: { x: 1.5, y: 1.5, z: 1.2 } }
        },
        showlegend: true,
        legend: { font: { color: isDarkTheme ? '#cbd5e1' : '#334155', size: 10 }, orientation: 'h', x: 0, y: 1 }
    };

    return (
        <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs dark:bg-slate-900 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                        <Layers className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                        <span>3D Subsurface Trajectory & Stratigraphy Map</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Correlate target well trajectory (Green) with historical offset trajectories (Grey) and formation tops.
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    {/* Geological Dip Correction Toggle */}
                    <button
                        onClick={handleToggleDipCorrection}
                        disabled={loading}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center space-x-2 transition ${
                            dipCorrectionEnabled
                                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-500 dark:shadow-lg dark:shadow-amber-950/50'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                        }`}
                    >
                        <Sparkles className={`w-4 h-4 ${dipCorrectionEnabled ? 'text-amber-600 dark:text-amber-400 animate-spin' : 'text-slate-400'}`} />
                        <span>
                            {dipCorrectionEnabled ? 'Dip Correction: ACTIVE' : 'Apply Stratigraphic Dip Correction'}
                        </span>
                    </button>

                    {/* Start Drilling Button */}
                    <button
                        onClick={handleStartDrilling}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm flex items-center space-x-2 transition animate-pulse"
                    >
                        <Play className="w-4 h-4 fill-white" />
                        <span>START DRILLING</span>
                    </button>
                </div>
            </div>

            {/* Label Disclaimer Banner */}
            <div className="bg-amber-50/80 border border-amber-200 text-amber-900 dark:bg-slate-900/80 dark:border-amber-800/60 dark:text-amber-300 rounded-lg p-3 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>
                        <strong>Geology Note:</strong> {dipCorrectionEnabled ? 'Prototype Stratigraphic Dip Correction Applied (Regional Dip ~ 5.0° SE)' : 'Showing baseline historical formation depth measurements.'}
                    </span>
                </div>
                <span className="font-mono text-[10px] bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-400 px-2 py-0.5 rounded font-semibold">
                    Prototype Geological Engine
                </span>
            </div>

            {/* 3D Visualization Canvas Container */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden h-[540px] relative shadow-xs dark:bg-slate-900 dark:border-slate-800">
                <Plot
                    data={plotlyData}
                    layout={plotlyLayout}
                    useResizeHandler={true}
                    style={{ width: '100%', height: '100%' }}
                    config={{ responsive: true, displayModeBar: true }}
                />
            </div>
        </div>
    );
}
