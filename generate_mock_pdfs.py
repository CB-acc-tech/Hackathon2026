import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

os.makedirs("sample_reports", exist_ok=True)

def create_pdf(filename, title, metadata, sections):
    doc = SimpleDocTemplate(filename, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=12
    )
    
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Heading2'],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#d97706'),
        spaceBefore=10,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )
    
    elements = []
    
    elements.append(Paragraph("OIL INDIA LIMITED — DRILLING OPERATIONS REPORT", ParagraphStyle('CompanyHeader', fontSize=9, leading=11, textColor=colors.HexColor('#64748b'))))
    elements.append(Paragraph(title, title_style))
    elements.append(Spacer(1, 6))
    
    table_data = [[Paragraph(f"<b>{k}:</b>", body_style), Paragraph(str(v), body_style)] for k, v in metadata.items()]
    meta_table = Table(table_data, colWidths=[140, 380])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 14))
    
    for section_title, content in sections.items():
        elements.append(Paragraph(section_title, header_style))
        elements.append(Paragraph(content, body_style))
        elements.append(Spacer(1, 6))
        
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("<i>RigMind-NWIS Historical Report Ingestion Repository — Verified Oilfield Documentation</i>", ParagraphStyle('Footer', fontSize=8, leading=10, textColor=colors.HexColor('#94a3b8'))))
    
    doc.build(elements)
    print(f"Generated PDF: {filename}")

# 1. Stuck Pipe Incident Report
create_pdf(
    "sample_reports/DDR_WELL_007_BARAIL_INCIDENT.pdf",
    "DAILY DRILLING INCIDENT REPORT — WELL NHK-118 (WELL-007)",
    {
        "Well ID": "WELL-007 (Offset Well NHK-118)",
        "Operator": "Oil India Limited (Upper Assam Field)",
        "Formation Target": "Barail Main Formation",
        "Incident Depth": "2,920.0 m TVD",
        "Report Type": "Daily Drilling Report (DDR)",
        "Date of Event": "14-Nov-2024"
    },
    {
        "1. Executive Incident Summary": "During wiper trip at 2920m in Barail Main Formation, drillstring experienced sudden torque elevation from 14 kN.m to 42 kN.m followed by complete mechanical rotation freeze. Reactive shale sloughing and cutting accumulation observed in tight hole section.",
        "2. Physical Telemetry Parameters": "Rate of Penetration: 8.5 m/hr | WOB: 32 klbs | Rotary Speed: 45 RPM (decreased from 110 RPM) | Standpipe Pressure: 2,450 psi | Mud Weight: 1.26 sg WBM.",
        "3. Root Cause Analysis": "Severe shale sloughing and hole pack-off in Barail formation interval due to prolonged exposure to water-based mud. Depleted sand lenses created tight hole differential pressure conditions.",
        "4. Applied Mitigation Procedure": "1. Immediately spotted 50 bbl high-lubricity pipe-freeing pill (oil-based surfactant blend) across reactive Barail section.\n2. Increased mud pump circulation rate from 400 gpm to 530 gpm to flush cuttings.\n3. Worked drillstring with downward jarring using 115 tons maximum overpull while maintaining slow string torque.",
        "5. Final Operational Outcome": "Drillstring was successfully freed after 26 hours of soaking pill and jarring without requiring string back-off or sidetrack. Hole back-reamed and conditioned prior to casing run."
    }
)

# 2. Circulation Loss Summary Report
create_pdf(
    "sample_reports/WCR_WELL_002_LOSS_SUMMARY.pdf",
    "WELL COMPLETION REPORT — MUD LOSS SUMMARY (WELL-002)",
    {
        "Well ID": "WELL-002 (Offset Well NHK-104)",
        "Operator": "Oil India Limited",
        "Formation Target": "Tipam Sandstone",
        "Incident Depth": "1,980.0 m TVD",
        "Report Type": "Well Completion Report (WCR)",
        "Date of Event": "03-Mar-2023"
    },
    {
        "1. Incident Overview": "Partial to heavy circulation loss of 55 bbl/hr encountered while drilling porous Tipam sandstone interval at 1980m depth with 1.18 sg mud weight.",
        "2. Root Cause": "Surge pressure during tripping in fractured permeable Tipam matrix, initiating induced losses into sub-hydrostatic sand bodies.",
        "3. Mitigation Action Applied": "Pumped 40 bbl blended Lost Circulation Material (LCM) sweep consisting of coarse Nutplug (15 lb/bbl), Mica flakes (10 lb/bbl), and Calcium Carbonate (20 lb/bbl). Pump rate reduced from 500 gpm to 360 gpm.",
        "4. Outcome": "Full fluid circulation restored after 7.5 hours of curing losses. No further fluid loss recorded down to target depth."
    }
)

# 3. Gas Kick Report
create_pdf(
    "sample_reports/INCIDENT_WELL_003_KICK.pdf",
    "WELL CONTROL INCIDENT REPORT — GAS KICK (WELL-003)",
    {
        "Well ID": "WELL-003 (Offset Well DGB-88)",
        "Operator": "Oil India Limited",
        "Formation Target": "Barail Main Formation",
        "Incident Depth": "3,220.0 m TVD",
        "Report Type": "Incident Summary Report",
        "Date of Event": "18-Aug-2023"
    },
    {
        "1. Event Summary": "Pit volume gain of 22 bbl and standpipe pressure drop observed at 3220m depth in Barail lower coal lens. BOP closed on 5-inch drillpipe. Shut-in SIDPP: 450 psi, SICP: 610 psi.",
        "2. Mitigation Applied": "Executed Wait and Weight Well Control Procedure. Weighted mud system from 1.20 sg to 1.30 sg and circulated influx out safely through choke manifold.",
        "3. Final Outcome": "Gas kick killed safely with peak casing pressure 680 psi. Drilling resumed after mud weight stabilization."
    }
)
