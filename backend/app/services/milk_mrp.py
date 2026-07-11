import json
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.cow import Cow, CowStatus, CowType, CowGender
from app.models.milk import MilkRecord
from app.models.checklist import ChecklistTask, ChecklistPriority, ChecklistActionType


def calculate_projected_yield(db: Session) -> dict:
    """
    Calculate projected milk yield based on active dairy cows.
    Assumption: Each active, female, dairy cow produces 15L per day.
    """
    lactating_cows = db.query(Cow).filter(
        Cow.status.notin_([CowStatus.DEAD, CowStatus.SOLD]),
        Cow.cow_type == CowType.DAIRY,
        Cow.gender == CowGender.FEMALE
    ).all()
    
    cow_count = len(lactating_cows)
    projected_liters = cow_count * 15.0  # 15 liters per cow
    
    return {
        "lactating_cows_count": cow_count,
        "projected_liters": float(projected_liters)
    }


def analyze_production_performance(db: Session, target_date: date = None) -> dict:
    """
    Compare actual milk production vs projected for a specific date.
    Generate a checklist task if production hasn't been reported.
    """
    if target_date is None:
        target_date = date.today()
        
    projected = calculate_projected_yield(db)
    
    actual_liters_result = db.query(func.sum(MilkRecord.liters)).filter(
        MilkRecord.date == target_date
    ).scalar()
    
    actual_liters = float(actual_liters_result) if actual_liters_result is not None else 0.0
    
    performance_ratio = (actual_liters / projected["projected_liters"]) if projected["projected_liters"] > 0 else 0
    
    # If it's today and actual liters is 0, remind them to report milk
    if actual_liters == 0 and projected["projected_liters"] > 0:
        task_title = "Pemerahan Susu Belum Dilaporkan"
        existing_task = db.query(ChecklistTask).filter(
            ChecklistTask.date == target_date,
            ChecklistTask.title == task_title
        ).first()
        
        if not existing_task:
            new_task = ChecklistTask(
                date=target_date,
                priority=ChecklistPriority.HIGH,
                title=task_title,
                description=f"Catatan hasil perah susu hari ini belum dimasukkan. Estimasi hasil: {projected['projected_liters']:.1f} L.",
                action_type=ChecklistActionType.OPEN_MODAL,
                action_payload=json.dumps({"modal_name": "MilkCreateModal"})
            )
            db.add(new_task)
            db.commit()
    elif actual_liters > 0:
        # If it was reported, complete the reminder task if it exists
        existing_task = db.query(ChecklistTask).filter(
            ChecklistTask.date == target_date,
            ChecklistTask.title == "Pemerahan Susu Belum Dilaporkan",
            ChecklistTask.completed == False
        ).first()
        
        if existing_task:
            existing_task.completed = True
            db.commit()
            
    return {
        "date": target_date.isoformat(),
        "projected_liters": projected["projected_liters"],
        "actual_liters": actual_liters,
        "performance_ratio": performance_ratio
    }
