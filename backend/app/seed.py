"""Seed database with demo data."""

import random
from datetime import datetime, timedelta

from app.database import SessionLocal, create_all_tables
from app.models.user import User, UserRole
from app.models.member import Member
from app.models.cow import Cow, CowStatus, CowType, CowGender
from app.models.feed import FeedStock
from app.models.milk import MilkRecord
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

    print("Seeding finished!")
    db.close()


if __name__ == "__main__":
    seed_db()
