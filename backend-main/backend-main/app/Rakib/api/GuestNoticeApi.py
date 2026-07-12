"""Public (guest) notice board API.

Serves only all-batch notices (batch IS NULL) so batch-restricted notices
never leak to unauthenticated visitors. Supports search, category filter
(the notice_from enum doubles as category) and offset/limit pagination.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.Rakib.model.notice import Notice
from app.Rakib.schema.adminNoticeSchema import NoticeOut

router = APIRouter(prefix="/guest/notices", tags=["Public Notices"])

CATEGORIES = ("Chairman", "Admin", "Student-Club", "Department", "Central")


@router.get("")
def list_public_notices(
    search: Optional[str] = Query(None, max_length=200),
    category: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Notice).filter(Notice.batch == None)  # noqa: E711 — SQLA needs == None

    if category:
        if category not in CATEGORIES:
            raise HTTPException(status_code=400, detail="Unknown category")
        query = query.filter(Notice.notice_from == category)

    if search:
        like = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Notice.title.ilike(like),
                Notice.sub_title.ilike(like),
                Notice.content.ilike(like),
            )
        )

    total = query.count()
    notices = (
        query.order_by(Notice.is_pinned.desc(), Notice.date.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return {
        "total": total,
        "items": [NoticeOut.model_validate(n, from_attributes=True) for n in notices],
    }


@router.get("/{notice_id}", response_model=NoticeOut)
def get_public_notice(notice_id: int, db: Session = Depends(get_db)):
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    # Hide batch-restricted notices from the public detail view too
    if not notice or notice.batch is not None:
        raise HTTPException(status_code=404, detail="Notice not found")
    return notice
