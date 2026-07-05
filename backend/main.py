from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Literal
from groq import Groq
import json
import math

app = FastAPI(title="Crisis Mapping API")

# Enable CORS for frontend communications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. AI DATA SCHEMA
class AIAnalysis(BaseModel):
    category: Literal["Fire", "Flooding", "Medical Emergency", "Infrastructure", "General Incident"]
    severity: Literal["Low", "Medium", "High", "Critical"]

# 2. INGESTION SCHEMAS
class ReportInput(BaseModel):
    text: str
    latitude: float
    longitude: float

class DatabaseReport(BaseModel):
    id: int
    text: str
    latitude: float
    longitude: float
    category: str
    severity: str
    cluster_id: int

REPORTS_DB: List[DatabaseReport] = []
cluster_counter = 0

# 3. INITIALIZE GROQ CLIENT
# Automatically pulls from $env:GROQ_API_KEY or you can hardcode: Groq(api_key="gsk_...")
client = Groq()

def groq_llm_analyze(text: str) -> tuple[str, str]:
    """Uses Groq + Llama 3 to analyze text and guarantee a structured JSON response."""
    try:
        # Requesting a JSON object structure from Groq
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an emergency response AI dispatcher. Analyze the user report. "
                        "You MUST respond with a JSON object matching this exact schema: "
                        '{"category": "Fire" | "Flooding" | "Medical Emergency" | "Infrastructure" | "General Incident", '
                        '"severity": "Low" | "Medium" | "High" | "Critical"}'
                    )
                },
                {"role": "user", "content": text}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        
        # Parse output data directly using Pydantic validation rules
        raw_json = response.choices[0].message.content
        analysis = AIAnalysis.model_validate_json(raw_json)
        return analysis.category, analysis.severity
        
    except Exception as e:
        print(f"⚠️ Groq API Error: {e}")
        return "General Incident", "Low"

def is_duplicate(new_lat: float, new_lng: float, existing_report: DatabaseReport) -> bool:
    distance = math.sqrt((new_lat - existing_report.latitude)**2 + (new_lng - existing_report.longitude)**2)
    return distance < 0.002 

# 4. API ENDPOINTS
@app.post("/api/reports/submit", response_model=DatabaseReport)
async def submit_report(input_data: ReportInput):
    global cluster_counter
    
    # Process text via our brand new Groq pipeline
    category, severity = groq_llm_analyze(input_data.text)
    
    assigned_cluster = None
    for existing in REPORTS_DB:
        if is_duplicate(input_data.latitude, input_data.longitude, existing):
            assigned_cluster = existing.cluster_id
            break
            
    if assigned_cluster is None:
        cluster_counter += 1
        assigned_cluster = cluster_counter

    new_report = DatabaseReport(
        id=len(REPORTS_DB) + 1,
        text=input_data.text,
        latitude=input_data.latitude,
        longitude=input_data.longitude,
        category=category,
        severity=severity,
        cluster_id=assigned_cluster
    )
    
    REPORTS_DB.append(new_report)
    return new_report

@app.get("/api/reports", response_model=List[DatabaseReport])
async def get_all_reports():
    return REPORTS_DB