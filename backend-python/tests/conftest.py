import os
import sys
import pytest
from collections.abc import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.database.base import Base
from app.database.seed import seed_catalog, seed_inventory, seed_roles
from app.database.session import get_db
import app.modules.auth.models  # noqa: F401
import app.modules.catalog.models  # noqa: F401
import app.modules.inventory.models  # noqa: F401
from app.main import app

# Create engine for testing
test_engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Ensure tables and seed data exist before running tests."""
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        seed_roles(db)
        seed_catalog(db)
        seed_inventory(db)
    finally:
        db.close()
    yield


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """Provide a transactional database session that rolls back after each test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(
        bind=connection,
        join_transaction_mode="create_savepoint",
    )

    # Seed in this isolated transaction if needed
    seed_roles(session)
    seed_catalog(session)
    seed_inventory(session)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """Provide a FastAPI TestClient with database session dependency overridden."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
