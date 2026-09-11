from typing import Dict, Any, List

# Configurable Risk Engine Threshold Rules
DEFAULT_RISK_CONFIG = {
    "stuck_pipe": {
        "depth_proximity_meters": 100.0,
        "rpm_drop_threshold": 70,
        "torque_spike_threshold": 25.0,
        "wob_increase_threshold": 50.0
    },
    "mud_loss": {
        "depth_proximity_meters": 80.0,
        "flow_rate_drop_percent": 15.0,
        "spp_drop_psi": 200.0
    },
    "kick": {
        "depth_proximity_meters": 100.0,
        "spp_drop_psi": 150.0,
        "rop_spike_percent": 40.0
    }
}

HISTORICAL_EVENTS_KNOWLEDGE = [
    {
        "wellId": "WELL-001",
        "wellName": "Offset Well NHK-101",
        "distanceKm": 4.2,
        "eventType": "Stuck Pipe",
        "eventDepth": 3100.0,
        "formation": "Barail Main Formation"
    },
    {
        "wellId": "WELL-005",
        "wellName": "Offset Well NHK-112",
        "distanceKm": 5.5,
        "eventType": "Stuck Pipe",
        "eventDepth": 2850.0,
        "formation": "Barail Main Formation"
    },
    {
        "wellId": "WELL-002",
        "wellName": "Offset Well NHK-104",
        "distanceKm": 6.8,
        "eventType": "Mud Loss",
        "eventDepth": 1950.0,
        "formation": "Tipam Sandstone"
    },
    {
        "wellId": "WELL-003",
        "wellName": "Offset Well DGB-88",
        "distanceKm": 2.9,
        "eventType": "Kick / Overpressure",
        "eventDepth": 3220.0,
        "formation": "Barail Main Formation"
    }
]

def evaluate_drilling_risk(telemetry: Dict[str, Any], config: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Deterministic & ML-Ready Risk Engine.
    Correlates active drilling telemetry against nearby historical events using depth proximity,
    formation matching, and physical drilling parameter anomalies.
    """
    if config is None:
        config = DEFAULT_RISK_CONFIG

    depth = telemetry.get("depth", 0.0)
    formation = telemetry.get("formation", "Barail Main Formation")
    rpm = telemetry.get("rpm", 120)
    torque = telemetry.get("torque", 12.0)
    wob = telemetry.get("wob", 35)

    detected_risks = []
    max_risk_score = 0.10
    primary_hazard = "NORMAL"

    for event in HISTORICAL_EVENTS_KNOWLEDGE:
        depth_diff = abs(depth - event["eventDepth"])
        is_same_formation = formation.lower() in event["formation"].lower() or event["formation"].lower() in formation.lower()
        
        # Calculate Depth Proximity Score (1.0 = exact depth, 0.0 = >150m away)
        proximity_score = max(0.0, 1.0 - (depth_diff / 150.0))

        if depth_diff <= 150.0 and is_same_formation:
            reasons = [
                f"Historical {event['eventType']} event in nearby well {event['wellName']} at {event['eventDepth']}m",
                f"Active depth ({depth}m) is within {round(depth_diff, 1)}m proximity of historical hazard",
                f"Formation match: {formation}"
            ]
            
            score = 0.40 + (proximity_score * 0.30)

            # Check parameter anomalies for Stuck Pipe
            if event["eventType"] == "Stuck Pipe":
                if rpm < config["stuck_pipe"]["rpm_drop_threshold"]:
                    score += 0.15
                    reasons.append(f"RPM dropped significantly to {rpm} RPM (< {config['stuck_pipe']['rpm_drop_threshold']} RPM threshold)")
                if torque > config["stuck_pipe"]["torque_spike_threshold"]:
                    score += 0.15
                    reasons.append(f"Torque elevated to {torque} kN.m (> {config['stuck_pipe']['torque_spike_threshold']} kN.m threshold)")
                if wob > config["stuck_pipe"]["wob_increase_threshold"]:
                    score += 0.10
                    reasons.append(f"WOB high at {wob} klbs")

            score = min(0.95, round(score, 2))

            if score > max_risk_score:
                max_risk_score = score
                primary_hazard = event["eventType"]

            if score >= 0.65:
                detected_risks.append({
                    "hazardType": f"HIGH RISK — {event['eventType'].upper()}",
                    "riskScore": score,
                    "confidenceLabel": "Prototype Risk Score",
                    "historicalWell": event["wellName"],
                    "historicalDepth": event["eventDepth"],
                    "depthDifferenceMeters": round(depth_diff, 1),
                    "reasons": reasons,
                    "action": "Investigate Historical Solutions"
                })

    if not detected_risks:
        return {
            "hasRisk": False,
            "riskScore": round(max_risk_score, 2),
            "confidenceLabel": "Prototype Risk Score",
            "status": "Normal Drilling Parameters",
            "message": "Drilling parameters within normal operational envelope."
        }

    top_risk = detected_risks[0]
    return {
        "hasRisk": True,
        "riskType": top_risk["hazardType"],
        "riskScore": top_risk["riskScore"],
        "confidenceLabel": "Prototype Risk Score",
        "currentDepth": depth,
        "formation": formation,
        "reasons": top_risk["reasons"],
        "historicalWell": top_risk["historicalWell"],
        "allDetectedRisks": detected_risks,
        "recommendedAction": "Investigate Historical Solutions"
    }
