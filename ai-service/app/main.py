from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.geology.dip_correction import apply_stratigraphic_dip_correction
from app.risk.engine import evaluate_drilling_risk
from app.rag.pipeline import generate_rag_response

app = FastAPI(
    title="RigMind-NWIS AI Service",
    description="AI/ML Risk Engine, Stratigraphic Dip Correction, and RAG Pipeline for Drilling Decision Support",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DipCorrectionRequest(BaseModel):
    formations: List[Dict[str, Any]]
    dipAngle: Optional[float] = 5.0
    dipDirection: Optional[float] = 45.0
    distanceKm: Optional[float] = 4.2

class RiskPredictRequest(BaseModel):
    depth: float
    rop: Optional[float] = 18.0
    wob: Optional[float] = 35.0
    rpm: Optional[float] = 120.0
    torque: Optional[float] = 12.0
    spp: Optional[float] = 2100.0
    flowRate: Optional[float] = 450.0
    mudWeight: Optional[float] = 1.18
    formation: Optional[str] = "Barail Main Formation"

class RAGQueryRequest(BaseModel):
    query: str
    currentWell: Optional[str] = "ACTIVE-001"
    depth: Optional[float] = 2820.0
    formation: Optional[str] = "Barail Main Formation"
    riskType: Optional[str] = "Stuck Pipe"

@app.get("/")
def read_root():
    return {
        "status": "UP",
        "service": "RigMind-NWIS Python FastAPI AI Service",
        "version": "1.0.0",
        "documentation": "Visit http://localhost:8000/docs for Swagger UI interactive API testing",
        "endpoints": {
            "health": "GET /health",
            "correct_depth": "POST /geology/correct-depth",
            "predict_risk": "POST /risk/predict",
            "rag_query": "POST /rag/query"
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "RigMind-NWIS Python FastAPI AI Service",
        "features": ["Prototype Stratigraphic Dip Correction", "Deterministic Risk Engine", "Historical RAG Pipeline"]
    }

@app.post("/geology/correct-depth")
def correct_depth(req: DipCorrectionRequest):
    try:
        res = apply_stratigraphic_dip_correction(
            formations=req.formations,
            dip_angle_deg=req.dipAngle,
            dip_direction_deg=req.dipDirection,
            distance_km=req.distanceKm
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/risk/predict")
def predict_risk(req: RiskPredictRequest):
    try:
        telemetry = req.dict()
        res = evaluate_drilling_risk(telemetry)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rag/query")
def rag_query(req: RAGQueryRequest):
    try:
        res = generate_rag_response(
            query=req.query,
            current_well=req.currentWell,
            depth=req.depth,
            formation=req.formation,
            risk_type=req.riskType
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
