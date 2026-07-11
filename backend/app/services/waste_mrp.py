import json
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.cow import Cow, CowStatus
from app.models.waste import WasteBatch, WasteBatchStatus
from app.models.checklist import ChecklistTask, ChecklistPriority, ChecklistActionType


def calculate_expected_waste(db: Session) -> float:
    """
    Calculate the expected raw waste production for today.
    Assumption: 25kg of raw waste per active cow per day.
    """
    active_cows_count = db.query(Cow).filter(Cow.status.notin_([CowStatus.DEAD, CowStatus.SOLD])).count()
    expected_waste_kg = active_cows_count * 25.0
    return float(expected_waste_kg)


def calculate_expected_fertilizer(raw_waste_kg: float) -> float:
    """
    Calculate the expected fertilizer yield from raw waste.
    Assumption: 60% shrinkage, so yield is 40% of raw weight.
    """
    return raw_waste_kg * 0.40


def check_fermentation_status(db: Session, today: date = None) -> list[WasteBatch]:
    """
    Check all fermenting waste batches. If their fermentation_end date is reached,
    mark them as READY and generate a checklist task to sell the fertilizer.
    """
    if today is None:
        today = date.today()
        
    # Find batches that should be done fermenting
    finished_batches = db.query(WasteBatch).filter(
        WasteBatch.status == WasteBatchStatus.FERMENTING,
        WasteBatch.fermentation_end <= today
    ).all()
    
    for batch in finished_batches:
        batch.status = WasteBatchStatus.READY
        
        # Create a checklist task to remind admin to sell this batch
        # Avoid duplicate tasks for the same batch
        task_title = f"Pupuk Siap Jual (Batch {batch.batch_code})"
        existing_task = db.query(ChecklistTask).filter(
            ChecklistTask.title == task_title,
            ChecklistTask.completed == False
        ).first()
        
        if not existing_task:
            new_task = ChecklistTask(
                date=today,
                priority=ChecklistPriority.MEDIUM,
                title=task_title,
                description=f"Batch {batch.batch_code} telah selesai fermentasi. Estimasi pupuk siap jual: {batch.estimated_fertilizer_kg:.2f} kg.",
                action_type=ChecklistActionType.CREATE_OFFER,
                action_payload=json.dumps({"batch_id": batch.id, "suggested_qty": float(batch.estimated_fertilizer_kg)})
            )
            db.add(new_task)
            
    if finished_batches:
        db.commit()
        
    return finished_batches
