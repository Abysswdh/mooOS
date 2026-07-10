"""
Central schema registry — import all schemas here for easy access.

Usage:
    from app.schemas import CowCreate, CowResponse, ...
"""

from app.schemas.auth import LoginRequest, TokenPayload, TokenResponse
from app.schemas.user import UserCreate, UserResponse
from app.schemas.cow import CowCreate, CowListResponse, CowResponse, CowUpdate
from app.schemas.member import MemberCreate, MemberListResponse, MemberResponse, MemberUpdate
from app.schemas.barn import BarnCreate, BarnListResponse, BarnResponse, BarnUpdate
from app.schemas.checklist import (
    ChecklistCompleteRequest,
    ChecklistResponse,
    ChecklistTaskResponse,
)
from app.schemas.feed import (
    FeedOrderCreate,
    FeedOrderListResponse,
    FeedOrderResponse,
    FeedStockMovementResponse,
    FeedStockResponse,
)
from app.schemas.milk import (
    MilkOfferCreate,
    MilkOfferListResponse,
    MilkOfferResponse,
    MilkRecordCreate,
    MilkRecordListResponse,
    MilkRecordResponse,
    MilkSummaryResponse,
)
from app.schemas.waste import (
    FertilizerOfferCreate,
    FertilizerOfferListResponse,
    FertilizerOfferResponse,
    WasteBatchCreate,
    WasteBatchListResponse,
    WasteBatchResponse,
    WasteSummaryResponse,
)
from app.schemas.market_price import (
    MarketPriceCreate,
    MarketPriceListResponse,
    MarketPriceResponse,
    TodayPricesSummary,
)
from app.schemas.notification import (
    NotificationListResponse,
    NotificationMarkReadRequest,
    NotificationResponse,
)
from app.schemas.attendance import (
    AttendanceClockInResponse,
    AttendanceClockOutResponse,
    AttendanceListResponse,
    AttendanceLogResponse,
)
from app.schemas.dashboard import DashboardSummary, HealthCheckResponse
from app.schemas.health_log import HealthLogCreate, HealthLogListResponse, HealthLogResponse

__all__ = [
    # Auth
    "LoginRequest",
    "TokenResponse",
    "TokenPayload",
    # User
    "UserCreate",
    "UserResponse",
    # Cow
    "CowCreate",
    "CowUpdate",
    "CowResponse",
    "CowListResponse",
    # Member
    "MemberCreate",
    "MemberUpdate",
    "MemberResponse",
    "MemberListResponse",
    # Barn
    "BarnCreate",
    "BarnUpdate",
    "BarnResponse",
    "BarnListResponse",
    # Checklist
    "ChecklistTaskResponse",
    "ChecklistResponse",
    "ChecklistCompleteRequest",
    # Feed
    "FeedOrderCreate",
    "FeedOrderResponse",
    "FeedOrderListResponse",
    "FeedStockResponse",
    "FeedStockMovementResponse",
    # Milk
    "MilkRecordCreate",
    "MilkRecordResponse",
    "MilkRecordListResponse",
    "MilkSummaryResponse",
    "MilkOfferCreate",
    "MilkOfferResponse",
    "MilkOfferListResponse",
    # Waste
    "WasteBatchCreate",
    "WasteBatchResponse",
    "WasteBatchListResponse",
    "WasteSummaryResponse",
    "FertilizerOfferCreate",
    "FertilizerOfferResponse",
    "FertilizerOfferListResponse",
    # Market Price
    "MarketPriceCreate",
    "MarketPriceResponse",
    "MarketPriceListResponse",
    "TodayPricesSummary",
    # Notification
    "NotificationResponse",
    "NotificationListResponse",
    "NotificationMarkReadRequest",
    # Attendance
    "AttendanceClockInResponse",
    "AttendanceClockOutResponse",
    "AttendanceLogResponse",
    "AttendanceListResponse",
    # Dashboard
    "DashboardSummary",
    "HealthCheckResponse",
    # Health Log
    "HealthLogCreate",
    "HealthLogResponse",
    "HealthLogListResponse",
]
