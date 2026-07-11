"""
Central model registry — import all models here for easy access.

Usage:
    from app.models import User, Cow, Member, Barn, ...
"""

from app.models.user import User, UserRole
from app.models.member import Member
from app.models.barn import Barn
from app.models.cow import Cow, CowGender, CowStatus, CowType
from app.models.milk import DailyBarnLog, DailyBarnLogType, MilkRecord
from app.models.milk_offer import MilkOffer, MilkOfferRecipient, MilkOfferStatus
from app.models.feed import FeedOrder, FeedOrderRecipient, FeedOrderStatus, FeedStock
from app.models.waste import (
    FertilizerOffer,
    FertilizerOfferRecipient,
    FertilizerOfferStatus,
    WasteBatch,
    WasteBatchStatus,
)
from app.models.market_price import DailyMarketPrice, MarketItemType, PriceSource
from app.models.checklist import (
    ChecklistActionType,
    ChecklistPriority,
    ChecklistTask,
)
from app.models.notification import Notification, NotificationType
from app.models.attendance import AttendanceLog
from app.models.telegram_contact import TelegramContact, TelegramContactRole
from app.models.health_log import HealthLog, HealthEventType
from app.models.settings import SystemSettings
from app.models.auction import AuctionBid, AuctionItemType
from app.models.invoice import Invoice

__all__ = [
    # User
    "User",
    "UserRole",
    # Member
    "Member",
    # Barn
    "Barn",
    # Cow
    "Cow",
    "CowGender",
    "CowStatus",
    "CowType",
    # Milk
    "MilkRecord",
    "DailyBarnLog",
    "DailyBarnLogType",
    "MilkOffer",
    "MilkOfferRecipient",
    "MilkOfferStatus",
    # Feed
    "FeedOrder",
    "FeedOrderRecipient",
    "FeedOrderStatus",
    "FeedStock",
    # Waste
    "WasteBatch",
    "WasteBatchStatus",
    "FertilizerOffer",
    "FertilizerOfferRecipient",
    "FertilizerOfferStatus",
    # Market Price
    "DailyMarketPrice",
    "MarketItemType",
    "PriceSource",
    # Checklist
    "ChecklistTask",
    "ChecklistPriority",
    "ChecklistActionType",
    # Notification
    "Notification",
    "NotificationType",
    # Attendance
    "AttendanceLog",
    # Telegram
    "TelegramContact",
    "TelegramContactRole",
    # Health
    "HealthLog",
    "HealthEventType",
    # Settings
    "SystemSettings",
    # Auction
    "AuctionBid",
    "AuctionItemType",
    # Invoice
    "Invoice",
]
