import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import (
    NotificationListResponse, NotificationMarkReadRequest
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationListResponse)
def get_notifications(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of notifications for the current user."""
    query = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(
        Notification.created_at.desc()
    )
    
    total = query.count()
    unread_count = query.filter(Notification.read == False).count()
    
    notifications = query.offset(skip).limit(limit).all()
    
    return NotificationListResponse(
        items=notifications,
        total=total,
        unread_count=unread_count
    )


@router.post("/read", status_code=status.HTTP_200_OK)
def mark_as_read(
    request: NotificationMarkReadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark specific notifications as read."""
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.id.in_(request.notification_ids)
    ).all()
    
    for n in notifications:
        n.read = True
        
    db.commit()
    return {"status": "success", "marked_count": len(notifications)}


@router.get("/stream")
async def notification_stream(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """SSE Endpoint for real-time notifications."""
    async def event_generator():
        # In a real app, you'd use Redis Pub/Sub or similar here.
        # This is a simple polling fallback for demo.
        last_id = 0
        while True:
            # Re-fetch new notifications for this user using a new session inside the loop or async db.
            # But standard sqlalchemy Session is synchronous. 
            # A simple keep-alive ping for now:
            ping_data = {"type": "ping", "message": "keep-alive"}
            yield f"data: {json.dumps(ping_data)}\n\n"
            await asyncio.sleep(15)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
