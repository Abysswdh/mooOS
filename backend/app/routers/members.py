from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.member import Member
from app.models.user import User
from app.schemas.member import MemberCreate, MemberUpdate, MemberResponse, MemberListResponse
from app.dependencies import get_current_user
from app.services.member_mrp import MemberMRP

router = APIRouter(prefix="/members", tags=["Members"])


@router.get("", response_model=MemberListResponse)
def list_members(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all members with pagination."""
    # Run MRP to update simpanan_wajib live
    MemberMRP.calculate_simpanan_wajib(db)
    db.commit()
    
    query = db.query(Member)
    
    total = query.count()
    members = query.offset(skip).limit(limit).all()
    
    return MemberListResponse(items=members, total=total)


@router.post("", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
def create_member(
    member_in: MemberCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new member."""
    existing_member = db.query(Member).filter(Member.nik == member_in.nik).first()
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="NIK sudah terdaftar."
        )
    
    new_member = Member(**member_in.model_dump())
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member


@router.get("/{member_id}", response_model=MemberResponse)
def get_member(
    member_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific member by ID."""
    # Run MRP to update simpanan_wajib live
    MemberMRP.calculate_simpanan_wajib(db)
    db.commit()
    
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anggota tidak ditemukan")
    return member


@router.put("/{member_id}", response_model=MemberResponse)
def update_member(
    member_id: int, 
    member_in: MemberUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a specific member."""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anggota tidak ditemukan")
    
    update_data = member_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(member, field, value)
    
    db.commit()
    db.refresh(member)
    return member


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member(
    member_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a specific member."""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anggota tidak ditemukan")
    
    db.delete(member)
    db.commit()
    return None
