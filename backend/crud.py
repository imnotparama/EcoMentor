from sqlalchemy.orm import Session
from models.db_models import Assessment

def get_latest_completed_assessment(db: Session, user_id: int):
    """Get the latest completed assessment for a user."""
    return db.query(Assessment).filter(
        Assessment.user_id == user_id,
        Assessment.is_complete == True  # noqa: E712
    ).order_by(Assessment.created_at.desc()).first()


def get_completed_assessments_count(db: Session, user_id: int):
    """Get the count of completed assessments for a user."""
    return db.query(Assessment).filter(
        Assessment.user_id == user_id,
        Assessment.is_complete
    ).count()