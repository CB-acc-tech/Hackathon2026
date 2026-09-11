-- RigMind-NWIS Seed Data (Assam / Oil India Basin Synthetic Demo Data)

-- Clean existing records
TRUNCATE users, historical_reports, historical_events, formation, trajectory, drilling_parameters, well_master RESTART IDENTITY CASCADE;

-- Insert Seed Users (Password: password123)
-- Hash generated for 'password123': $2b$10$EpRnTzVlqHNP0.f.g6Q0ue9k6z.a.j9Z3Zg1Wn6S.1J.1J.1J.1J.
INSERT INTO users (username, password_hash, role, full_name) VALUES
('field_eng', '$2b$10$EpRnTzVlqHNP0.f.g6Q0ue9k6z.a.j9Z3Zg1Wn6S.1J.1J.1J.1J.', 'FIELD_ENGINEER', 'Rohan Sharma (Field Engineer)'),
('data_admin', '$2b$10$EpRnTzVlqHNP0.f.g6Q0ue9k6z.a.j9Z3Zg1Wn6S.1J.1J.1J.1J.', 'DATA_ADMIN', 'Ananya Roy (Data Admin)');

-- Insert Historical Offset Wells around Naharkatia / Digboi Basin (Center target ~ 27.38 N, 95.32 E)
INSERT INTO well_master (well_id, well_name, latitude, longitude, geom, operator, field, spud_date, completion_date, target_depth, status) VALUES
('WELL-001', 'Offset Well NHK-101', 27.412, 95.348, ST_SetSRID(ST_MakePoint(95.348, 27.412), 4326)::geography, 'Oil India Limited', 'Naharkatia Field', '2021-03-15', '2021-05-20', 3600, 'HISTORICAL'),
('WELL-002', 'Offset Well NHK-104', 27.351, 95.284, ST_SetSRID(ST_MakePoint(95.284, 27.351), 4326)::geography, 'Oil India Limited', 'Naharkatia Field', '2021-08-10', '2021-11-02', 3450, 'HISTORICAL'),
('WELL-003', 'Offset Well DGB-88',  27.394, 95.301, ST_SetSRID(ST_MakePoint(95.301, 27.394), 4326)::geography, 'Oil India Limited', 'Digboi Extension', '2022-01-05', '2022-03-18', 3700, 'HISTORICAL'),
('WELL-004', 'Offset Well MOR-12',  27.425, 95.259, ST_SetSRID(ST_MakePoint(95.259, 27.425), 4326)::geography, 'Oil India Limited', 'Moran Field',      '2022-06-12', '2022-08-30', 3300, 'HISTORICAL'),
('WELL-005', 'Offset Well NHK-112', 27.332, 95.358, ST_SetSRID(ST_MakePoint(95.358, 27.332), 4326)::geography, 'Oil India Limited', 'Naharkatia South', '2023-02-14', '2023-04-29', 3550, 'HISTORICAL');

-- Insert Trajectories for Historical Wells
INSERT INTO trajectory (well_id, measured_depth, true_vertical_depth, latitude, longitude, inclination, azimuth, geom) VALUES
-- WELL-001 Trajectory
('WELL-001', 0, 0, 27.412, 95.348, 0.0, 0.0, ST_SetSRID(ST_MakePoint(95.348, 27.412), 4326)::geography),
('WELL-001', 1000, 1000, 27.4121, 95.3481, 0.5, 45.0, ST_SetSRID(ST_MakePoint(95.3481, 27.4121), 4326)::geography),
('WELL-001', 2000, 1995, 27.4125, 95.3485, 2.1, 50.0, ST_SetSRID(ST_MakePoint(95.3485, 27.4125), 4326)::geography),
('WELL-001', 2850, 2838, 27.4132, 95.3492, 4.0, 52.0, ST_SetSRID(ST_MakePoint(95.3492, 27.4132), 4326)::geography),
('WELL-001', 3100, 3080, 27.4138, 95.3498, 5.2, 55.0, ST_SetSRID(ST_MakePoint(95.3498, 27.4138), 4326)::geography),
('WELL-001', 3600, 3570, 27.4145, 95.3505, 5.5, 55.0, ST_SetSRID(ST_MakePoint(95.3505, 27.4145), 4326)::geography),

