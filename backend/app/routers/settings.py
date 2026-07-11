from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.settings import SystemSettings
from app.schemas.settings import SettingsResponse, SettingsUpdate

router = APIRouter(prefix="/settings", tags=["Settings"])


from app.models.telegram_contact import TelegramContact, TelegramContactRole

def _get_or_create_settings(db: Session) -> SystemSettings:
    """Get settings row (id=1), creating it with defaults if absent."""
    settings = db.get(SystemSettings, 1)
    if not settings:
        settings = SystemSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("/", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    """Get system settings."""
    settings = _get_or_create_settings(db)
    
    contact = db.query(TelegramContact).filter(TelegramContact.role == TelegramContactRole.PJ_KANDANG).first()
    pj_kandang_id = contact.telegram_user_id if contact else None
    
    from app.config import get_settings as app_get_settings
    env_settings = app_get_settings()
    
    return SettingsResponse(
        koperasi_name=settings.koperasi_name,
        address=settings.address,
        enable_telegram_notif=settings.enable_telegram_notif,
        auto_price_fluctuation=settings.auto_price_fluctuation,
        simpanan_pokok_default=settings.simpanan_pokok_default,
        simpanan_wajib_per_sapi=settings.simpanan_wajib_per_sapi,
        pj_kandang_telegram_id=pj_kandang_id,
        telegram_bot_token=env_settings.TELEGRAM_BOT_TOKEN
    )


@router.put("/", response_model=SettingsResponse)
def update_settings(update_data: SettingsUpdate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Update system settings."""
    settings = _get_or_create_settings(db)

    update_dict = update_data.model_dump(exclude_unset=True)
    pj_kandang_id = update_dict.pop("pj_kandang_telegram_id", None)
    telegram_bot_token = update_dict.pop("telegram_bot_token", None)
    
    if telegram_bot_token is not None:
        import os
        import dotenv
        dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
        dotenv.set_key(dotenv_path, "TELEGRAM_BOT_TOKEN", telegram_bot_token)
        
        # Trigger uvicorn reload after response is sent by touching main.py
        def trigger_reload():
            import time
            time.sleep(1)
            main_py_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "main.py")
            if os.path.exists(main_py_path):
                os.utime(main_py_path, None)
                
        background_tasks.add_task(trigger_reload)
    
    for key, value in update_dict.items():
        setattr(settings, key, value)

    db.add(settings)
    
    contact = db.query(TelegramContact).filter(TelegramContact.role == TelegramContactRole.PJ_KANDANG).first()
    
    if pj_kandang_id:
        if contact:
            contact.telegram_user_id = pj_kandang_id
        else:
            contact = TelegramContact(
                telegram_user_id=pj_kandang_id,
                display_name="PJ Kandang",
                role=TelegramContactRole.PJ_KANDANG,
                barn_name="Kandang Utama"
            )
            db.add(contact)
    elif "pj_kandang_telegram_id" in update_data.model_dump(exclude_unset=True) and not pj_kandang_id:
        if contact:
            db.delete(contact)

    db.commit()
    db.refresh(settings)
    
    # re-fetch contact just in case
    contact = db.query(TelegramContact).filter(TelegramContact.role == TelegramContactRole.PJ_KANDANG).first()
    
    from app.config import get_settings as app_get_settings
    env_settings = app_get_settings()
    
    return SettingsResponse(
        koperasi_name=settings.koperasi_name,
        address=settings.address,
        enable_telegram_notif=settings.enable_telegram_notif,
        auto_price_fluctuation=settings.auto_price_fluctuation,
        simpanan_pokok_default=settings.simpanan_pokok_default,
        simpanan_wajib_per_sapi=settings.simpanan_wajib_per_sapi,
        pj_kandang_telegram_id=contact.telegram_user_id if contact else None,
        telegram_bot_token=telegram_bot_token if telegram_bot_token is not None else env_settings.TELEGRAM_BOT_TOKEN
    )
