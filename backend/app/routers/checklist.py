from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.checklist import ChecklistTask, ChecklistPriority, ChecklistActionType
from app.models.feed import FeedStock
from app.models.cow import Cow, CowStatus
from app.models.user import User
from app.schemas.checklist import ChecklistResponse, ChecklistTaskResponse
from app.dependencies import get_current_user
from app.config import get_settings

router = APIRouter(prefix="/checklist", tags=["Checklist"])


def _run_mrp_engine(db: Session, today: date):
    """Basic MRP engine to generate tasks based on conditions."""
    settings = get_settings()
    
    # 1. Feed Stock Check
    feed_stock = db.query(func.sum(FeedStock.quantity_kg)).scalar() or 0.0
    active_cows = db.query(Cow).filter(Cow.status == CowStatus.AVAILABLE).count()
    daily_feed_req = active_cows * settings.DEFAULT_FEED_KG_PER_COW_PER_DAY
    feed_days_remaining = feed_stock / daily_feed_req if daily_feed_req > 0 else 999.0
    
    if feed_days_remaining <= settings.FEED_CRITICAL_DAYS_THRESHOLD:
        existing_feed_task = db.query(ChecklistTask).filter(
            ChecklistTask.date == today,
            ChecklistTask.action_type == ChecklistActionType.CREATE_PO,
            ChecklistTask.title.like("%Pakan%")
        ).first()
        
        if not existing_feed_task:
            task = ChecklistTask(
                date=today,
                priority=ChecklistPriority.HIGH,
                title="Stok Pakan Kritis",
                description=f"Sisa pakan untuk {feed_days_remaining:.1f} hari. Segera order pakan.",
                action_type=ChecklistActionType.CREATE_PO,
                action_payload='{"type": "FEED"}'
            )
            db.add(task)
            
    # Add more rules here in the future
    db.commit()


@router.get("", response_model=ChecklistResponse)
def get_checklist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get checklist for today. Runs basic MRP engine first."""
    today = date.today()
    _run_mrp_engine(db, today)
    
    tasks = db.query(ChecklistTask).filter(ChecklistTask.date == today).order_by(
        ChecklistTask.completed, ChecklistTask.id.desc()
    ).all()
    
    total = len(tasks)
    completed_count = sum(1 for t in tasks if t.completed)
    
    return ChecklistResponse(tasks=tasks, total=total, completed_count=completed_count)


@router.post("/{task_id}/complete", response_model=ChecklistTaskResponse)
def complete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a task as complete."""
    task = db.query(ChecklistTask).filter(ChecklistTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task tidak ditemukan")
    
    task.completed = True
    task.completed_at = datetime.now()
    db.commit()
    db.refresh(task)
    return task
