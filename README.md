# RigMind-NWIS — AI-Powered Offset Well Knowledge & Decision Support Platform

> **Smart India Hackathon 2026 Prototype for Oil India Limited (OIL)**  
> *"Learn from what happened in nearby historical wells before the same problem happens again."*

---

## Overview

**RigMind-NWIS** is an integrated industrial decision-support platform designed for field engineers and drilling superintendents. It correlates real-time drilling telemetry with nearby historical offset well hazards (such as Stuck Pipe, Mud Loss, and Kick/Overpressure), applies geological dip corrections, and provides RAG (Retrieval-Augmented Generation) historical evidence and AI-assisted operational recommendations.

---

## Key Features

1. **PostGIS Spatial Search**: Spatial correlation (`ST_DWithin`) of nearby historical wells within 5 km / 10 km radius.
2. **3D Subsurface Trajectory & Dip Correction**: Interactive Plotly 3D visualizer with Prototype Stratigraphic Dip Correction.
3. **Live Telemetry Simulation**: Socket.IO managed real-time streaming of drilling parameters (Depth, ROP, WOB, RPM, Torque, SPP, Flow Rate, Mud Weight).
4. **Deterministic & ML-Ready Risk Engine**: Evaluates depth proximity, formation similarity, and physical parameter anomalies.
5. **RAG Pipeline & AI Decision Support**: Historical daily drilling report (DDR) and well completion report (WCR) evidence retrieval powered by ChromaDB and Groq LLM (with Gemini fallback).
6. **Role-Based Workflows**: Tailored user experience for `Field Engineer` and `Data Admin`.

---

## System Architecture

```
                       +-----------------------------------+
                       |    React + Vite Industrial UI     |
                       | (Leaflet, Plotly 3D, Chart.js)    |
                       +-----------------+-----------------+
                                         |
                                  REST / Socket.IO
                                         |
                       +-----------------v-----------------+
                       |    Node.js + Express Backend      |
                       |    (JWT Auth, PostGIS Spatial)    |
                       +--------+----------------+---------+
                                |                |
                  PostgreSQL /  |                | HTTP API Proxy
                  PostGIS       |                |
                       +--------v-------+  +-----v-------------------+
                       | PostgreSQL DB  |  | Python FastAPI AI       |
                       | (SRID 4326)    |  | Service (Risk & RAG)    |
                       +----------------+  +-----+-------------+-----+
                                                 |             |
                                            ChromaDB Vector  Groq / Gemini
                                            Vector Store     LLM APIs
```

---

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React Icons, Plotly.js (3D), Chart.js, React-Leaflet (2D GIS), Socket.IO Client.
- **Backend**: Node.js, Express.js, PostgreSQL Client (`pg`), JWT, Socket.IO.
- **AI & RAG Service**: Python 3.11, FastAPI, Uvicorn, SciPy/NumPy, ChromaDB, LangChain, PyPDF, Groq API (with Gemini fallback).
- **Database**: PostgreSQL 15 + PostGIS 3.3.

---

## Folder Structure

```
d:\Projects\Hackathon2026/
├── frontend/             # React + Vite industrial UI
│   ├── src/
│   │   ├── components/   # UI widgets
│   │   ├── context/      # AuthContext, WellContext
│   │   ├── layouts/      # MainLayout with status header
│   │   └── pages/        # Five Core Screens (Login, Initialize, 3D Map, Live Dashboard, Knowledge Base, Admin)
│   └── package.json
├── backend/              # Express Node server
│   ├── src/
│   │   ├── db/           # PostgreSQL pool
│   │   ├── middleware/   # JWT & RBAC
│   │   ├── routes/       # Auth, PostGIS Wells, Historical Search
│   │   ├── websocket/    # Socket.IO Telemetry Engine
│   │   └── app.js
│   └── package.json
├── ai-service/           # FastAPI AI & RAG Engine
│   ├── app/
│   │   ├── geology/      # Stratigraphic Dip Correction
│   │   ├── risk/         # Deterministic Risk Engine
│   │   ├── rag/          # PDF Chunking, Embeddings, ChromaDB, LLM
│   │   └── main.py
│   └── requirements.txt
├── database/
│   ├── schema.sql        # PostGIS Tables & Indexes
│   └── seed.sql          # Assam Naharkatia/Digboi Oilfield Dataset
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Getting Started (Quick Run Without Docker)

Both the Node backend and Python AI service feature **zero-dependency fallback engines**, meaning you can run the entire platform immediately without Docker or PostgreSQL installed!

### Step 1: Start Node Express Backend
```powershell
cd backend
npm start
```
*Backend listens on http://localhost:5000*

### Step 2: Start Python AI Service
```powershell
cd ai-service
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload
```
*AI service listens on http://localhost:8000*

### Step 3: Start React Frontend
```powershell
cd frontend
npm run dev
```
*Open http://localhost:5173 in your browser*

---

## Demo Credentials & Presentation Walkthrough

1. **Login**:
   - Field Engineer: Username `field_eng` / Password `password123`
   - Data Admin: Username `data_admin` / Password `password123`
2. **Well Initialization**:
   - Default coordinates (Lat `27.38`, Lon `95.32`, Radius `10 km`, Target Depth `3500 m`). Click **Initialize System & Correlate**.
3. **3D Subsurface Map**:
   - Inspect active green trajectory vs grey offset wells. Toggle **Apply Stratigraphic Dip Correction**.
4. **Live Drilling Dashboard**:
   - Click **START DRILLING**. Watch the depth timeline progress from 2750m toward 2850m.
   - At depth 2820m–2850m, parameter anomalies (RPM drop, Torque spike) trigger **HIGH RISK — STUCK PIPE** alert.
   - Click **Investigate Historical Solutions** to launch RAG historical report retrieval with exact mitigation steps and source citations.
5. **Data Admin Upload**:
   - Switch role to Data Admin, access `/admin`, upload daily report PDF, and trigger ChromaDB vector indexing.

---

## Engineering Disclaimer

*RigMind-NWIS is an AI-assisted Decision Support Prototype designed for demonstration during Smart India Hackathon 2026. Synthetic data and simulated telemetry are clearly labeled. Operational decisions on actual rigs must be validated by the site superintendent and drilling engineer.*
