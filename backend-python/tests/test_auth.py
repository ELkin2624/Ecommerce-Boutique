from datetime import timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.modules.auth.models import Role, User


# ==========================================
# 1. REGISTRATION TESTS
# ==========================================

def test_register_success(client: TestClient):
    """Test successful customer registration."""
    payload = {
        "email": "laura.fashion@example.com",
        "password": "SecurePassword123!",
        "first_name": "Laura",
        "last_name": "Gomez",
        "phone": "+59170012345",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "laura.fashion@example.com"
    assert data["first_name"] == "Laura"
    assert data["last_name"] == "Gomez"
    assert data["phone"] == "+59170012345"
    assert data["role"]["name"] == "CUSTOMER"
    assert data["is_active"] is True
    assert "id" in data
    assert "password" not in data
    assert "password_hash" not in data


def test_register_duplicate_email(client: TestClient):
    """Test registering with an existing email returns 409 Conflict."""
    payload = {
        "email": "duplicate@example.com",
        "password": "Password123!",
        "first_name": "Maria",
        "last_name": "Perez",
    }
    # First registration
    response1 = client.post("/api/v1/auth/register", json=payload)
    assert response1.status_code == 201

    # Second registration with same email
    response2 = client.post("/api/v1/auth/register", json=payload)
    assert response2.status_code == 409
    assert "already registered" in response2.json()["detail"].lower()


def test_register_invalid_data(client: TestClient):
    """Test validation errors for bad email or short password."""
    # Invalid email
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "not-an-email",
            "password": "ValidPassword123!",
            "first_name": "Test",
            "last_name": "User",
        },
    )
    assert response.status_code == 422

    # Short password (< 6 chars)
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "valid@example.com",
            "password": "123",
            "first_name": "Test",
            "last_name": "User",
        },
    )
    assert response.status_code == 422


# ==========================================
# 2. LOGIN TESTS
# ==========================================

def test_login_success(client: TestClient):
    """Test successful login with valid credentials."""
    # Register user first
    register_payload = {
        "email": "login.test@example.com",
        "password": "MySecretPassword123!",
        "first_name": "Carlos",
        "last_name": "Santana",
    }
    client.post("/api/v1/auth/register", json=register_payload)

    # Login
    login_payload = {
        "email": "login.test@example.com",
        "password": "MySecretPassword123!",
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 20


def test_login_wrong_password(client: TestClient):
    """Test login fails with incorrect password."""
    register_payload = {
        "email": "wrong.pass@example.com",
        "password": "CorrectPassword123!",
        "first_name": "Ana",
        "last_name": "Rios",
    }
    client.post("/api/v1/auth/register", json=register_payload)

    login_payload = {
        "email": "wrong.pass@example.com",
        "password": "IncorrectPassword999!",
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 401
    assert "invalid email or password" in response.json()["detail"].lower()


def test_login_nonexistent_user(client: TestClient):
    """Test login fails for non-existent user."""
    login_payload = {
        "email": "does.not.exist@example.com",
        "password": "RandomPassword123!",
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 401
    assert "invalid email or password" in response.json()["detail"].lower()


def test_login_inactive_user(client: TestClient, db_session: Session):
    """Test login fails when user account is deactivated."""
    # Register user
    email = "inactive.user@example.com"
    register_payload = {
        "email": email,
        "password": "Password123!",
        "first_name": "Inactive",
        "last_name": "User",
    }
    client.post("/api/v1/auth/register", json=register_payload)

    # Deactivate in database
    user = db_session.query(User).filter(User.email == email).first()
    assert user is not None
    user.is_active = False
    db_session.commit()

    # Attempt login
    login_payload = {
        "email": email,
        "password": "Password123!",
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 401
    assert "inactive" in response.json()["detail"].lower()


# ==========================================
# 3. JWT & /ME ENDPOINT TESTS
# ==========================================

def test_me_authenticated(client: TestClient):
    """Test /me returns profile when valid Bearer token is provided."""
    register_payload = {
        "email": "profile.me@example.com",
        "password": "Password123!",
        "first_name": "Sofia",
        "last_name": "Lopez",
    }
    client.post("/api/v1/auth/register", json=register_payload)

    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "profile.me@example.com", "password": "Password123!"},
    )
    token = login_res.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "profile.me@example.com"
    assert data["first_name"] == "Sofia"
    assert data["role"]["name"] == "CUSTOMER"


def test_me_without_token(client: TestClient):
    """Test /me fails with 401 when no token is provided."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_me_invalid_token(client: TestClient):
    """Test /me fails with 401 when invalid token is provided."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer completely.invalid.jwt.token"},
    )
    assert response.status_code == 401


