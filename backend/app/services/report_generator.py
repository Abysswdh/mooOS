from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.cow import Cow, CowStatus
from app.models.milk import MilkRecord
from app.models.feed import FeedStock
from app.models.waste import WasteBatch, WasteBatchStatus
from app.models.market_price import DailyMarketPrice, MarketItemType
from app.models.member import Member


def _get_latest_prices(db: Session, target_date: date = None) -> dict:
    if target_date is None:
        target_date = date.today()
        
    prices = db.query(DailyMarketPrice).filter(DailyMarketPrice.date == target_date).all()
    price_map = {p.item_type: float(p.price_per_unit) for p in prices}
    
    # Fallback to older prices if not found today
    if len(price_map) < 3:
        for item_type in MarketItemType:
            if item_type not in price_map:
                latest = (
                    db.query(DailyMarketPrice)
                    .filter(
                        DailyMarketPrice.item_type == item_type,
                        DailyMarketPrice.date <= target_date
                    )
                    .order_by(DailyMarketPrice.date.desc())
                    .first()
                )
                if latest:
                    price_map[item_type] = float(latest.price_per_unit)
                
    return {
        "susu": price_map.get(MarketItemType.SUSU, 7000.0),
        "pakan": price_map.get(MarketItemType.PAKAN, 5000.0),
        "pupuk": price_map.get(MarketItemType.PUPUK, 1500.0)
    }

def get_daily_report_data(db: Session, target_date: date) -> dict:
    """Generate daily report metrics."""
    prices = _get_latest_prices(db, target_date)
    
    active_cows = db.query(Cow).filter(Cow.status == CowStatus.AVAILABLE).count()
    sick_cows = db.query(Cow).filter(Cow.status == CowStatus.SICK).count()
    
    total_milk = float(
        db.query(func.sum(MilkRecord.liters))
        .filter(MilkRecord.date == target_date)
        .scalar() or 0.0
    )
    
    # We estimate daily feed consumed based on active cows, assuming 10kg/day
    daily_feed_consumed = active_cows * 10.0
    
    feed_stock = float(db.query(func.sum(FeedStock.change_kg)).scalar() or 0.0)
    
    fertilizer_sold_kg = float(
        db.query(func.sum(WasteBatch.estimated_fertilizer_kg))
        .filter(WasteBatch.status == WasteBatchStatus.SOLD)
        .scalar() or 0.0
    )
    
    milk_revenue = total_milk * prices["susu"]
    fertilizer_revenue = fertilizer_sold_kg * prices["pupuk"]
    total_revenue = milk_revenue + fertilizer_revenue
    
    feed_expense = daily_feed_consumed * prices["pakan"]
    total_expense = feed_expense
    
    net_profit = total_revenue - total_expense
    
    return {
        "date": target_date,
        "total_milk_liters": total_milk,
        "feed_stock_kg": feed_stock,
        "feed_consumed_kg": daily_feed_consumed,
        "milk_revenue": milk_revenue,
        "fertilizer_revenue": fertilizer_revenue,
        "total_revenue": total_revenue,
        "feed_expense": feed_expense,
        "total_expense": total_expense,
        "net_profit": net_profit,
        "active_cows": active_cows,
        "sick_cows": sick_cows,
        "total_members_active": db.query(Member).filter(Member.is_active == True).count(),
        "susu_price_per_liter": prices["susu"],
        "pakan_price_per_kg": prices["pakan"],
        "pupuk_price_per_kg": prices["pupuk"]
    }


def get_financial_summary_data(db: Session) -> dict:
    """Aggregate financial summary for the dashboard."""
    prices = _get_latest_prices(db)
    
    total_milk = float(db.query(func.sum(MilkRecord.liters)).scalar() or 0.0)
    milk_rev = total_milk * prices["susu"]
    
    fert = float(
        db.query(func.sum(WasteBatch.estimated_fertilizer_kg))
        .filter(WasteBatch.status == WasteBatchStatus.SOLD)
        .scalar() or 0.0
    )
    fert_rev = fert * prices["pupuk"]
    
    active_cows = db.query(Cow).filter(Cow.status == CowStatus.AVAILABLE).count()
    # Assume 30 days of feed history for the sake of the demo
    feed_exp = active_cows * 10.0 * 30 * prices["pakan"]
    
    # Flat costs
    salary_exp = 10000000.0
    maintenance_exp = 3000000.0
    utilities_exp = 2000000.0
    
    net_profit = (milk_rev + fert_rev) - (feed_exp + salary_exp + maintenance_exp + utilities_exp)
    
    return {
        "income": [
            {"name": "Penjualan Susu", "value": milk_rev, "color": "#3b82f6"},
            {"name": "Penjualan Pupuk", "value": fert_rev, "color": "#10b981"},
        ],
        "expenses": [
            {"name": "Beli Pakan", "value": feed_exp, "color": "#f59e0b"},
            {"name": "Biaya Gaji", "value": salary_exp, "color": "#ef4444"},
            {"name": "Perawatan Kandang", "value": maintenance_exp, "color": "#8b5cf6"},
            {"name": "Listrik & Fasilitas", "value": utilities_exp, "color": "#ec4899"},
        ],
        "net_profit": net_profit
    }


def get_shu_distribution_data(db: Session) -> dict:
    """Calculate SHU (Sisa Hasil Usaha) distribution per member based on cow count."""
    prices = _get_latest_prices(db)
    
    total_milk = float(db.query(func.sum(MilkRecord.liters)).scalar() or 0.0)
    active_cows = db.query(Cow).filter(Cow.status == CowStatus.AVAILABLE).count()
    
    net_profit = (total_milk * prices["susu"]) - (active_cows * 10.0 * 30 * prices["pakan"]) - 15000000.0
    member_pool = max(net_profit * 0.7, 0) # 70% goes to members
    
    # We distribute based on total active cows
    total_cows_factor = active_cows if active_cows > 0 else 1.0
    
    members = db.query(Member).filter(Member.is_active == True).all()
    distribution = []
    
    for m in members:
        # Only count available cows for SHU logic to be fair
        m_cows = db.query(Cow).filter(Cow.owner_id == m.id, Cow.status == CowStatus.AVAILABLE).count()
        
        proportion = m_cows / total_cows_factor
        shu = member_pool * proportion
        
        distribution.append({
            "member_name": m.name,
            "total_cows": m_cows,
            "total_milk_contribution_liters": 0, # Kept for schema compatibility, though unused in UI
            "shu_amount": shu
        })
        
    distribution.sort(key=lambda x: x["shu_amount"], reverse=True)
    
    return {
        "ratios": {"koperasi_cut_percent": 30, "member_cut_percent": 70},
        "distribution": distribution
    }
