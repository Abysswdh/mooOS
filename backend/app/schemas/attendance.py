"""Attendance schemas — clock in/out for admin shift."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AttendanceClockInResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    clock_in: datetime


class AttendanceClockOutResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    clock_in: datetime
    clock_out: datetime | None
    daily_summary: str | None


class AttendanceLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    clock_in: datetime
    clock_out: datetime | None
    daily_summary: str | None
    created_at: datetime


class AttendanceListResponse(BaseModel):
    items: list[AttendanceLogResponse]
    total: int
