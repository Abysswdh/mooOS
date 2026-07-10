from pydantic import BaseModel

class SettingsUpdate(BaseModel):
    koperasi_name: str | None = None
    koperasi_address: str | None = None
    telegram_notifications_enabled: bool | None = None
    auto_price_fluctuation_enabled: bool | None = None

class SettingsResponse(BaseModel):
    koperasi_name: str
    koperasi_address: str
    telegram_notifications_enabled: bool
    auto_price_fluctuation_enabled: bool
