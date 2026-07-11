from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.attendance import AttendanceLog
from app.models.user import User
from app.schemas.attendance import (
    AttendanceClockInResponse, AttendanceClockOutResponse, AttendanceLogResponse
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.get("/today", response_model=AttendanceLogResponse | None)
def get_today_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get today's attendance log for the current user."""
    today = date.today()
    log = db.query(AttendanceLog).filter(
        AttendanceLog.user_id == current_user.id,
        func.date(AttendanceLog.clock_in) == today
    ).first()
    return log


@router.post("/clock-in", response_model=AttendanceClockInResponse, status_code=status.HTTP_201_CREATED)
def clock_in(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clock in for the day."""
    today = date.today()
    existing_log = db.query(AttendanceLog).filter(
        AttendanceLog.user_id == current_user.id,
        func.date(AttendanceLog.clock_in) == today
    ).first()
    
    if existing_log:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sudah melakukan clock in hari ini."
        )
        
    new_log = AttendanceLog(
        user_id=current_user.id,
        clock_in=datetime.now()
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log


@router.post("/clock-out", response_model=AttendanceClockOutResponse)
def clock_out(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clock out for the day."""
    today = date.today()
    log = db.query(AttendanceLog).filter(
        AttendanceLog.user_id == current_user.id,
        func.date(AttendanceLog.clock_in) == today
    ).first()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Belum melakukan clock in hari ini."
        )
        
    if log.clock_out:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sudah melakukan clock out hari ini."
        )
        
    log.clock_out = datetime.now()
    db.commit()
    db.refresh(log)
    return log