def test_me_expired_token(client: TestClient, db_session: Session):
    """Test /me fails with 401 when token has expired."""
    role = db_session.query(Role).filter(Role.name == "CUSTOMER").first()
    user = User(
        email="expired@example.com",
        password_hash=hash_password("Password123!"),
        first_name="Expired",
        last_name="User",
        role_id=role.id,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Create expired token
    expired_token = create_access_token(
        data={"sub": str(user.id), "role": role.name},
        expires_delta=timedelta(seconds=-10),
    )

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == 401


# ==========================================
# 4. ROLE AUTHORIZATION TESTS
# ==========================================

def test_role_authorization_allowed(client: TestClient, db_session: Session):
    """Test user with ADMIN role can access admin protected endpoint."""
    admin_role = db_session.query(Role).filter(Role.name == "ADMIN").first()
    admin_user = User(
        email="admin.boss@example.com",
        password_hash=hash_password("AdminPass123!"),
        first_name="Super",
        last_name="Admin",
        role_id=admin_role.id,
    )
    db_session.add(admin_user)
    db_session.commit()
    db_session.refresh(admin_user)

    token = create_access_token(
        data={"sub": str(admin_user.id), "role": admin_role.name}
    )

    response = client.get(
        "/api/v1/auth/admin-only",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert "Welcome Admin Super" in response.json()["message"]


def test_role_authorization_forbidden(client: TestClient):
    """Test standard CUSTOMER user gets 403 Forbidden on admin endpoint."""
    # Register standard customer
    register_payload = {
        "email": "regular.user@example.com",
        "password": "Password123!",
        "first_name": "Regular",
        "last_name": "Customer",
    }
    client.post("/api/v1/auth/register", json=register_payload)

    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "regular.user@example.com", "password": "Password123!"},
    )
    token = login_res.json()["access_token"]

    response = client.get(
        "/api/v1/auth/admin-only",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
    assert "not authorized" in response.json()["detail"].lower()


# ==========================================
# 5. USER MANAGEMENT & RBAC EXPANDED TESTS
# ==========================================

def test_admin_list_users(client: TestClient, db_session: Session):
    """Test admin listing all users."""
    admin_role = db_session.query(Role).filter(Role.name == "ADMIN").first()
    admin_user = User(
        email="admin.lister@example.com",
        password_hash=hash_password("AdminPass123!"),
        first_name="Lister",
        last_name="Admin",
        role_id=admin_role.id,
    )
    db_session.add(admin_user)
    db_session.commit()
    db_session.refresh(admin_user)

    token = create_access_token(
        data={"sub": str(admin_user.id), "role": admin_role.name}
    )

    response = client.get(
        "/api/v1/auth/users",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1


def test_admin_create_employee(client: TestClient, db_session: Session):
    """Test admin creating a Cashier or Branch Manager user."""
    admin_role = db_session.query(Role).filter(Role.name == "ADMIN").first()
    cashier_role = db_session.query(Role).filter(Role.name == "CASHIER").first()
    admin_user = User(
        email="admin.creator@example.com",
        password_hash=hash_password("AdminPass123!"),
        first_name="Creator",
        last_name="Admin",
        role_id=admin_role.id,
    )
    db_session.add(admin_user)
    db_session.commit()
    db_session.refresh(admin_user)

    token = create_access_token(
        data={"sub": str(admin_user.id), "role": admin_role.name}
    )

    create_payload = {
        "email": "new.cashier@example.com",
        "password": "CashierPassword123!",
        "first_name": "Juan",
        "last_name": "Cajero",
        "phone": "+59178899001",
        "role_id": str(cashier_role.id),
        "is_active": True,
    }

    response = client.post(
        "/api/v1/auth/users",
        json=create_payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new.cashier@example.com"
    assert data["role"]["name"] == "CASHIER"


def test_update_profile_and_password(client: TestClient):
    """Test customer updating profile and changing password."""
    register_payload = {
        "email": "updatable.user@example.com",
        "password": "OldPassword123!",
        "first_name": "Pedro",
        "last_name": "Gomez",
    }
    client.post("/api/v1/auth/register", json=register_payload)

    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "updatable.user@example.com", "password": "OldPassword123!"},
    )
    token = login_res.json()["access_token"]

    # Update profile
    update_res = client.put(
        "/api/v1/auth/me",
        json={"first_name": "Pedro Antonio", "last_name": "Gomez Perez", "phone": "+59171122334"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["first_name"] == "Pedro Antonio"

    # Change password
    pwd_res = client.put(
        "/api/v1/auth/me/password",
        json={"current_password": "OldPassword123!", "new_password": "NewSecretPassword456!"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert pwd_res.status_code == 200

    # Login with new password
    new_login = client.post(
        "/api/v1/auth/login",
        json={"email": "updatable.user@example.com", "password": "NewSecretPassword456!"},
    )
    assert new_login.status_code == 200
