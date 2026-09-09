import os
import sys

# Ensure the app module can be found
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.session import SessionLocal
from app.modules.auth.repository import AuthRepository
from app.modules.auth.service import AuthService
from app.modules.auth.schemas import UserCreate
from app.core.exceptions import ConflictException

def main():
    db = SessionLocal()
    try:
        repo = AuthRepository(db)
        service = AuthService(repo)
        
        user_data = UserCreate(
            email="admin@fashionstore.com",
            password="adminpassword123",
            first_name="Admin",
            last_name="User",
            phone="123456789"
        )
        
        try:
            # Register with default role ADMIN
            user = service.register_user(user_data, default_role_name="ADMIN")
            print(f"Admin user created successfully! Email: {user.email}")
        except ConflictException:
            print("Admin user already exists. Email: admin@fashionstore.com, Password: adminpassword123")
            
    finally:
        db.close()

if __name__ == "__main__":
    main()
