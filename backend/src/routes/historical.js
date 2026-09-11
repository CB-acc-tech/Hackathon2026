const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const MOCK_EVENTS = [
    {
        id: 1,
        wellId: 'WELL-001',
        wellName: 'Offset Well NHK-101',
        distanceKm: 4.2,
        eventType: 'Stuck Pipe',
        eventDepth: 3100.0,
        formation: 'Barail Main Formation',
        cause: 'Differential sticking caused by heavy mud weight (1.28 sg) across depleted high-permeability sand body coupled with drillstring rotation pause.',
        description: 'BHA got stuck at 3100m depth while wiper trip in Barail formation. String was unable to rotate or jar free initially.',
        mitigation: 'Spotted high-lubricity pipe-freeing pill (oil-based surfactant mix 50 bbl). Decreased mud weight to 1.22 sg gradually and jarred downwards with 110 tons overpull.',
        outcome: 'Drillstring freed successfully after 38 hours of soaking pill and jarring. Hole back-reamed and conditioned.',
        nptHours: 41.5,
        sourceReport: 'WCR_WELL_001_FINAL_REPORT.pdf'
    },
    {
        id: 2,
        wellId: 'WELL-005',
        wellName: 'Offset Well NHK-112',
        distanceKm: 5.5,
        eventType: 'Stuck Pipe',
        eventDepth: 2850.0,
        formation: 'Barail Main Formation',
        cause: 'Mechanical sticking due to reactive shale sloughing and inadequate hole cleaning in high-angle section.',
        description: 'Sudden increase in torque from 12 kN.m to 38 kN.m followed by complete loss of rotation at 2850m depth.',
        mitigation: 'Pumped high-viscosity polymer sweep, increased flow rate from 400 gpm to 520 gpm, and worked pipe with downward jarring.',
        outcome: 'Hole cleared of heavy cuttings; string freed without back-off requirement.',
        nptHours: 32.75,
        sourceReport: 'DDR_WELL_005_INCIDENT.pdf'
    },
    {
        id: 3,
        wellId: 'WELL-002',
        wellName: 'Offset Well NHK-104',
        distanceKm: 6.8,
        eventType: 'Mud Loss',
        eventDepth: 1950.0,
        formation: 'Tipam Sandstone',
        cause: 'Natural fractures in porous Tipam sandstone matrix breached by surge pressure during tripping in.',
        description: 'Partial loss of circulation (45 bbl/hr) observed at 1950m depth while drilling with 1.18 sg WBM.',
        mitigation: 'PUMPED 30 bbl coarse blended LCM pill (Nutplug + Mica + Calcium Carbonate). Reduced pump flow rate from 500 gpm to 380 gpm.',
        outcome: 'Full returns restored after curing losses for 6 hours.',
        nptHours: 17.5,
        sourceReport: 'WCR_WELL_002_LOSS_SUMMARY.pdf'
    },
    {
        id: 4,
        wellId: 'WELL-003',
        wellName: 'Offset Well DGB-88',
        distanceKm: 2.9,
        eventType: 'Kick / Overpressure',
        eventDepth: 3220.0,
        formation: 'Barail Main Formation',
        cause: 'Unanticipated gas kick from overpressured coal bed lens within Barail lower sand interval.',
        description: 'Pit volume gain of 18 bbl and pump pressure drop observed at 3220m. Shut-in SIDPP: 420 psi, SICP: 580 psi.',
        mitigation: 'Executed Engineers Method (Wait and Weight). Weighted up mud system from 1.20 sg to 1.29 sg and circulated kick out safely.',
        outcome: 'Gas circulated out with maximum casing pressure 640 psi; well stabilized.',
        nptHours: 31.25,
        sourceReport: 'DDR_WELL_003_WELL_CONTROL.pdf'
    }
];

// Stop words to ignore during search tokenization
const STOP_WORDS = new Set(['in', 'on', 'at', 'the', 'a', 'an', 'and', 'or', 'of', 'for', 'with', 'by', 'to', 'from', 'is', 'it']);

