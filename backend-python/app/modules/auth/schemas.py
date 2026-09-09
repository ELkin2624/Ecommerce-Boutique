import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# --- Permission Schemas ---
class PermissionBase(BaseModel):
    name: str = Field(..., description="Unique permission code (e.g. products:create)")
    resource: str = Field(default="general", description="Resource name")
    action: str = Field(default="read", description="Action on resource")
    description: Optional[str] = None


class PermissionResponse(PermissionBase):
    id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)


# --- Role Schemas ---
class RoleBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    description: Optional[str] = None


class RoleResponse(RoleBase):
    id: uuid.UUID
    permissions: List[PermissionResponse] = []

    model_config = ConfigDict(from_attributes=True)


class RoleAssignPermissions(BaseModel):
    permission_ids: List[uuid.UUID] = Field(..., min_length=1)


# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=30)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)


class UserAdminCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)
    role_id: uuid.UUID
    is_active: bool = True


class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=30)


class UserAdminUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=30)
    role_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None


class UserPasswordChange(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6, max_length=100)


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserResponse(UserBase):
    id: uuid.UUID
    is_active: bool
    role: RoleResponse
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserPaginatedResponse(BaseModel):
    items: List[UserResponse]
    total: int
    page: int
    size: int
    pages: int


# --- Authentication Schemas ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    role: str
    exp: int
