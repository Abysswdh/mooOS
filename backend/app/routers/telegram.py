import threading
import datetime as dt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models.user import User
from app.dependencies import get_current_user
from app.models.telegram_contact import TelegramContact, TelegramContactRole

router = APIRouter(prefix="/telegram", tags=["Telegram"])

# ---------------------------------------------------------------------------
# Price-collection session helpers
# ---------------------------------------------------------------------------

PRICE_COLLECTION_DURATION_SECONDS = 120  # 2 minutes

def _finalize_price_collection():
    """
    Called by a background timer ~2 minutes after 'Minta Harga dari Grup'.
    Reads all TELEGRAM-sourced prices for today, selects the best per type,
    marks them as active, and broadcasts a summary to each group.
    """
    from app.models.market_price import DailyMarketPrice, PriceSource, MarketItemType
    from app.bot import bot
    from app.config import get_settings
    settings = get_settings()

    today = dt.date.today()
    db = SessionLocal()
    try:
        # Gather all raw submissions for today from Telegram
        raw_prices = db.query(DailyMarketPrice).filter(
            DailyMarketPrice.date == today,
            DailyMarketPrice.source == PriceSource.TELEGRAM
        ).all()

        if not raw_prices:
            print("[PriceCollection] No prices submitted — skipping finalization.")
            return

        # Group by type: pick best
        best: dict[str, float] = {}
        for p in raw_prices:
            t = p.item_type.value if hasattr(p.item_type, 'value') else p.item_type
            v = float(p.price_per_unit)
            if t not in best:
                best[t] = v
            else:
                # PAKAN → lowest; SUSU/PUPUK → highest
                if t == "PAKAN":
                    best[t] = min(best[t], v)
                else:
                    best[t] = max(best[t], v)

        # Upsert best prices as TELEGRAM source (already stored in real-time by bot)
        # The bot.handle_price_submission already updates on every submission,
        # so by now the DB already has the best values. Just announce.

        # Announce results to each group
        group_map = {
            "PAKAN": (settings.TELEGRAM_GROUP_PAKAN, "🌾", "kg"),
            "SUSU": (settings.TELEGRAM_GROUP_SUSU, "🥛", "liter"),
            "PUPUK": (settings.TELEGRAM_GROUP_PUPUK, "🌿", "kg"),
        }

        if bot:
            for item_type, (group_id, emoji, unit) in group_map.items():
                if not group_id or item_type not in best:
                    continue
                price_val = best[item_type]
                msg = (
                    f"⏱️ *Sesi Harga Selesai!*\n\n"
                    f"{emoji} *Harga {item_type.capitalize()} Terbaik Hari Ini*\n"
                    f"Rp{price_val:,.0f}/{unit}\n\n"
                    f"✅ Harga ini telah disimpan sebagai harga pasar aktif MooOS."
                )
                try:
                    bot.send_message(group_id, msg, parse_mode="Markdown")
                except Exception as e:
                    print(f"[PriceCollection] Failed to announce to {item_type} group: {e}")

        print(f"[PriceCollection] Finalized prices: {best}")

    except Exception as e:
        print(f"[PriceCollection] Error during finalization: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

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


@router.post("/request-price-poll", status_code=status.HTTP_200_OK)
def request_price_poll(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Trigger price voting messages to all configured Telegram groups.

    After sending, spawns a background timer. After PRICE_COLLECTION_DURATION_SECONDS
    (2 minutes), _finalize_price_collection() picks best prices and announces results.
    """
    try:
        from app.bot import bot
        from app.config import get_settings as get_app_settings
        if not bot:
            raise HTTPException(status_code=503, detail="Telegram bot is not configured")

        app_settings = get_app_settings()
        sent_count = 0
        duration_min = PRICE_COLLECTION_DURATION_SECONDS // 60

        groups = {
            "pakan": (
                app_settings.TELEGRAM_GROUP_PAKAN,
                (
                    f"\U0001f33e *Sesi Harga Pakan Dimulai!*\n\n"
                    f"Kirim harga pakan Anda (per kg):\n"
                    f"`pakan <harga>` \u2014 contoh: `pakan 3500`\n\n"
                    f"Bot pilih harga *termurah*.\n"
                    f"\u23f1 Sesi otomatis tutup dalam *{duration_min} menit*."
                ),
            ),
            "susu": (
                app_settings.TELEGRAM_GROUP_SUSU,
                (
                    f"\U0001f95b *Sesi Harga Susu Dimulai!*\n\n"
                    f"Kirim harga beli susu Anda (per liter):\n"
                    f"`susu <harga>` \u2014 contoh: `susu 7000`\n\n"
                    f"Bot pilih harga *tertinggi*.\n"
                    f"\u23f1 Sesi otomatis tutup dalam *{duration_min} menit*."
                ),
            ),
            "pupuk": (
                app_settings.TELEGRAM_GROUP_PUPUK,
                (
                    f"\U0001f33f *Sesi Harga Pupuk Dimulai!*\n\n"
                    f"Kirim harga beli pupuk Anda (per kg):\n"
                    f"`pupuk <harga>` \u2014 contoh: `pupuk 2000`\n\n"
                    f"Bot pilih harga *tertinggi*.\n"
                    f"\u23f1 Sesi otomatis tutup dalam *{duration_min} menit*."
                ),
            ),
        }

        for item, (group_id, msg) in groups.items():
            if group_id:
                try:
                    bot.send_message(group_id, msg, parse_mode="Markdown")
                    sent_count += 1
                except Exception as e:
                    print(f"Failed to send price poll to {item} group ({group_id}): {e}")

        # ── Auto-close timer ──────────────────────────────────────────────────
        timer = threading.Timer(PRICE_COLLECTION_DURATION_SECONDS, _finalize_price_collection)
        timer.daemon = True
        timer.start()
        print(f"[PriceCollection] Session started. Auto-close in {PRICE_COLLECTION_DURATION_SECONDS}s.")
        # ─────────────────────────────────────────────────────────────────────

        return {
            "status": "success",
            "sent_count": sent_count,
            "total_groups": len([g for _, (g, _) in groups.items() if g]),
            "auto_close_in_seconds": PRICE_COLLECTION_DURATION_SECONDS,
        }

    except ImportError:
        raise HTTPException(status_code=500, detail="Bot module not found")
