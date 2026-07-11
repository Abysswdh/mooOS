import json
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.cow import Cow, CowStatus
from app.models.feed import FeedStock
from app.models.checklist import ChecklistTask, ChecklistPriority, ChecklistActionType


def calculate_daily_feed_requirement(db: Session) -> dict:
    """
    Calculate the total daily feed required for all active cows.
    Forage (Hijauan) = 10% of total body weight
    Concentrate (Konsentrat) = 2% of total body weight
    """
    # Active cows: not dead and not sold
    active_cows = db.query(Cow).filter(Cow.status.notin_([CowStatus.DEAD, CowStatus.SOLD])).all()
    
    total_weight = sum(float(cow.weight_kg) for cow in active_cows if cow.weight_kg is not None)
    
    total_forage_kg = total_weight * 0.10
    total_concentrate_kg = total_weight * 0.02
    
    return {
        "active_cows": len(active_cows),
        "total_weight_kg": total_weight,
        "total_forage_kg": total_forage_kg,
        "total_concentrate_kg": total_concentrate_kg
    }


def analyze_stock_status(db: Session, today: date = None) -> dict:
    """
    Compare current feed stock with daily requirements to find run-out date
    and generate checklist tasks if stock is critical.
    We assume the feed stock in the database refers exclusively to Concentrate.
    """
    if today is None:
        today = date.today()
        
    requirements = calculate_daily_feed_requirement(db)
    daily_concentrate_req = requirements["total_concentrate_kg"]
    
    # Calculate current stock
    current_stock_result = db.query(func.sum(FeedStock.change_kg)).scalar()
    current_stock = float(current_stock_result) if current_stock_result is not None else 0.0
    
    # Calculate remaining days
    remaining_days = current_stock / daily_concentrate_req if daily_concentrate_req > 0 else 999.0
    
    # Safety stock (e.g. 7 days buffer)
    safety_stock_days = 7
    is_critical = remaining_days <= safety_stock_days
    
    # Check if a checklist task already exists for today to avoid duplicates
    existing_task = db.query(ChecklistTask).filter(
        ChecklistTask.date == today,
        ChecklistTask.action_type == ChecklistActionType.CREATE_PO,
        ChecklistTask.title.like("Stok Pakan Menipis%")
    ).first()
    
    if is_critical and not existing_task:
        new_task = ChecklistTask(
            date=today,
            priority=ChecklistPriority.HIGH,
            title=f"Stok Pakan Menipis (Sisa {int(remaining_days)} Hari)",
            description=f"Stok konsentrat saat ini {current_stock:.2f} kg, dengan kebutuhan harian {daily_concentrate_req:.2f} kg. Segera buat PO Pakan.",
            action_type=ChecklistActionType.CREATE_PO,
            action_payload=json.dumps({"default_quantity": int(daily_concentrate_req * 30)}) # Suggest 1 month supply
        )
        db.add(new_task)
        db.commit()
    elif not is_critical and existing_task and not existing_task.completed:
        # If stock is replenished and no longer critical, we can resolve the task
        existing_task.completed = True
        db.commit()
        
    return {
        "current_stock_kg": current_stock,
        "daily_requirement_kg": daily_concentrate_req,
        "remaining_days": remaining_days,
        "safety_stock_days": safety_stock_days,
        "is_critical": is_critical
    }
