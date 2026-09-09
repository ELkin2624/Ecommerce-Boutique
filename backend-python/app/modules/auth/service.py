import math
import uuid
from typing import Optional, List
from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    NotFoundException,
    UnauthorizedException,
)
from app.core.security import create_access_token, hash_password, verify_password
from app.modules.auth.models import User, Role, Permission
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schemas import (
    LoginRequest,
    Token,
    UserCreate,
    UserAdminCreate,
    UserUpdate,
    UserAdminUpdate,
    UserPasswordChange,
    UserPaginatedResponse,
)


class AuthService:
    def __init__(self, repository: AuthRepository):
        self.repository = repository

    def register_user(self, data: UserCreate, default_role_name: str = "CUSTOMER") -> User:
        """Register a new customer with hashed password and default CUSTOMER role."""
        email_normalized = data.email.lower().strip()
        existing_user = self.repository.find_user_by_email(email_normalized)
        if existing_user:
            raise ConflictException(detail="Email is already registered")

        role = self.repository.get_role_by_name(default_role_name)
        if not role:
            raise NotFoundException(detail=f"Default role '{default_role_name}' not found in system")

        password_hash = hash_password(data.password)
        new_user = User(
            email=email_normalized,
            password_hash=password_hash,
            first_name=data.first_name.strip(),
            last_name=data.last_name.strip(),
            phone=data.phone.strip() if data.phone else None,
            role_id=role.id,
            is_active=True,
        )

        return self.repository.create_user(new_user)

    def create_user_by_admin(self, data: UserAdminCreate) -> User:
        """Admin creates a user with any specific system role (e.g. BRANCH_MANAGER, CASHIER, SUPPLIER)."""
        email_normalized = data.email.lower().strip()
        existing_user = self.repository.find_user_by_email(email_normalized)
        if existing_user:
            raise ConflictException(detail="Email is already registered")

        role = self.repository.get_role_by_id(data.role_id)
        if not role:
            raise NotFoundException(detail="Specified role not found")

        password_hash = hash_password(data.password)
        new_user = User(
            email=email_normalized,
            password_hash=password_hash,
            first_name=data.first_name.strip(),
            last_name=data.last_name.strip(),
            phone=data.phone.strip() if data.phone else None,
            role_id=role.id,
            is_active=data.is_active,
        )

        return self.repository.create_user(new_user)

    def authenticate_user(self, data: LoginRequest) -> Token:
        """Authenticate user credentials and return a signed JWT token."""
        email_normalized = data.email.lower().strip()
        user = self.repository.find_user_by_email(email_normalized)
        if not user or not verify_password(data.password, user.password_hash):
            raise UnauthorizedException(detail="Invalid email or password")

        if not user.is_active:
            raise UnauthorizedException(detail="User account is inactive")

        token_data = {
            "sub": str(user.id),
            "role": user.role.name,
        }
        access_token = create_access_token(data=token_data)

        return Token(access_token=access_token, token_type="bearer")

    def update_profile(self, user: User, data: UserUpdate) -> User:
        """Customer/User updates their own personal information."""
        if data.first_name is not None:
            user.first_name = data.first_name.strip()
        if data.last_name is not None:
            user.last_name = data.last_name.strip()
        if data.phone is not None:
            user.phone = data.phone.strip() if data.phone else None

        return self.repository.update_user(user)

    def change_password(self, user: User, data: UserPasswordChange) -> None:
        """User changes their own password, requiring current password verification."""
        if not verify_password(data.current_password, user.password_hash):
            raise BadRequestException(detail="Current password does not match")

        user.password_hash = hash_password(data.new_password)
        self.repository.update_user(user)

    def list_users(
        self,
        page: int = 1,
        size: int = 20,
        role_name: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> UserPaginatedResponse:
        """List users with pagination, filters and search."""
        if page < 1:
            page = 1
        if size < 1:
            size = 20
        if size > 100:
            size = 100

        skip = (page - 1) * size
        items, total = self.repository.find_users_paginated(
            skip=skip,
            limit=size,
            role_name=role_name,
            is_active=is_active,
            search=search,
        )
        pages = math.ceil(total / size) if total > 0 else 1

        return UserPaginatedResponse(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=pages,
        )

    def get_user_detail(self, user_id: uuid.UUID) -> User:
        """Get detail of a specific user."""
        user = self.repository.find_user_by_id(user_id)
        if not user:
            raise NotFoundException(detail="User not found")
        return user

    def update_user_by_admin(self, user_id: uuid.UUID, data: UserAdminUpdate) -> User:
        """Admin updates user profile, role or active state."""
        user = self.repository.find_user_by_id(user_id)
        if not user:
            raise NotFoundException(detail="User not found")

        if data.first_name is not None:
            user.first_name = data.first_name.strip()
        if data.last_name is not None:
            user.last_name = data.last_name.strip()
        if data.phone is not None:
            user.phone = data.phone.strip() if data.phone else None
        if data.is_active is not None:
            user.is_active = data.is_active

        if data.role_id is not None:
            role = self.repository.get_role_by_id(data.role_id)
            if not role:
                raise NotFoundException(detail="Specified role not found")
            user.role_id = role.id

        return self.repository.update_user(user)

    def set_user_status(self, user_id: uuid.UUID, is_active: bool) -> User:
        """Admin activates or deactivates (soft delete / lock) an account."""
        user = self.repository.find_user_by_id(user_id)
        if not user:
            raise NotFoundException(detail="User not found")
        user.is_active = is_active
        return self.repository.update_user(user)

    def list_roles(self) -> List[Role]:
        """List all system roles with assigned permissions."""
        return self.repository.get_all_roles()

    def list_permissions(self) -> List[Permission]:
        """List all system permissions."""
        return self.repository.get_all_permissions()

    def assign_permissions_to_role(self, role_id: uuid.UUID, permission_ids: List[uuid.UUID]) -> Role:
        """Assign permissions to a role."""
        role = self.repository.get_role_by_id(role_id)
        if not role:
            raise NotFoundException(detail="Role not found")
        permissions = self.repository.get_permissions_by_ids(permission_ids)
        return self.repository.update_role_permissions(role, permissions)
