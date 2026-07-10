from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_db
from app.models.settings import SystemSettings
from app.schemas.settings import SettingsResponse, SettingsUpdate

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("/", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    """Get system settings."""
    settings = db.get(SystemSettings, 1)
    if not settings:
        settings = SystemSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/", response_model=SettingsResponse)
def update_settings(update_data: SettingsUpdate, db: Session = Depends(get_db)):
    """Update system settings."""
    settings = db.get(SystemSettings, 1)
    if not settings:
        settings = SystemSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(settings, key, value)
        
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings
