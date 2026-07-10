from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.dependencies import get_current_user
from app.models.telegram_contact import TelegramContact, TelegramContactRole

router = APIRouter(prefix="/telegram", tags=["Telegram"])

@router.post("/send-tasklist", status_code=status.HTTP_200_OK)
def send_tasklist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Sends morning tasklist to PJ Kandang via Telegram."""
    try:
        from app.bot import bot
        if not bot:
            raise HTTPException(status_code=503, detail="Telegram bot is not configured")
            
        contacts = db.query(TelegramContact).filter(TelegramContact.role == TelegramContactRole.PJ_KANDANG).all()
        
        msg = (
            "\U0001f4cb *Tugas Hari Ini*\n\n"
            "1. Beri pakan sapi pagi\n"
            "2. Peras susu (sesi 1)\n"
            "3. Bersihkan area kandang\n"
            "4. Kumpulkan limbah kotoran\n\n"
            "Semangat bekerja! \U0001f69c\U0001f404"
        )
        
        sent_count = 0
        for contact in contacts:
            try:
                bot.send_message(contact.telegram_user_id, msg, parse_mode="Markdown")
                sent_count += 1
            except Exception as e:
                print(f"Failed to send tasklist to {contact.telegram_user_id}: {e}")
                
        return {"status": "success", "sent_count": sent_count, "total_contacts": len(contacts)}
        
    except ImportError:
        raise HTTPException(status_code=500, detail="Bot module not found")


@router.post("/send-closing", status_code=status.HTTP_200_OK)
def send_closing(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Sends evening closing message to all PJ Kandang via Telegram."""
    try:
        from app.bot import bot
        if not bot:
            raise HTTPException(status_code=503, detail="Telegram bot is not configured")
            
        contacts = db.query(TelegramContact).filter(TelegramContact.role == TelegramContactRole.PJ_KANDANG).all()
        
        msg = (
            "\U0001f305 *Salam Penutup Sore*\n\n"
            "Pekerjaan hari ini telah selesai.\n"
            "Terima kasih atas kerja keras Anda hari ini, PJ Kandang! \U0001f44f\n\n"
            "Ingat untuk:\n"
            "\u2705 Mengunci pintu kandang\n"
            "\u2705 Mematikan lampu\n"
            "\u2705 Memastikan air minum sapi cukup\n\n"
            "Sampai besok! \U0001f31f"
        )
        
        sent_count = 0
        for contact in contacts:
            try:
                bot.send_message(contact.telegram_user_id, msg, parse_mode="Markdown")
                sent_count += 1
            except Exception as e:
                print(f"Failed to send closing to {contact.telegram_user_id}: {e}")
                
        return {"status": "success", "sent_count": sent_count, "total_contacts": len(contacts)}
        
    except ImportError:
        raise HTTPException(status_code=500, detail="Bot module not found")
