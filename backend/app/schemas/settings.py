from pydantic import BaseModel

class SettingsUpdate(BaseModel):
    koperasi_name: str | None = None
    address: str | None = None
    enable_telegram_notif: bool | None = None
    auto_price_fluctuation: bool | None = None

class SettingsResponse(BaseModel):
    koperasi_name: str
    address: str
    enable_telegram_notif: bool
    auto_price_fluctuation: bool
