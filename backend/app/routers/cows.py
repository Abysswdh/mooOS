from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.cow import Cow
from app.models.user import User
from app.schemas.cow import CowCreate, CowUpdate, CowResponse, CowListResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/cows", tags=["Cows"])


@router.get("", response_model=CowListResponse)
def list_cows(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all cows with pagination."""
    query = db.query(Cow)
    
    # If not admin, maybe filter by owner_id if required?
    # Based on the plan, just return all cows for now, or filter if the frontend needs it.
    
    total = query.count()
    cows = query.offset(skip).limit(limit).all()
    
    return CowListResponse(items=cows, total=total)


@router.post("", response_model=CowResponse, status_code=status.HTTP_201_CREATED)
def create_cow(
    cow_in: CowCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new cow."""
    existing_cow = db.query(Cow).filter(Cow.code == cow_in.code).first()
    if existing_cow:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kode sapi sudah terdaftar."
        )
    
    new_cow = Cow(**cow_in.model_dump())
    db.add(new_cow)
    db.commit()
    db.refresh(new_cow)
    return new_cow


@router.get("/{cow_id}", response_model=CowResponse)
def get_cow(
    cow_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific cow by ID."""
    cow = db.query(Cow).filter(Cow.id == cow_id).first()
    if not cow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sapi tidak ditemukan")
    return cow


@router.put("/{cow_id}", response_model=CowResponse)
def update_cow(
    cow_id: int, 
    cow_in: CowUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a specific cow."""
    cow = db.query(Cow).filter(Cow.id == cow_id).first()
    if not cow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sapi tidak ditemukan")
    
    update_data = cow_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(cow, field, value)
    
    db.commit()
    db.refresh(cow)
    return cow


@router.delete("/{cow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cow(
    cow_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a specific cow."""
    cow = db.query(Cow).filter(Cow.id == cow_id).first()
    if not cow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sapi tidak ditemukan")
    
    db.delete(cow)
    db.commit()
    return None
