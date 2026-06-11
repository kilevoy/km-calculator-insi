from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel, Field


app = FastAPI(
    title="KM Calculator INSI API",
    version="0.1.0",
    description="Backend API for KM/INSI business calculator scenarios.",
)


class ScenarioInput(BaseModel):
    length_m: float = Field(60, ge=0, description="Building length in meters")
    width_m: float = Field(24, ge=0, description="Building width in meters")
    height_m: float = Field(6, ge=0, description="Building height in meters")
    km_enabled: bool = True
    insi_enabled: bool = True
    overhead_percent: float = Field(10, ge=0, le=100)


class ScenarioResult(BaseModel):
    area_m2: float
    estimated_km_tons: float
    estimated_project_price: float
    estimated_days: float
    enabled_sections: list[str]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/calculate", response_model=ScenarioResult)
def calculate(input_data: ScenarioInput) -> ScenarioResult:
    area = input_data.length_m * input_data.width_m
    enabled_sections = [
        section
        for section, enabled in (("KM", input_data.km_enabled), ("INSI", input_data.insi_enabled))
        if enabled
    ]
    section_factor = max(len(enabled_sections), 1)
    height_factor = 1 + max(input_data.height_m - 6, 0) * 0.025
    estimated_km_tons = area * 0.045 * height_factor
    base_price = estimated_km_tons * 125_000 * section_factor
    estimated_project_price = base_price * (1 + input_data.overhead_percent / 100)
    estimated_days = max(5, area / 180 * section_factor)

    return ScenarioResult(
        area_m2=round(area, 2),
        estimated_km_tons=round(estimated_km_tons, 3),
        estimated_project_price=round(estimated_project_price, 2),
        estimated_days=round(estimated_days, 1),
        enabled_sections=enabled_sections,
    )