-- WELL-002 Trajectory
('WELL-002', 0, 0, 27.351, 95.284, 0.0, 0.0, ST_SetSRID(ST_MakePoint(95.284, 27.351), 4326)::geography),
('WELL-002', 1500, 1500, 27.3512, 95.2841, 0.8, 120.0, ST_SetSRID(ST_MakePoint(95.2841, 27.3512), 4326)::geography),
('WELL-002', 2400, 2392, 27.3518, 95.2847, 3.2, 125.0, ST_SetSRID(ST_MakePoint(95.2847, 27.3518), 4326)::geography),
('WELL-002', 3450, 3435, 27.3525, 95.2854, 3.8, 128.0, ST_SetSRID(ST_MakePoint(95.2854, 27.3525), 4326)::geography),

-- WELL-003 Trajectory
('WELL-003', 0, 0, 27.394, 95.301, 0.0, 0.0, ST_SetSRID(ST_MakePoint(95.301, 27.394), 4326)::geography),
('WELL-003', 1800, 1798, 27.3941, 95.3012, 1.2, 210.0, ST_SetSRID(ST_MakePoint(95.3012, 27.3941), 4326)::geography),
('WELL-003', 2850, 2840, 27.3946, 95.3018, 3.5, 215.0, ST_SetSRID(ST_MakePoint(95.3018, 27.3946), 4326)::geography),
('WELL-003', 3700, 3680, 27.3952, 95.3025, 4.1, 218.0, ST_SetSRID(ST_MakePoint(95.3025, 27.3952), 4326)::geography);

-- Insert Formations
INSERT INTO formation (well_id, formation_name, top_depth, base_depth, lithology) VALUES
('WELL-001', 'Alluvium & Girujan Clay', 0, 1350, 'Claystone and Fine Sandstone'),
('WELL-001', 'Tipam Sandstone', 1350, 2380, 'Coarse Sandstone with Interbedded Shales'),
('WELL-001', 'Surma Group', 2380, 2720, 'Siltstone and Hard Shale'),
('WELL-001', 'Barail Main Formation', 2720, 3600, 'Reactive Coal-bearing Claystone & Sandstone'),

('WELL-002', 'Alluvium & Girujan Clay', 0, 1380, 'Claystone'),
('WELL-002', 'Tipam Sandstone', 1380, 2410, 'Porous Sandstone'),
('WELL-002', 'Surma Group', 2410, 2750, 'Shale/Siltstone'),
('WELL-002', 'Barail Main Formation', 2750, 3450, 'Claystone & Carbonaceous Shale'),

('WELL-003', 'Alluvium & Girujan Clay', 0, 1320, 'Claystone'),
('WELL-003', 'Tipam Sandstone', 1320, 2350, 'Sandstone'),
('WELL-003', 'Surma Group', 2350, 2690, 'Hard Siltstone'),
('WELL-003', 'Barail Main Formation', 2690, 3700, 'Reactive Shale & Coal');

