from sqlmodel import SQLModel, Field
from typing import Optional

class SystemSettings(SQLModel, table=True):
    __tablename__ = "system_settings"
    
    id: int = Field(default=1, primary_key=True) # Always use 1
    
    koperasi_name: str = Field(default="KUD Sapi Perah Sejahtera")
    koperasi_address: str = Field(default="Jl. Peternakan No. 1, Lembang")
    
    telegram_notifications_enabled: bool = Field(default=True)
    auto_price_fluctuation_enabled: bool = Field(default=True)
