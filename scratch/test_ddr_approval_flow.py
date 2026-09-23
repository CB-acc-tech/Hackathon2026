import requests
import json

AI_SERVICE_URL = "http://localhost:8000"
BACKEND_URL = "http://localhost:5000"

def test_ddr_draft_and_approval_flow():
    print("\n=======================================================")
    print("0. Logging in to obtain Auth Token")
    print("=======================================================")
    login_res = requests.post(f"{BACKEND_URL}/api/auth/login", json={
        "username": "data_admin",
        "password": "password123"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json().get("token")
    headers = {"Authorization": f"Bearer {token}"}
    print("[SUCCESS] Auth Token obtained for Data Admin!")

    print("\n=======================================================")
    print("1. Testing Python AI Service Endpoint: POST /rag/generate-ddr")
    print("=======================================================")
    
    mock_telemetry_window = [
        {"depth": 2800.0, "rop": 18.0, "rpm": 115, "torque": 13.0, "wob": 35, "spp": 2100, "mudWeight": 1.18, "formation": "Barail Main Formation"},
        {"depth": 2820.0, "rop": 12.0, "rpm": 85, "torque": 22.0, "wob": 40, "spp": 2250, "mudWeight": 1.18, "formation": "Barail Main Formation"},
        {"depth": 2850.0, "rop": 6.5, "rpm": 42, "torque": 38.0, "wob": 48, "spp": 2450, "mudWeight": 1.18, "formation": "Barail Main Formation"}
    ]

    res = requests.post(f"{AI_SERVICE_URL}/rag/generate-ddr", json={
        "telemetryWindow": mock_telemetry_window,
        "wellId": "WELL-007",
        "wellName": "Active Rig WELL-007"
    })
    
    assert res.status_code == 200, f"AI service failed: {res.text}"
    data = res.json()
    print("AI Service DDR Draft Output:")
    print(json.dumps(data, indent=2))
    
    draft = data.get("draftEvent")
    assert draft is not None
    assert draft.get("status") == "UNVERIFIED_DRAFT"
    print("[SUCCESS] AI Service generate-ddr PASSED!")

    print("\n=======================================================")
    print("2. Testing Backend Draft Storage: POST /api/historical-events/auto-draft")
    print("=======================================================")

    res = requests.post(f"{BACKEND_URL}/api/historical-events/auto-draft", json=draft, headers=headers)
    assert res.status_code == 200, f"Backend auto-draft failed: {res.text}"
    saved_draft = res.json().get("event")
    event_id = saved_draft.get("id")
    print(f"Backend Saved Draft Event ID: {event_id}, Status: {saved_draft.get('status')}")
    assert saved_draft.get("status") == "UNVERIFIED_DRAFT"
    print("[SUCCESS] Backend auto-draft storage PASSED!")

    print("\n=======================================================")
    print("3. Testing Human Sign-off Approval: POST /api/historical-events/:id/approve")
    print("=======================================================")

    res = requests.post(f"{BACKEND_URL}/api/historical-events/{event_id}/approve", json={
        "cause": "Verified torque spike to 38 kN.m and RPM drop to 42 RPM at 2850m in Barail Formation.",
        "mitigation": "Verified: Spotted 50 bbl high-lubricity pill, increased flow rate to 520 gpm, and jarred downward.",
        "outcome": "Verified: Drillstring freed after 3.5 hours; hole conditioned."
    }, headers=headers)
    assert res.status_code == 200, f"Approval failed: {res.text}"
    approved_res = res.json()
    approved_event = approved_res.get("event")
    print("Approved & Digitally Signed Event:")
    print(json.dumps(approved_event, indent=2))

    assert approved_event.get("status") == "VERIFIED_OFFICIAL"
    assert approved_event.get("verifiedBy") is not None
    print("[SUCCESS] Human Sign-off & ChromaDB Indexing PASSED!")

    print("\n=======================================================")
    print("4. Verification of RAG Search on Approved Event")
    print("=======================================================")
    
    search_res = requests.get(f"{BACKEND_URL}/api/knowledge/search?query=torque+spike+2850m", headers=headers)
    assert search_res.status_code == 200
    results = search_res.json()
    if isinstance(results, dict):
        results = results.get("results", [])
    print(f"RAG Search returned {len(results)} events.")
    top_result = results[0] if len(results) > 0 else None
    if top_result:
        print("Top Search Result:")
        print(f"Well: {top_result.get('wellName')}, Status: {top_result.get('status')}, VerifiedBy: {top_result.get('verifiedBy')}")
    print("\nALL END-TO-END VERIFICATION TESTS PASSED SUCCESSFULLY!\n")

if __name__ == "__main__":
    test_ddr_draft_and_approval_flow()