function extractTokens(str) {
    if (!str) return [];
    return str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

// GET /api/historical-events
router.get('/historical-events', verifyToken, async (req, res) => {
    try {
        const sql = `
            SELECT 
                he.id,
                he.well_id AS "wellId",
                wm.well_name AS "wellName",
                he.event_type AS "eventType",
                he.event_depth AS "eventDepth",
                he.formation,
                he.cause,
                he.description,
                he.mitigation,
                he.outcome,
                he.npt_hours AS "nptHours",
                he.source_report AS "sourceReport"
            FROM historical_events he
            JOIN well_master wm ON he.well_id = wm.well_id
            ORDER BY he.event_depth ASC;
        `;
        const result = await db.query(sql);
        if (result.rows.length > 0) {
            return res.json(result.rows);
        }
    } catch (err) {
        console.warn('DB historical events query error, serving mock events:', err.message);
    }
    return res.json(MOCK_EVENTS);
});

// GET /api/knowledge/search
router.get('/knowledge/search', verifyToken, async (req, res) => {
    const { query = '', hazardType = '', formation = '' } = req.query;

    try {
        let sql = `
            SELECT 
                he.id,
                he.well_id AS "wellId",
                wm.well_name AS "wellName",
                he.event_type AS "eventType",
                he.event_depth AS "eventDepth",
                he.formation,
                he.cause,
                he.description,
                he.mitigation,
                he.outcome,
                he.npt_hours AS "nptHours",
                he.source_report AS "sourceReport"
            FROM historical_events he
            JOIN well_master wm ON he.well_id = wm.well_id
        `;

        const conditions = [];
        const queryParams = [];

        if (hazardType) {
            queryParams.push(`%${hazardType}%`);
            conditions.push(`he.event_type ILIKE $${queryParams.length}`);
        }

        if (formation) {
            queryParams.push(`%${formation}%`);
            conditions.push(`he.formation ILIKE $${queryParams.length}`);
        }

        const tokens = extractTokens(query);
        if (tokens.length > 0) {
            const tokenConditions = tokens.map(token => {
                queryParams.push(`%${token}%`);
                const idx = queryParams.length;
                return `(he.event_type ILIKE $${idx} OR he.formation ILIKE $${idx} OR he.cause ILIKE $${idx} OR he.mitigation ILIKE $${idx} OR he.description ILIKE $${idx} OR wm.well_name ILIKE $${idx})`;
            });
            conditions.push(`(${tokenConditions.join(' OR ')})`);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY he.event_depth ASC;';

        const result = await db.query(sql, queryParams);
        if (result.rows.length > 0) {
            return res.json({ count: result.rows.length, results: result.rows });
        }
    } catch (err) {
        console.warn('DB search error, utilizing smart token fallback search:', err.message);
    }

    // Mock search with token matching & relevance scoring
    const tokens = extractTokens(query);

    let scored = MOCK_EVENTS.map(event => {
        let score = 0;
        const searchableText = `${event.eventType} ${event.formation} ${event.cause} ${event.mitigation} ${event.description} ${event.wellName}`.toLowerCase();

        if (tokens.length > 0) {
            for (const token of tokens) {
                if (searchableText.includes(token)) {
                    score += 1;
                }
            }
        } else {
            score = 1;
        }

        if (hazardType && event.eventType.toLowerCase() !== hazardType.toLowerCase()) {
            score = 0;
        }

        if (formation && !event.formation.toLowerCase().includes(formation.toLowerCase())) {
            score = 0;
        }

        return { event, score };
    });

    const filtered = scored
        .filter(item => (tokens.length > 0 ? item.score > 0 : true))
        .sort((a, b) => b.score - a.score)
        .map(item => item.event);

    return res.json({
        count: filtered.length,
        results: filtered
    });
});

module.exports = router;
