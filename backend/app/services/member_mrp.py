from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.member import Member
from app.models.cow import Cow
from app.models.settings import SystemSettings
import logging

logger = logging.getLogger(__name__)

class MemberMRP:
    """
    MRP rules related to Member finances (Simpanan Wajib).
    """

    @staticmethod
    def calculate_simpanan_wajib(db: Session) -> None:
        """
        Recalculates the total simpanan wajib for each member based on their active cows.
        Formula:
        member.simpanan_wajib = (number of active cows) * (settings.simpanan_wajib_per_sapi)
        """
        logger.info("MemberMRP: Calculating simpanan wajib based on active cows")
        
        settings = db.query(SystemSettings).first()
        if not settings:
            logger.warning("MemberMRP: SystemSettings not found, skipping simpanan calculation")
            return
            
        simpanan_wajib_per_sapi = float(settings.simpanan_wajib_per_sapi)
        
        members = db.query(Member).filter(Member.is_active == True).all()
        for member in members:
            # Count active cows (not dead, not sold)
            active_cows_count = db.query(func.count(Cow.id)).filter(
                Cow.owner_id == member.id,
                Cow.status.in_(["AVAILABLE", "SICK"])
            ).scalar() or 0
            
            new_simpanan_wajib = active_cows_count * simpanan_wajib_per_sapi
            
            # Update member's simpanan_wajib
            if float(member.simpanan_wajib) != new_simpanan_wajib:
                logger.info(f"MemberMRP: Updating member {member.name} (ID: {member.id}) simpanan_wajib to {new_simpanan_wajib}")
                member.simpanan_wajib = new_simpanan_wajib
                
        # Changes are not committed here. The caller (mrp_engine) handles the transaction.
