import pytest
from crud import get_latest_completed_assessment, get_completed_assessments_count
from models.db_models import Assessment, User

def test_get_latest_completed_assessment(db):
    test_user = User(email="crud@example.com", name="CRUD User", hashed_password="pw")
    db.add(test_user)
    db.commit()
    db.refresh(test_user)

    # Create some assessments
    # 1. Incomplete
    incomplete = Assessment(user_id=test_user.id, is_complete=False)
    db.add(incomplete)
    
    # 2. Complete, older
    import datetime
    complete_older = Assessment(user_id=test_user.id, is_complete=True, created_at=datetime.datetime.utcnow() - datetime.timedelta(days=1))
    db.add(complete_older)
    db.commit()
    db.refresh(complete_older)
    
    # 3. Complete, newer
    complete_newer = Assessment(user_id=test_user.id, is_complete=True, created_at=datetime.datetime.utcnow())
    db.add(complete_newer)
    db.commit()
    db.refresh(complete_newer)

    # Test get_latest_completed_assessment
    result = get_latest_completed_assessment(db, test_user.id)
    assert result is not None
    assert result.id == complete_newer.id

def test_get_completed_assessments_count(db):
    test_user = User(email="crud2@example.com", name="CRUD User 2", hashed_password="pw")
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    
    complete1 = Assessment(user_id=test_user.id, is_complete=True)
    complete2 = Assessment(user_id=test_user.id, is_complete=True)
    incomplete = Assessment(user_id=test_user.id, is_complete=False)
    db.add_all([complete1, complete2, incomplete])
    db.commit()

    count = get_completed_assessments_count(db, test_user.id)
    assert count == 2

