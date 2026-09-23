import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWell } from '../context/WellContext';
import { useAuth } from '../context/AuthContext';
import Plot from 'react-plotly.js';
import { 
  Layers, 
  Play, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Compass, 
  AlertTriangle, 
  Maximize2, 
  RotateCcw, 
  Box, 
  Sliders,
  Check
} from 'lucide-react';

export default function SubsurfaceMapPage() {
    const { activeWell, nearbyWells, startSimulation } = useWell();
    const { token } = useAuth();
    const navigate = useNavigate();

    const [dipCorrectionEnabled, setDipCorrectionEnabled] = useState(false);
    const [dipAngle, setDipAngle] = useState(5.0);
    const [loading, setLoading] = useState(false);
    const [isDarkTheme, setIsDarkTheme] = useState(() => document.documentElement.classList.contains('dark'));

    // Layer visibility states
    const [visibleLayers, setVisibleLayers] = useState({
        alluvium: true,
        namsang: true,
        girujan: true,
        tipam: true,
        barail: true
    });

    const [showHazards, setShowHazards] = useState(true);
    const [cameraView, setCameraView] = useState('3d'); // 3d | top | profile

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDarkTheme(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const handleToggleDipCorrection = async () => {
        const nextState = !dipCorrectionEnabled;
        setDipCorrectionEnabled(nextState);
    };

    const handleStartDrilling = () => {
        startSimulation();
        navigate('/dashboard');
    };

    const toggleLayer = (layerKey) => {
        setVisibleLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
    };

    // Define 5 distinct Earth Stratigraphic Layers
    const strataDefinitions = [
        {
            key: 'alluvium',
            name: 'Alluvium & Topsoil',
            lithology: 'Unconsolidated Sand & Silt',
            top: 0,
            base: 500,
            colorDark: '#854d0e',
            colorLight: '#fef08a',
            opacity: 0.30
        },
        {
            key: 'namsang',
            name: 'Namsang Formation',
            lithology: 'Porous Sandstone & Shale Interbeds',
            top: 500,
            base: 1350,
            colorDark: '#b45309',
            colorLight: '#fed7aa',
            opacity: 0.35
        },
        {
            key: 'girujan',
            name: 'Girujan Claystone',
            lithology: 'High-Porespace Claystone & Marine Shale',
            top: 1350,
            base: 2200,
            colorDark: '#334155',
            colorLight: '#cbd5e1',
            opacity: 0.40
        },
        {
            key: 'tipam',
            name: 'Tipam Sandstone',
            lithology: 'Permeable Reservoir Sandstone (Loss Zone)',
            top: 2200,
            base: 2720,
            colorDark: '#d97706',
            colorLight: '#fde68a',
            opacity: 0.45
        },
        {
            key: 'barail',
            name: 'Barail Main Formation',
            lithology: 'Overpressured Coal & Reactive Shale (Hazard Zone)',
            top: 2720,
            base: 3600,
            colorDark: '#312e81',
            colorLight: '#c7d2fe',
            opacity: 0.55
        }
    ];

    // Generate 3D Mesh Surfaces for Earth Strata Surfaces
    const generateSurfaceMesh = (stratum) => {
        const depth = stratum.top;
        const dipRad = (dipAngle * Math.PI) / 180.0;
        
        // 20x20 grid mesh for smooth realistic earth surface representation
        const xVals = [];
        const yVals = [];
        const zVals = [];

        const steps = 15;
        const range = 2500;
        const stepSize = (range * 2) / steps;

        for (let i = 0; i <= steps; i++) {
            const xRow = [];
            const yRow = [];
            const zRow = [];
            const x = -range + i * stepSize;

            for (let j = 0; j <= steps; j++) {
                const y = -range + j * stepSize;
                
                // If Dip correction active, calculate dipping plane depth z = z0 + x*sin(dip) + y*sin(dip)
                let calculatedZ = -depth;
                if (dipCorrectionEnabled) {
                    calculatedZ = -(depth + (x * 0.08 * Math.sin(dipRad)) + (y * 0.08 * Math.cos(dipRad)));
                }

                xRow.push(x);
                yRow.push(y);
                zRow.push(calculatedZ);
            }
            xVals.push(xRow);
            yVals.push(yRow);
            zVals.push(zRow);
        }

        return {
            type: 'surface',
            name: `${stratum.name} (${stratum.top}m - ${stratum.base}m)`,
            x: xVals,
            y: yVals,
            z: zVals,
            colorscale: [
                [0, isDarkTheme ? stratum.colorDark : stratum.colorLight],
                [1, isDarkTheme ? stratum.colorDark : stratum.colorLight]
            ],
            showscale: false,
            opacity: stratum.opacity,
            contours: {
                z: { show: true, usecolormap: true, highlightcolor: "#ffffff", project: { z: true } }
            },
            lighting: { ambient: 0.8, diffuse: 0.9, specular: 0.4 },
            hoverinfo: 'name'
        };
    };

    // Filter visible surface meshes
    const surfaceTraces = strataDefinitions
        .filter(s => visibleLayers[s.key])
        .map(s => generateSurfaceMesh(s));

    // Active Well Trajectory (Planned & Drilling - Bright Neon Green)
    const activeTrace = {
        type: 'scatter3d',
        mode: 'lines+markers',
        name: `${activeWell?.wellName || 'WELL-007'} (Active Target Trajectory)`,
        x: [0, 80, 190, 320, 480],
        y: [0, 60, 140, 260, 390],
        z: [0, -1000, -2000, -2850, -3500],
        line: { color: '#10b981', width: 8 },
        marker: { size: 5, color: '#34d399', symbol: 'circle' }
    };

    // Offset Wells Trajectories
    const offsetTraces = (nearbyWells || [
        { wellName: 'Offset Well NHK-101', distanceKm: 4.2 },
        { wellName: 'Offset Well NHK-104', distanceKm: 6.8 },
        { wellName: 'Offset Well DGB-88', distanceKm: 2.9 },
        { wellName: 'Offset Well NHK-112', distanceKm: 5.5 }
    ]).map((well, idx) => {
        const angles = [45, 135, 225, 315];
        const distM = (well.distanceKm || 4.0) * 350;
        const rad = (angles[idx % 4] * Math.PI) / 180;
        const startX = Math.cos(rad) * distM;
        const startY = Math.sin(rad) * distM;

        return {
            type: 'scatter3d',
            mode: 'lines+markers',
            name: `${well.wellName} (${well.distanceKm || 4.2} km)`,
            x: [startX, startX + 50, startX + 120, startX + 220],
            y: [startY, startY + 40, startY + 90, startY + 160],
            z: [0, -1200, -2400, -3400],
            line: { color: isDarkTheme ? '#94a3b8' : '#64748b', width: 5 },
            marker: { size: 4, color: isDarkTheme ? '#cbd5e1' : '#475569' }
        };
    });

    // 3D Hazard Spheres & Callout Markers
    const hazardTraces = showHazards ? [
        {
            type: 'scatter3d',
            mode: 'markers+text',
            name: '⚡ Stuck Pipe Hazard (WELL-005 @ 2850m)',
            x: [1200],
            y: [-1200],
            z: [-2850],
            text: ['🚨 Stuck Pipe Hazard (2850m)'],
            textposition: 'top center',
            textfont: { color: '#ef4444', size: 11, family: 'monospace' },
            marker: { size: 12, color: '#ef4444', symbol: 'diamond' }
        },
        {
            type: 'scatter3d',
            mode: 'markers+text',
            name: '💧 Mud Loss Zone (WELL-002 @ 1950m)',
            x: [-1400],
            y: [1400],
            z: [-1950],
            text: ['💧 Circulation Loss (1950m)'],
            textposition: 'top center',
            textfont: { color: '#f97316', size: 11, family: 'monospace' },
            marker: { size: 11, color: '#f97316', symbol: 'circle' }
        },
        {
            type: 'scatter3d',
            mode: 'markers+text',
            name: '🔥 Gas Kick Hazard (WELL-003 @ 3220m)',
            x: [-1200],
            y: [-1200],
            z: [-3220],
            text: ['🔥 Overpressured Gas Kick (3220m)'],
            textposition: 'top center',
            textfont: { color: '#a855f7', size: 11, family: 'monospace' },
            marker: { size: 11, color: '#a855f7', symbol: 'square' }
        }
    ] : [];

    const plotlyData = [...surfaceTraces, activeTrace, ...offsetTraces, ...hazardTraces];

    // Camera Presets
    const cameraPresets = {
        '3d': { eye: { x: 1.6, y: 1.6, z: 1.3 } },
        'top': { eye: { x: 0, y: 0.001, z: 2.5 } },
        'profile': { eye: { x: 2.5, y: 0, z: 0.1 } }
    };

    const plotlyLayout = {
        autosize: true,
        margin: { l: 0, r: 0, b: 0, t: 10 },
        paper_bgcolor: isDarkTheme ? '#0b0f19' : '#f8fafc',
        plot_bgcolor: isDarkTheme ? '#0b0f19' : '#f8fafc',
        scene: {
            xaxis: { 
                title: 'Easting Offset (m)', 
                color: isDarkTheme ? '#94a3b8' : '#475569', 
                gridcolor: isDarkTheme ? '#1e293b' : '#e2e8f0',
                backgroundcolor: isDarkTheme ? '#0f172a' : '#ffffff'
            },
            yaxis: { 
                title: 'Northing Offset (m)', 
                color: isDarkTheme ? '#94a3b8' : '#475569', 
                gridcolor: isDarkTheme ? '#1e293b' : '#e2e8f0',
                backgroundcolor: isDarkTheme ? '#0f172a' : '#ffffff'
            },
            zaxis: { 
                title: 'Depth TVD (m)', 
                color: isDarkTheme ? '#94a3b8' : '#475569', 
                gridcolor: isDarkTheme ? '#1e293b' : '#e2e8f0',
                backgroundcolor: isDarkTheme ? '#0f172a' : '#ffffff',
                autorange: 'reversed' 
            },
            camera: cameraPresets[cameraView]
        },
        showlegend: true,
        legend: { 
            font: { color: isDarkTheme ? '#cbd5e1' : '#334155', size: 10, family: 'monospace' }, 
            orientation: 'h', 
            x: 0, 
            y: 1.05 
        }
    };

    return (
        <div className="space-y-4">
            {/* Header Control Panel */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs dark:bg-slate-900 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2">
                        <span className="bg-cyan-100 text-cyan-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800">
                            3D GEOLOGICAL SUBSURFACE VIEWPORT
                        </span>
                        <span className="text-slate-400 text-xs font-mono">Stratigraphy & Offset Well Trajectories</span>
                    </div>
                    <h1 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1 flex items-center space-x-2">
                        <Layers className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                        <span>Interactive 3D Subsurface Earth Strata Map</span>
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Dip Correction Toggle */}
                    <button
                        onClick={handleToggleDipCorrection}
                        className={`px-3 py-2 rounded-lg text-xs font-bold font-mono border flex items-center space-x-2 transition ${
                            dipCorrectionEnabled
                                ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700 shadow-sm'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                        }`}
                    >
                        <Sparkles className={`w-4 h-4 ${dipCorrectionEnabled ? 'text-amber-600 dark:text-amber-400 animate-spin' : 'text-slate-400'}`} />
                        <span>{dipCorrectionEnabled ? 'Dip Correction: ACTIVE (5° SE)' : 'Apply Stratigraphic Dip'}</span>
                    </button>

                    {/* Hazard Callout Toggle */}
                    <button
                        onClick={() => setShowHazards(!showHazards)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold font-mono border flex items-center space-x-2 transition ${
                            showHazards
                                ? 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
                                : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}
                    >
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span>{showHazards ? '3D Hazards: SHOWN' : 'Hide Hazards'}</span>
                    </button>

                    {/* Start Drilling Button */}
                    <button
                        onClick={handleStartDrilling}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm flex items-center space-x-1.5 transition animate-pulse cursor-pointer"
                    >
                        <Play className="w-4 h-4 fill-white" />
                        <span>START DRILLING</span>
                    </button>
                </div>
            </div>

            {/* Camera Perspective & Layer Control Toolbar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-white text-xs font-mono">
                {/* Camera View Selector */}
                <div className="flex items-center space-x-2">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Camera Presets:</span>
                    <button
                        onClick={() => setCameraView('3d')}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border transition ${
                            cameraView === '3d'
                                ? 'bg-cyan-600 text-white border-cyan-400'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                    >
                        <Box className="w-3.5 h-3.5 inline mr-1" />
                        3D Orbit View
                    </button>
                    <button
                        onClick={() => setCameraView('top')}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border transition ${
                            cameraView === 'top'
                                ? 'bg-cyan-600 text-white border-cyan-400'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                    >
                        <Compass className="w-3.5 h-3.5 inline mr-1" />
                        Top-Down Map
                    </button>
                    <button
                        onClick={() => setCameraView('profile')}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border transition ${
                            cameraView === 'profile'
                                ? 'bg-cyan-600 text-white border-cyan-400'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                    >
                        <Sliders className="w-3.5 h-3.5 inline mr-1" />
                        Depth Cross-Section
                    </button>
                </div>

                {/* Layer Toggles */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="text-slate-400 font-bold uppercase mr-1">Earth Strata Toggles:</span>
                    {strataDefinitions.map((layer) => (
                        <button
                            key={layer.key}
                            onClick={() => toggleLayer(layer.key)}
                            className={`px-2 py-0.5 rounded font-bold border transition flex items-center space-x-1 ${
                                visibleLayers[layer.key]
                                    ? 'bg-slate-800 text-cyan-300 border-cyan-500'
                                    : 'bg-slate-950 text-slate-500 border-slate-800 opacity-60'
                            }`}
                        >
                            {visibleLayers[layer.key] ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3" />}
                            <span>{layer.name.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main 3D Viewport Canvas */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden h-[600px] relative shadow-lg">
                    <Plot
                        data={plotlyData}
                        layout={plotlyLayout}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        config={{ responsive: true, displayModeBar: true, displaylogo: false }}
                    />
                </div>

                {/* Subsurface Stratigraphy Legend & Info Panel */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 dark:bg-slate-900 dark:border-slate-800 text-xs">
                    <h3 className="font-mono uppercase font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
                        <span>Geological Formations</span>
                        <span className="text-[10px] text-cyan-600 dark:text-cyan-400">5 Strata Layers</span>
                    </h3>

                    <div className="space-y-2 font-mono text-[11px]">
                        {strataDefinitions.map((s) => (
                            <div 
                                key={s.key} 
                                className={`p-2.5 rounded-lg border transition ${
                                    visibleLayers[s.key]
                                        ? 'bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800'
                                        : 'opacity-40 bg-slate-100 border-slate-200 dark:bg-slate-900'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div 
                                            className="w-3 h-3 rounded-full border border-slate-400 shrink-0" 
                                            style={{ backgroundColor: isDarkTheme ? s.colorDark : s.colorLight }}
                                        />
                                        <span className="font-bold text-slate-900 dark:text-white">{s.name}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500">{s.top}m - {s.base}m</span>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 italic">{s.lithology}</p>
                            </div>
                        ))}
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        <p className="font-bold text-slate-700 dark:text-slate-300 uppercase">Interactive Navigation Controls:</p>
                        <p>• <strong>Left Click + Drag:</strong> Orbit & Rotate 3D Earth Camera</p>
                        <p>• <strong>Scroll Wheel:</strong> Zoom In / Zoom Out TVD Depth</p>
                        <p>• <strong>Right Click + Drag:</strong> Pan Subsurface Coordinates</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
