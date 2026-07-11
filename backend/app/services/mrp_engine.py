from datetime import date
from sqlalchemy.orm import Session

from app.services.feed_mrp import analyze_stock_status
from app.services.waste_mrp import check_fermentation_status
from app.services.milk_mrp import analyze_production_performance
from app.services.member_mrp import MemberMRP

def run_daily_mrp_checks(db: Session, target_date: date = None) -> dict:
    """
    Central orchestrator to run all MRP checks:
    1. Feed stock analysis (triggers PO alerts)
    2. Waste fermentation analysis (triggers Sale alerts)
    3. Milk production analysis (triggers Reporting alerts)
    """
    if target_date is None:
        target_date = date.today()
        
    results = {}
    
    # 1. Feed MRP
    try:
        feed_status = analyze_stock_status(db, today=target_date)
        results["feed"] = feed_status
    except Exception as e:
        results["feed"] = {"error": str(e)}
        
    # 2. Waste MRP
    try:
        finished_batches = check_fermentation_status(db, today=target_date)
        results["waste"] = {"finished_batches_count": len(finished_batches)}
    except Exception as e:
        results["waste"] = {"error": str(e)}
        
    # 3. Milk MRP
    try:
        milk_status = analyze_production_performance(db, target_date=target_date)
        results["milk"] = milk_status
    except Exception as e:
        results["milk"] = {"error": str(e)}
        
    # 4. Member MRP (Simpanan Wajib)
    try:
        MemberMRP.calculate_simpanan_wajib(db)
        db.commit()
        results["member"] = {"status": "success"}
    except Exception as e:
        db.rollback()
        results["member"] = {"error": str(e)}

    return {
        "date": target_date.isoformat(),
        "status": "success",
        "mrp_results": results
    }
