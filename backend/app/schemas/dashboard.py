"""Dashboard schemas — aggregated KPI response."""

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    """Aggregated KPI data for the dashboard — all computed, zero hardcoded."""
    total_cows: int
    active_cows: int
    sick_cows: int
    total_members: int
    today_milk_liters: float
    feed_stock_kg: float
    feed_days_remaining: float
    feed_is_critical: bool
    fertilizer_ready_kg: float
    today_revenue: float
    month_revenue: float


class HealthCheckResponse(BaseModel):
    status: str
    database: str
    version: str
