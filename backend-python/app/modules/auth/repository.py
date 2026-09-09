import uuid
from typing import Optional, List, Tuple
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, selectinload

from app.modules.auth.models import Permission, Role, User


class AuthRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_user_by_email(self, email: str) -> Optional[User]:
        """Find a user by email, eager loading the associated role and permissions."""
        stmt = (
            select(User)
            .options(
                selectinload(User.role).selectinload(Role.permissions)
            )
            .where(User.email == email)
        )
        return self.db.scalars(stmt).first()

    def find_user_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        """Find a user by ID, eager loading the associated role and permissions."""
        stmt = (
            select(User)
            .options(
                selectinload(User.role).selectinload(Role.permissions)
            )
            .where(User.id == user_id)
        )
        return self.db.scalars(stmt).first()

    def find_users_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        role_name: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[User], int]:
        """List users with pagination, filters and eager loaded roles."""
        query = select(User).join(User.role).options(
            selectinload(User.role).selectinload(Role.permissions)
        )
        count_query = select(func.count(User.id)).join(User.role)

        if role_name:
            query = query.where(Role.name == role_name.upper())
            count_query = count_query.where(Role.name == role_name.upper())

        if is_active is not None:
            query = query.where(User.is_active == is_active)
            count_query = count_query.where(User.is_active == is_active)

        if search:
            search_term = f"%{search}%"
            filter_search = or_(
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term),
                User.email.ilike(search_term),
            )
            query = query.where(filter_search)
            count_query = count_query.where(filter_search)

        total = self.db.scalar(count_query) or 0
        items = self.db.scalars(query.order_by(User.created_at.desc()).offset(skip).limit(limit)).all()
        return list(items), total

    def get_role_by_name(self, role_name: str) -> Optional[Role]:
        """Find a role by its unique name with its permissions."""
        stmt = select(Role).options(selectinload(Role.permissions)).where(Role.name == role_name)
        return self.db.scalars(stmt).first()

    def get_role_by_id(self, role_id: uuid.UUID) -> Optional[Role]:
        """Find a role by ID with its permissions."""
        stmt = select(Role).options(selectinload(Role.permissions)).where(Role.id == role_id)
        return self.db.scalars(stmt).first()

    def get_all_roles(self) -> List[Role]:
        """Get all roles in the system."""
        stmt = select(Role).options(selectinload(Role.permissions)).order_by(Role.name)
        return list(self.db.scalars(stmt).all())

    def get_all_permissions(self) -> List[Permission]:
        """Get all system permissions."""
        stmt = select(Permission).order_by(Permission.resource, Permission.action)
        return list(self.db.scalars(stmt).all())

    def get_permissions_by_ids(self, permission_ids: List[uuid.UUID]) -> List[Permission]:
        """Get permissions by a list of UUIDs."""
        stmt = select(Permission).where(Permission.id.in_(permission_ids))
        return list(self.db.scalars(stmt).all())

    def create_user(self, user: User) -> User:
        """Persist a new user entity to the database."""
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return self.find_user_by_id(user.id) or user

    def update_user(self, user: User) -> User:
        """Update and persist an existing user entity."""
        self.db.commit()
        self.db.refresh(user)
        return self.find_user_by_id(user.id) or user

    def update_role_permissions(self, role: Role, permissions: List[Permission]) -> Role:
        """Assign permissions to a role."""
        role.permissions = permissions
        self.db.commit()
        self.db.refresh(role)
        return role
