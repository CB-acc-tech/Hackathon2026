import math
from typing import List, Dict, Any

def apply_stratigraphic_dip_correction(
    formations: List[Dict[str, Any]], 
    dip_angle_deg: float = 5.0, 
    dip_direction_deg: float = 45.0,
    distance_km: float = 4.2
) -> Dict[str, Any]:
    """
    Prototype Stratigraphic Dip Correction math engine.
    Calculates structural depth offsets for formation tops/bases based on regional dip.
    """
    dip_rad = math.radians(dip_angle_deg)
    distance_m = distance_km * 1000.0
    
    # Structural depth displacement delta (approximate plane formula)
    depth_shift = distance_m * math.tan(dip_rad)
    
    corrected_formations = []
    for fmt in formations:
        top = fmt.get("topDepth", 0.0)
        base = fmt.get("baseDepth", 0.0)
        
        # Apply structural correction shift
        corrected_top = max(0.0, round(top + depth_shift, 1))
        corrected_base = round(base + depth_shift, 1)
        
        corrected_formations.append({
            "formationName": fmt.get("formationName"),
            "originalTopDepth": top,
            "originalBaseDepth": base,
            "correctedTopDepth": corrected_top,
            "correctedBaseDepth": corrected_base,
            "depthShiftMeters": round(depth_shift, 1),
            "lithology": fmt.get("lithology", "Unknown")
        })
        
    return {
        "status": "SUCCESS",
        "methodLabel": "Prototype Stratigraphic Dip Correction",
        "dipAngleDegrees": dip_angle_deg,
        "dipDirectionDegrees": dip_direction_deg,
        "distanceKm": distance_km,
        "totalDepthShiftMeters": round(depth_shift, 1),
        "formations": corrected_formations,
        "disclaimer": "Prototype geological dip calculation — requires formal seismic validation."
    }
