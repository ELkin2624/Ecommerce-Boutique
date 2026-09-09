import uuid
from typing import Callable, Optional
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import decode_access_token
from app.database.session import get_db
from app.modules.auth.models import User
from app.modules.auth.repository import AuthRepository

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False,
)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Validate Bearer token and retrieve the active authenticated User entity."""
    if not token:
        raise UnauthorizedException(detail="Not authenticated")

    payload = decode_access_token(token)
    if not payload:
        raise UnauthorizedException(detail="Invalid or expired token")

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedException(detail="Token payload missing subject")

    try:
        user_id = uuid.UUID(user_id_str)
    except (ValueError, TypeError):
        raise UnauthorizedException(detail="Invalid user identifier in token")

    repository = AuthRepository(db)
    user = repository.find_user_by_id(user_id)
    if not user:
        raise UnauthorizedException(detail="User not found")

    if not user.is_active:
        raise UnauthorizedException(detail="User account is inactive")

    return user


def require_role(*allowed_roles: str) -> Callable[[User], User]:
    """Factory for FastAPI dependency to restrict endpoint access by role(s)."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.name not in allowed_roles:
            raise ForbiddenException(
                detail=f"User with role '{current_user.role.name}' is not authorized to access this resource"
            )
        return current_user

    return role_checker


def require_permission(*required_permissions: str) -> Callable[[User], User]:
    """Factory for FastAPI dependency to restrict endpoint access by granular permissions."""
    def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.name == "ADMIN":
            return current_user
        for perm in required_permissions:
            if not current_user.has_permission(perm):
                raise ForbiddenException(
                    detail=f"User is missing required permission: '{perm}'"
                )
        return current_user

    return permission_checker