-- Insert Historical Events (Crucial for Hazard & Correlation Engine)
INSERT INTO historical_events (well_id, event_type, event_depth, formation, start_time, end_time, duration, cause, description, mitigation, outcome, npt_hours, source_report) VALUES
(
    'WELL-001', 
    'Stuck Pipe', 
    3100.0, 
    'Barail Main Formation', 
    '2021-04-12 14:30:00+05:30', 
    '2021-04-14 08:00:00+05:30', 
    '41.5 hrs', 
    'Differential sticking caused by heavy mud weight (1.28 sg) across depleted high-permeability sand body coupled with drillstring rotation pause.', 
    'BHA got stuck at 3100m depth while wiper trip in Barail formation. String was unable to rotate or jar free initially.', 
    'Spotted high-lubricity pipe-freeing pill (oil-based surfactant mix 50 bbl). Decreased mud weight to 1.22 sg gradually and jarred downwards with 110 tons overpull.', 
    'Drillstring freed successfully after 38 hours of soaking pill and jarring. Hole back-reamed and conditioned.', 
    41.5, 
    'WCR_WELL_001_FINAL_REPORT.pdf'
),
(
    'WELL-005', 
    'Stuck Pipe', 
    2850.0, 
    'Barail Main Formation', 
    '2023-03-20 09:15:00+05:30', 
    '2023-03-21 18:00:00+05:30', 
    '32.75 hrs', 
    'Mechanical sticking due to reactive shale sloughing and inadequate hole cleaning in high-angle section.', 
    'Sudden increase in torque from 12 kN.m to 38 kN.m followed by complete loss of rotation at 2850m depth.', 
    'Pumped high-viscosity polymer sweep, increased flow rate from 400 gpm to 520 gpm, and worked pipe with downward jarring.', 
    'Hole cleared of heavy cuttings; string freed without back-off requirement.', 
    32.75, 
    'DDR_WELL_005_INCIDENT.pdf'
),
(
    'WELL-002', 
    'Mud Loss', 
    1950.0, 
    'Tipam Sandstone', 
    '2021-09-04 11:00:00+05:30', 
    '2021-09-05 04:30:00+05:30', 
    '17.5 hrs', 
    'Natural fractures in porous Tipam sandstone matrix breached by surge pressure during tripping in.', 
    'Partial loss of circulation (45 bbl/hr) observed at 1950m depth while drilling with 1.18 sg WBM.', 
    'PUMPED 30 bbl coarse blended LCM pill (Nutplug + Mica + Calcium Carbonate). Reduced pump flow rate from 500 gpm to 380 gpm.', 
    'Full returns restored after curing losses for 6 hours.', 
    17.5, 
    'WCR_WELL_002_LOSS_SUMMARY.pdf'
),
(
    'WELL-003', 
    'Kick / Overpressure', 
    3220.0, 
    'Barail Main Formation', 
    '2022-02-18 22:45:00+05:30', 
    '2022-02-20 06:00:00+05:30', 
    '31.25 hrs', 
    'Unanticipated gas kick from overpressured coal bed lens within Barail lower sand interval.', 
    'Pit volume gain of 18 bbl and pump pressure drop observed at 3220m. Shut-in SIDPP: 420 psi, SICP: 580 psi.', 
    'Executed Engineers Method (Wait and Weight). Weighted up mud system from 1.20 sg to 1.29 sg and circulated kick out safely.', 
    'Gas circulated out with maximum casing pressure 640 psi; well stabilized.', 
    31.25, 
    'DDR_WELL_003_WELL_CONTROL.pdf'
);

-- Insert Sample Historical Reports Records
INSERT INTO historical_reports (well_id, report_name, report_type, report_date, file_path, extracted_text, processed_status) VALUES
('WELL-001', 'WCR_WELL_001_FINAL_REPORT.pdf', 'WCR', '2021-05-20', '/documents/historical/WCR_WELL_001_FINAL_REPORT.pdf', 'Historical End-of-Well Report for Well NHK-101 (WELL-001). Major incident: Stuck pipe encountered in Barail Main Formation at 3100m measured depth on April 12, 2021. The cause was identified as differential sticking in permeable sand under high mud weight (1.28 sg). Mitigation applied: Spotted 50 bbl oil-based pipe-freeing pill, reduced mud density to 1.22 sg, and jarred with 110 tons overpull. String freed after 38 hours.', 'PROCESSED'),
('WELL-005', 'DDR_WELL_005_INCIDENT.pdf', 'DDR', '2023-03-21', '/documents/historical/DDR_WELL_005_INCIDENT.pdf', 'Daily Drilling Report for Well NHK-112 (WELL-005). Section: Barail Formation at 2850m. Mechanical stuck pipe due to shale sloughing and torque spike to 38 kN.m. Mitigation: High-viscosity polymer sweep and increased flow rate to 520 gpm freed string.', 'PROCESSED');
