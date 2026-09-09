import uuid
from typing import Any, Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.database.session import get_db
from app.modules.auth.models import User
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schemas import (
    LoginRequest,
    RoleAssignPermissions,
    RoleResponse,
    PermissionResponse,
    Token,
    UserAdminCreate,
    UserAdminUpdate,
    UserCreate,
    UserPaginatedResponse,
    UserPasswordChange,
    UserResponse,
    UserStatusUpdate,
    UserUpdate,
)
from app.modules.auth.service import AuthService

router = APIRouter()


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    repository = AuthRepository(db)
    return AuthService(repository)


# -------------------------------------------------------------
# 1. PUBLIC AUTHENTICATION & REGISTRATION
# -------------------------------------------------------------

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new customer",
    description="Registers a new user account with default CUSTOMER role and returns the user details.",
)
def register(
    user_in: UserCreate,
    auth_service: AuthService = Depends(get_auth_service),
) -> Any:
    return auth_service.register_user(user_in)


@router.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="Authenticate and get access token",
    description="Authenticates with email and password and returns a signed JWT bearer token.",
)
def login(
    login_data: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> Any:
    return auth_service.authenticate_user(login_data)


# -------------------------------------------------------------
# 2. CURRENT USER PROFILE (/ME)
# -------------------------------------------------------------

@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
    description="Retrieves the profile information for the authenticated user.",
)
def get_me(
    current_user: User = Depends(get_current_user),
) -> Any:
    return current_user


@router.put(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update current user profile",
    description="Updates first name, last name or phone of current authenticated user.",
)
def update_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
) -> Any:
    return auth_service.update_profile(current_user, user_update)


@router.put(
    "/me/password",
    status_code=status.HTTP_200_OK,
    summary="Change current user password",
    description="Changes password verifying current password first.",
)
def change_my_password(
    password_data: UserPasswordChange,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
) -> dict[str, str]:
    auth_service.change_password(current_user, password_data)
    return {"message": "Password changed successfully"}


# -------------------------------------------------------------
# 3. ADMINISTRATIVE USER MANAGEMENT (ADMIN ONLY)
# -------------------------------------------------------------

@router.get(
    "/users",
    response_model=UserPaginatedResponse,
    status_code=status.HTTP_200_OK,
    summary="List users (Admin only)",
    description="Paginated list of all users with search and filter capabilities.",
)
def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    role: Optional[str] = Query(None, description="Filter by role name (e.g. CUSTOMER, CASHIER)"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    current_user: User = Depends(require_role("ADMIN")),
    auth_service: AuthService = Depends(get_auth_service),
) -> Any:
    return auth_service.list_users(
        page=page,
        size=size,
        role_name=role,
        is_active=is_active,
        search=search,
    )


@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create user / employee (Admin only)",
    description="Creates a new user account with any chosen role (ADMIN, BRANCH_MANAGER, CASHIER, SUPPLIER).",
)
def create_user_by_admin(
    user_in: UserAdminCreate,
    current_user: User = Depends(require_role("ADMIN")),
    auth_service: AuthService = Depends(get_auth_service),
) -> Any:
    return auth_service.create_user_by_admin(user_in)


@router.get(
    "/users/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user detail (Admin only)",
    description="Get full user profile by ID.",
)
def get_user_detail(
    user_id: uuid.UUID,
    current_user: User = Depends(require_role("ADMIN")),
    auth_service: AuthService = Depends(get_auth_service),
) -> Any:
    return auth_service.get_user_detail(user_id)


@router.put(
    "/users/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update user by Admin",
    description="Update user data, active status or assign a new role.",
)
def update_user_by_admin(
    user_id: uuid.UUID,
    user_update: UserAdminUpdate,
    current_user: User = Depends(require_role("ADMIN")),
    auth_service: AuthService = Depends(get_auth_service),
) -> Any:
    return auth_service.update_user_by_admin(user_id, user_update)


@router.patch(
    "/users/{user_id}/status",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Activate / Deactivate user (Admin only)",
    description="Enable or disable a user account (soft delete / lock).",
)
def set_user_status(
    user_id: uuid.UUID,
    status_update: UserStatusUpdate,
    current_user: User = Depends(require_role("ADMIN")),
    auth_service: AuthService = Depends(get_auth_service),
) -> Any:
    return auth_service.set_user_status(user_id, status_update.is_active)


# -------------------------------------------------------------
# 4. ROLES & PERMISSIONS MANAGEMENT (ADMIN ONLY)
# -------------------------------------------------------------

@router.get(
    "/roles",
    response_model=List[RoleResponse],
    status_code=status.HTTP_200_OK,
    summary="List all roles",
    description="Get list of all predefined system roles.",
)
def list_roles(
    current_user: User = Depends(require_role("ADMIN")),
    auth_service: AuthService = Depends(get_auth_service),
) -> Any:
    return auth_service.list_roles()


@router.get(
    "/permissions",
    response_model=List[PermissionResponse],
    status_code=status.HTTP_200_OK,
    summary="List all permissions",
    description="Get list of all granular system permissions.",
)
def list_permissions(
    current_user: User = Depends(require_role("ADMIN")),
    auth_service: AuthService = Depends(get_auth_service),
) -> Any:
    return auth_service.list_permissions()


@router.put(
    "/roles/{role_id}/permissions",
    response_model=RoleResponse,
    status_code=status.HTTP_200_OK,
    summary="Assign permissions to role",
    description="Assign a list of permissions to a specific role.",
)
def assign_role_permissions(
    role_id: uuid.UUID,
    data: RoleAssignPermissions,
    current_user: User = Depends(require_role("ADMIN")),
    auth_service: AuthService = Depends(get_auth_service),
) -> Any:
    return auth_service.assign_permissions_to_role(role_id, data.permission_ids)


# -------------------------------------------------------------
# 5. HEALTH / RBAC VERIFICATION CHECK
# -------------------------------------------------------------

@router.get(
    "/admin-only",
    status_code=status.HTTP_200_OK,
    summary="Admin only check",
    description="Protected endpoint for testing role-based access control.",
)
def admin_only_check(
    current_user: User = Depends(require_role("ADMIN")),
) -> dict[str, str]:
    return {
        "message": f"Welcome Admin {current_user.first_name}! Authorization verified successfully."
    }
