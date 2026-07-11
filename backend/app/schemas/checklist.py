"""Checklist schemas — response models for MRP-generated tasks."""

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class ChecklistTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date: date
    priority: str
    title: str
    description: str | None
    action_type: str
    action_payload: str | None
    completed: bool
    completed_at: datetime | None
    created_at: datetime


class ChecklistResponse(BaseModel):
    tasks: list[ChecklistTaskResponse]
    total: int
    completed_count: int


class ChecklistCompleteRequest(BaseModel):
    task_id: int
