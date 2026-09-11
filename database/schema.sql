-- RigMind-NWIS Database Schema (PostgreSQL + PostGIS)

CREATE EXTENSION IF NOT EXISTS postgis;

-- Users Table (Auth & Role-Based Authorization)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('FIELD_ENGINEER', 'DATA_ADMIN')),
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Master Well Directory
CREATE TABLE IF NOT EXISTS well_master (
    id SERIAL PRIMARY KEY,
    well_id VARCHAR(50) UNIQUE NOT NULL,
    well_name VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom GEOGRAPHY(Point, 4326),
    operator VARCHAR(100) DEFAULT 'Oil India Limited',
    field VARCHAR(100) DEFAULT 'Upper Assam Basin',
    spud_date DATE,
    completion_date DATE,
    target_depth DOUBLE PRECISION,
    status VARCHAR(50) DEFAULT 'HISTORICAL', -- 'HISTORICAL' or 'ACTIVE'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trajectory Points
CREATE TABLE IF NOT EXISTS trajectory (
    id SERIAL PRIMARY KEY,
    well_id VARCHAR(50) REFERENCES well_master(well_id) ON DELETE CASCADE,
    measured_depth DOUBLE PRECISION NOT NULL,
    true_vertical_depth DOUBLE PRECISION NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    inclination DOUBLE PRECISION DEFAULT 0.0,
    azimuth DOUBLE PRECISION DEFAULT 0.0,
    geom GEOGRAPHY(Point, 4326)
);

-- Formation Stratigraphy Boundaries
CREATE TABLE IF NOT EXISTS formation (
    id SERIAL PRIMARY KEY,
    well_id VARCHAR(50) REFERENCES well_master(well_id) ON DELETE CASCADE,
    formation_name VARCHAR(100) NOT NULL,
    top_depth DOUBLE PRECISION NOT NULL,
    base_depth DOUBLE PRECISION NOT NULL,
    lithology VARCHAR(100)
);

-- Drilling Telemetry Log (Historical Runs & Live Backlog)
CREATE TABLE IF NOT EXISTS drilling_parameters (
    id SERIAL PRIMARY KEY,
    well_id VARCHAR(50) REFERENCES well_master(well_id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    measured_depth DOUBLE PRECISION NOT NULL,
    rop DOUBLE PRECISION,      -- Rate of Penetration (m/hr)
    wob DOUBLE PRECISION,      -- Weight on Bit (klbs)
    rpm DOUBLE PRECISION,      -- Rotary Speed (RPM)
    torque DOUBLE PRECISION,   -- Torque (kN.m)
    hookload DOUBLE PRECISION, -- Hook Load (tons)
    spp DOUBLE PRECISION,      -- Standpipe Pressure (psi)
    flow_rate DOUBLE PRECISION,-- Flow Rate (gpm)
    mud_weight DOUBLE PRECISION-- Mud Weight (sg)
);

-- Historical Drilling Incidents & Hazards
CREATE TABLE IF NOT EXISTS historical_events (
    id SERIAL PRIMARY KEY,
    well_id VARCHAR(50) REFERENCES well_master(well_id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- e.g. 'Stuck Pipe', 'Mud Loss', 'Kick / Overpressure', 'Torque Spike'
    event_depth DOUBLE PRECISION NOT NULL,
    formation VARCHAR(100) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration VARCHAR(50),
    cause TEXT NOT NULL,
    description TEXT NOT NULL,
    mitigation TEXT NOT NULL,
    outcome TEXT NOT NULL,
    npt_hours DOUBLE PRECISION DEFAULT 0.0, -- Non-Productive Time
    source_report VARCHAR(255)
);

-- Historical Reports Metadata & Extraction Repository
CREATE TABLE IF NOT EXISTS historical_reports (
    id SERIAL PRIMARY KEY,
    well_id VARCHAR(50) REFERENCES well_master(well_id) ON DELETE CASCADE,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) DEFAULT 'DDR', -- 'DDR', 'WCR', 'INCIDENT_REPORT'
    report_date DATE,
    file_path VARCHAR(500),
    extracted_text TEXT,
    processed_status VARCHAR(30) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_well_master_geom ON well_master USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_trajectory_well_id ON trajectory(well_id);
CREATE INDEX IF NOT EXISTS idx_formation_well_id ON formation(well_id);
CREATE INDEX IF NOT EXISTS idx_events_well_id ON historical_events(well_id);
CREATE INDEX IF NOT EXISTS idx_events_formation ON historical_events(formation);
