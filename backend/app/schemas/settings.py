from pydantic import BaseModel

class SettingsUpdate(BaseModel):
    koperasi_name: str | None = None
    address: str | None = None
    enable_telegram_notif: bool | None = None
    auto_price_fluctuation: bool | None = None
    simpanan_pokok_default: float | None = None
    simpanan_wajib_per_sapi: float | None = None
    pj_kandang_telegram_id: str | None = None
    telegram_bot_token: str | None = None

class SettingsResponse(BaseModel):
    koperasi_name: str
    address: str
    enable_telegram_notif: bool
    auto_price_fluctuation: bool
    simpanan_pokok_default: float
    simpanan_wajib_per_sapi: float
    pj_kandang_telegram_id: str | None = None
    telegram_bot_token: str | None = None
