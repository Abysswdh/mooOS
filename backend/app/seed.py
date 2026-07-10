"""Seed database with demo data."""

import random
from datetime import datetime, timedelta

from app.database import SessionLocal, create_all_tables
from app.models.user import User, UserRole
from app.models.member import Member
from app.models.barn import Barn
from app.models.cow import Cow, CowStatus, CowType, CowGender
from app.models.feed import FeedStock
from app.models.milk import MilkRecord
from app.models.waste import WasteBatch, WasteBatchStatus
from app.models.market_price import DailyMarketPrice, MarketItemType, PriceSource
from app.models.health_log import HealthLog, HealthEventType
from app.models.checklist import ChecklistTask, ChecklistPriority, ChecklistActionType
from app.utils.security import get_password_hash


def seed_db():
    print("Creating tables...")
    create_all_tables()

    db = SessionLocal()

    # Check if we already seeded
    if db.query(User).first():
        print("Database already seeded. Skipping.")
        db.close()
        return

    print("Seeding admin user...")
    admin = User(
        email="admin@mooos.com",
        password_hash=get_password_hash("admin123"),
        name="Admin MooOS",
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(admin)
    db.commit()

    print("Seeding barns (Kandang A & B)...")
    barn_a = Barn(name="Kandang A", location="Blok A", capacity=30, caretaker_name="Abyasa")
    barn_b = Barn(name="Kandang B", location="Blok B", capacity=30, caretaker_name="Axel")
    db.add(barn_a)
    db.add(barn_b)
    db.commit()
    db.refresh(barn_a)
    db.refresh(barn_b)

    print("Seeding members...")
    members = []
    for i in range(1, 11):
        member = Member(
            nik=f"32010100000000{i:02d}",
            name=f"Peternak {i}",
            phone=f"0812000000{i:02d}",
            address=f"Desa Suka Maju RT 0{i}",
            simpanan_pokok=100000,
            simpanan_wajib=50000
        )
        members.append(member)
        db.add(member)
    db.commit()
    
    for m in members:
        db.refresh(m)

    print("Seeding cows...")
    cows = []
    for i in range(1, 51):
        owner = random.choice(members)
        cow = Cow(
            code=f"COW-{i:03d}",
            name=f"Sapi {i}",
            breed="Friesian Holstein",
            gender=CowGender.FEMALE,
            cow_type=CowType.DAIRY,
            weight_kg=random.uniform(400, 600),
            status=random.choices([CowStatus.AVAILABLE, CowStatus.SICK], weights=[90, 10])[0],
            owner_id=owner.id
        )
        cows.append(cow)
        db.add(cow)
    db.commit()
    
    for c in cows:
        db.refresh(c)

    print("Seeding feed stock...")
    feed_stock = FeedStock(
        date=datetime.now(),
        change_kg=5000.0,
        reason="Stok awal"
    )
    db.add(feed_stock)
    db.commit()
    
    print("Seeding milk records for today...")
    today = datetime.now()
    for cow in cows:
        if cow.status == CowStatus.AVAILABLE:
            record = MilkRecord(
                cow_id=cow.id,
                date=today.date(),
                liters=random.uniform(10, 20),
                recorded_by="Admin MooOS"
            )
            db.add(record)
    db.commit()

    print("Seeding waste batches...")
    for barn in [barn_a, barn_b]:
        batch_1 = WasteBatch(
            barn_id=barn.id,
            batch_code=f"WB-{barn.id}-{today.strftime('%Y%m%d')}-01",
            raw_waste_kg=500.0,
            estimated_fertilizer_kg=250.0,
            status=WasteBatchStatus.FERMENTING,
            fermentation_start=today.date() - timedelta(days=5),
        )
        batch_2 = WasteBatch(
            barn_id=barn.id,
            batch_code=f"WB-{barn.id}-{today.strftime('%Y%m%d')}-02",
            raw_waste_kg=400.0,
            estimated_fertilizer_kg=200.0,
            status=WasteBatchStatus.READY,
            fermentation_start=today.date() - timedelta(days=15),
            fermentation_end=today.date() - timedelta(days=1),
        )
        db.add(batch_1)
        db.add(batch_2)
    db.commit()

    print("Seeding market prices...")
    for i in range(7):
        d = today.date() - timedelta(days=i)
        db.add(DailyMarketPrice(date=d, item_type=MarketItemType.PAKAN, price_per_unit=5500 + random.randint(-200, 200), source=PriceSource.ADMIN))
        db.add(DailyMarketPrice(date=d, item_type=MarketItemType.SUSU, price_per_unit=8500 + random.randint(-300, 300), source=PriceSource.ADMIN))
        db.add(DailyMarketPrice(date=d, item_type=MarketItemType.PUPUK, price_per_unit=1200 + random.randint(-100, 100), source=PriceSource.ADMIN))
    db.commit()

    print("Seeding health logs...")
    for cow in cows:
        if cow.status == CowStatus.SICK:
            log = HealthLog(
                cow_id=cow.id,
                event_type=HealthEventType.SICK,
                description="Diagnosa mastitis ringan.",
                reported_by="Admin MooOS",
            )
            db.add(log)
    db.commit()

    print("Seeding checklist tasks...")
    tasks = [
        ChecklistTask(
            date=today.date(),
            priority=ChecklistPriority.HIGH,
            title="Stok pakan menipis (sisa < 1000 kg)",
            description="Segera buat Purchase Order ke supplier.",
            action_type=ChecklistActionType.CREATE_PO,
        ),
        ChecklistTask(
            date=today.date(),
            priority=ChecklistPriority.MEDIUM,
            title="Ada 3 sapi sakit di Kandang A",
            description="Periksa dan berikan penanganan medis.",
            action_type=ChecklistActionType.NAVIGATE,
            action_payload='{"url": "/cows?status=SICK"}'
        ),
        ChecklistTask(
            date=today.date(),
            priority=ChecklistPriority.INFO,
            title="Pupuk kompos Batch 02 siap dijual",
            description="Broadcast penawaran pupuk ke Telegram Group.",
            action_type=ChecklistActionType.CREATE_OFFER,
        )
    ]
    for t in tasks:
        db.add(t)
    db.commit()

    print("Seeding finished!")
    db.close()


if __name__ == "__main__":
    seed_db()
