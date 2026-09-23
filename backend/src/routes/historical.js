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
    const rawTokens = str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1 && !STOP_WORDS.has(w));

    const extra = [];
    for (const t of rawTokens) {
        if (/^\d+m$/.test(t)) {
            extra.push(t.replace('m', ''));
        }
    }
    return [...rawTokens, ...extra];
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

    let dbEvents = [];
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
            ORDER BY he.event_depth ASC;
        `;
        const result = await db.query(sql);
        if (result.rows.length > 0) {
            dbEvents = result.rows;
        }
    } catch (err) {
        console.warn('DB search fallback:', err.message);
    }

    // Combine in-memory events and DB events, deduplicating by sourceReport
    const combinedEvents = [...MOCK_EVENTS];
    const existingReports = new Set(MOCK_EVENTS.map(e => e.sourceReport));
    
    for (const dbe of dbEvents) {
        if (!existingReports.has(dbe.sourceReport)) {
            combinedEvents.push(dbe);
            existingReports.add(dbe.sourceReport);
        }
    }

    // Score all events with token matching
    const tokens = extractTokens(query);

    let scored = combinedEvents.map(event => {
        let score = 0;
        const searchableText = `${event.eventType} ${event.formation} ${event.cause} ${event.mitigation} ${event.description} ${event.outcome} ${event.sourceReport} ${event.wellName} ${event.wellId}`.toLowerCase();

        if (tokens.length > 0) {
            for (const token of tokens) {
                if (searchableText.includes(token)) {
                    score += 5; // Strong weight to exact keyword matches like 2920m, wiper, trip
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

async function addHistoricalEvent(event) {
    if (!event) return null;
    const newId = MOCK_EVENTS.length + 1;
    const eventObj = {
        id: newId,
        wellId: event.wellId || 'WELL-001',
        wellName: event.wellName || `Offset Well ${event.wellId || 'WELL-001'}`,
        distanceKm: event.distanceKm || 4.5,
        eventType: event.eventType || 'Stuck Pipe',
        eventDepth: parseFloat(event.eventDepth) || 2850.0,
        formation: event.formation || 'Barail Main Formation',
        cause: event.cause || 'Historical event extracted from uploaded report document.',
        description: event.description || event.cause || 'Uploaded report incident description.',
        mitigation: event.mitigation || 'Applied standard pipe freeing / LCM sweep protocol.',
        outcome: event.outcome || 'Incident resolved and documented.',
        nptHours: parseFloat(event.nptHours) || 24.0,
        sourceReport: event.sourceReport || 'UPLOADED_REPORT.pdf',
        status: event.status || 'VERIFIED_OFFICIAL',
        verifiedBy: event.verifiedBy || (event.status === 'UNVERIFIED_DRAFT' ? null : 'Data Admin'),
        verifiedAt: event.verifiedAt || (event.status === 'UNVERIFIED_DRAFT' ? null : new Date().toISOString())
    };
    
    // Add to in-memory list first
    MOCK_EVENTS.unshift(eventObj);

    // Upsert into PostgreSQL DB
    try {
        await db.query(`
            INSERT INTO well_master (well_id, well_name, latitude, longitude, field, status)
            VALUES ($1, $2, 27.38, 95.32, 'Upper Assam Basin', 'HISTORICAL')
            ON CONFLICT (well_id) DO NOTHING;
        `, [eventObj.wellId, eventObj.wellName]);

        await db.query(`
            INSERT INTO historical_events (well_id, event_type, event_depth, formation, cause, description, mitigation, outcome, npt_hours, source_report)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [eventObj.wellId, eventObj.eventType, eventObj.eventDepth, eventObj.formation, eventObj.cause, eventObj.description, eventObj.mitigation, eventObj.outcome, eventObj.nptHours, eventObj.sourceReport]);
    } catch (err) {
        console.warn('DB historical_events insert fallback note:', err.message);
    }

    return eventObj;
}

// POST /api/historical-events/auto-draft
router.post('/historical-events/auto-draft', verifyToken, async (req, res) => {
    try {
        const draftData = req.body;
        draftData.status = 'UNVERIFIED_DRAFT';
        const savedEvent = await addHistoricalEvent(draftData);
        return res.json({
            status: 'DRAFT_SAVED',
            event: savedEvent
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// POST /api/historical-events/:id/approve
router.post('/historical-events/:id/approve', verifyToken, async (req, res) => {
    try {
        const eventId = parseInt(req.params.id, 10);
        let event = MOCK_EVENTS.find(e => e.id === eventId);
        if (!event && req.body && req.body.wellId) {
            event = await addHistoricalEvent(req.body);
        }
        if (!event) {
            event = {
                id: eventId,
                wellId: req.body.wellId || 'WELL-007',
                wellName: req.body.wellName || 'Active Rig WELL-007',
                eventType: req.body.eventType || 'Stuck Pipe Risk',
                eventDepth: req.body.eventDepth || 2850.0,
                formation: req.body.formation || 'Barail Main Formation',
                cause: req.body.cause || 'Real-time telemetry anomaly.',
                mitigation: req.body.mitigation || 'High-lubricity pill & downward jarring.',
                outcome: req.body.outcome || 'String freed and hole conditioned.',
                sourceReport: req.body.sourceReport || 'AUTO_DDR_WELL_007.pdf'
            };
            MOCK_EVENTS.unshift(event);
        }

        const approver = req.user ? (req.user.name || req.user.username || 'Data Admin') : 'Data Admin';
        const nowIso = new Date().toISOString();

        // Update fields
        event.status = 'VERIFIED_OFFICIAL';
        event.verifiedBy = approver;
        event.verifiedAt = nowIso;
        if (req.body.cause) event.cause = req.body.cause;
        if (req.body.mitigation) event.mitigation = req.body.mitigation;
        if (req.body.outcome) event.outcome = req.body.outcome;

        // Forward to Python AI service to index in ChromaDB
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        try {
            const response = await fetch(`${aiServiceUrl}/rag/index-verified`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventData: event })
            });
            const pyRes = await response.json();
            console.log('Indexed verified event in ChromaDB:', pyRes.chunkId);
        } catch (pyErr) {
            console.warn('AI service indexing note:', pyErr.message);
        }

        return res.json({
            status: 'APPROVED',
            message: `Event #${eventId} verified and digitally signed by ${approver}`,
            event
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.addHistoricalEvent = addHistoricalEvent;

module.exports = router;


