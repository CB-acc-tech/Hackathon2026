const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

// Standard Haversine distance calculator for fallback / verification
function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
}

// Fallback seed wells if database connection is unavailable
const MOCK_HISTORICAL_WELLS = [
    {
        wellId: 'WELL-001',
        wellName: 'Offset Well NHK-101',
        latitude: 27.412,
        longitude: 95.348,
        operator: 'Oil India Limited',
        field: 'Naharkatia Field',
        targetDepth: 3600,
        status: 'HISTORICAL'
    },
    {
        wellId: 'WELL-002',
        wellName: 'Offset Well NHK-104',
        latitude: 27.351,
        longitude: 95.284,
        operator: 'Oil India Limited',
        field: 'Naharkatia Field',
        targetDepth: 3450,
        status: 'HISTORICAL'
    },
    {
        wellId: 'WELL-003',
        wellName: 'Offset Well DGB-88',
        latitude: 27.394,
        longitude: 95.301,
        operator: 'Oil India Limited',
        field: 'Digboi Extension',
        targetDepth: 3700,
        status: 'HISTORICAL'
    },
    {
        wellId: 'WELL-004',
        wellName: 'Offset Well MOR-12',
        latitude: 27.425,
        longitude: 95.259,
        operator: 'Oil India Limited',
        field: 'Moran Field',
        targetDepth: 3300,
        status: 'HISTORICAL'
    },
    {
        wellId: 'WELL-005',
        wellName: 'Offset Well NHK-112',
        latitude: 27.332,
        longitude: 95.358,
        operator: 'Oil India Limited',
        field: 'Naharkatia South',
        targetDepth: 3550,
        status: 'HISTORICAL'
    }
];

// POST /api/wells/initialize - PostGIS Spatial Search
router.post('/initialize', verifyToken, async (req, res) => {
    const { latitude, longitude, radiusKm = 10, targetDepth = 3500 } = req.body;

    if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Latitude and Longitude are required' });
    }

    const radiusMeters = radiusKm * 1000;

    try {
        // Query PostGIS database using ST_DWithin and ST_Distance on geography(Point, 4326)
        const sql = `
            SELECT 
                well_id AS "wellId",
                well_name AS "wellName",
                latitude,
                longitude,
                operator,
                field,
                target_depth AS "targetDepth",
                status,
                ROUND((ST_Distance(
                    geom,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                ) / 1000.0)::numeric, 2)::float AS "distanceKm"
            FROM well_master
            WHERE ST_DWithin(
                geom,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                $3
            )
            ORDER BY "distanceKm" ASC;
        `;

        const result = await db.query(sql, [longitude, latitude, radiusMeters]);
        
        let nearbyWells = result.rows;

        // Active well metadata record
        const activeWell = {
            wellId: 'ACTIVE-001',
            wellName: 'Active Well NHK-PROTOTYPE',
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            targetDepth: parseFloat(targetDepth),
            radiusKm: parseFloat(radiusKm),
            status: 'DRILLING'
        };

        return res.json({
            message: 'Well initialized successfully with PostGIS spatial correlation',
            activeWell,
            nearbyCount: nearbyWells.length,
            nearbyWells
        });
    } catch (err) {
        console.warn('PostGIS query error, using Haversine calculation fallback:', err.message);
        
        // Fallback Haversine sorting
        const nearbyWells = MOCK_HISTORICAL_WELLS.map(w => {
            const dist = calculateHaversineDistanceKm(latitude, longitude, w.latitude, w.longitude);
            return { ...w, distanceKm: dist };
        })
        .filter(w => w.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm);

        return res.json({
            message: 'Well initialized successfully (Haversine fallback)',
            activeWell: {
                wellId: 'ACTIVE-001',
                wellName: 'Active Well NHK-PROTOTYPE',
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                targetDepth: parseFloat(targetDepth),
                radiusKm: parseFloat(radiusKm),
                status: 'DRILLING'
            },
            nearbyCount: nearbyWells.length,
            nearbyWells
        });
    }
});

// GET /api/wells/nearby - Quick list of wells
router.get('/nearby', verifyToken, async (req, res) => {
    try {
        const result = await db.query('SELECT well_id AS "wellId", well_name AS "wellName", latitude, longitude, operator, field, target_depth AS "targetDepth" FROM well_master LIMIT 20');
        res.json(result.rows);
    } catch (err) {
        res.json(MOCK_HISTORICAL_WELLS);
    }
});

// GET /api/wells/:id/trajectory - Trajectory points for 3D visualization
router.get('/:id/trajectory', verifyToken, async (req, res) => {
    const wellId = req.params.id;
    try {
        const result = await db.query(
            'SELECT measured_depth AS "measuredDepth", true_vertical_depth AS "trueVerticalDepth", latitude, longitude, inclination, azimuth FROM trajectory WHERE well_id = $1 ORDER BY measured_depth ASC',
            [wellId]
        );

        if (result.rows.length > 0) {
            return res.json(result.rows);
        }
    } catch (err) {
        console.warn('DB trajectory lookup failed, serving synthetic trajectory:', err.message);
    }

    // Default synthetic trajectory for visualization
    const mockTrajectory = [
        { measuredDepth: 0, trueVerticalDepth: 0, latitude: 27.412, longitude: 95.348, inclination: 0.0, azimuth: 0.0 },
        { measuredDepth: 1000, trueVerticalDepth: 1000, latitude: 27.4121, longitude: 95.3481, inclination: 0.5, azimuth: 45.0 },
        { measuredDepth: 2000, trueVerticalDepth: 1995, latitude: 27.4125, longitude: 95.3485, inclination: 2.1, azimuth: 50.0 },
        { measuredDepth: 2850, trueVerticalDepth: 2838, latitude: 27.4132, longitude: 95.3492, inclination: 4.0, azimuth: 52.0 },
        { measuredDepth: 3100, trueVerticalDepth: 3080, latitude: 27.4138, longitude: 95.3498, inclination: 5.2, azimuth: 55.0 },
        { measuredDepth: 3600, trueVerticalDepth: 3570, latitude: 27.4145, longitude: 95.3505, inclination: 5.5, azimuth: 55.0 }
    ];
    return res.json(mockTrajectory);
});

// GET /api/wells/:id/formations - Formation stratigraphy for 3D subsurface layer display
router.get('/:id/formations', verifyToken, async (req, res) => {
    const wellId = req.params.id;
    try {
        const result = await db.query(
            'SELECT formation_name AS "formationName", top_depth AS "topDepth", base_depth AS "baseDepth", lithology FROM formation WHERE well_id = $1 ORDER BY top_depth ASC',
            [wellId]
        );
        if (result.rows.length > 0) {
            return res.json(result.rows);
        }
    } catch (err) {
        console.warn('DB formation lookup failed:', err.message);
    }

    // Default formations for Assam Basin
    return res.json([
        { formationName: 'Alluvium & Girujan Clay', topDepth: 0, baseDepth: 1350, lithology: 'Claystone' },
        { formationName: 'Tipam Sandstone', topDepth: 1350, baseDepth: 2380, lithology: 'Porous Sandstone' },
        { formationName: 'Surma Group', topDepth: 2380, baseDepth: 2720, lithology: 'Siltstone' },
        { formationName: 'Barail Main Formation', topDepth: 2720, baseDepth: 3600, lithology: 'Reactive Coal-bearing Claystone' }
    ]);
});

module.exports = router;
