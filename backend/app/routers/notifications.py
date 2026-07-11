import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import (
    NotificationListResponse, NotificationMarkReadRequest, NotificationSendRequest, NotificationResponse
)
from app.dependencies import get_current_user

# Global registry of active SSE clients
# Map of user_id -> list of asyncio.Queue
active_clients: dict[int, list[asyncio.Queue]] = {}

def publish_event(user_id: int, event_data: dict):
    if user_id in active_clients:
        for q in active_clients[user_id]:
            q.put_nowait(event_data)

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


@router.post("/send", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def send_notification(
    request: NotificationSendRequest,
    db: Session = Depends(get_db)
    # Could restrict this to internal microservices or admin only, but no restriction for demo
):
    """Internal API to send a notification and broadcast via SSE."""
    notification = Notification(
        user_id=request.user_id,
        type=request.type,
        title=request.title,
        message=request.message,
        read=False
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    # Broadcast to SSE
    event_data = {
        "type": "notification",
        "data": {
            "id": notification.id,
            "type": notification.type,
            "title": notification.title,
            "message": notification.message,
            "created_at": notification.created_at.isoformat()
        }
    }
    publish_event(request.user_id, event_data)
    
    return notification


@router.get("/stream")
async def notification_stream(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """SSE Endpoint for real-time notifications."""
    async def event_generator():
        q = asyncio.Queue()
        user_id = current_user.id
        
        if user_id not in active_clients:
            active_clients[user_id] = []
        active_clients[user_id].append(q)
        
        try:
            # Send initial keep-alive immediately
            yield f"data: {json.dumps({'type': 'ping', 'message': 'connected'})}\n\n"
            
            while True:
                try:
                    # Wait for an event, timeout to send keep-alive every 15s
                    event = await asyncio.wait_for(q.get(), timeout=15.0)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    yield f"data: {json.dumps({'type': 'ping', 'message': 'keep-alive'})}\n\n"
        finally:
            if user_id in active_clients:
                active_clients[user_id].remove(q)
                if not active_clients[user_id]:
                    del active_clients[user_id]

    return StreamingResponse(event_generator(), media_type="text/event-stream")
