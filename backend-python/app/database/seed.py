import sys
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.modules.auth.models import Permission, Role
from app.modules.catalog.models import (
    Category,
    Collection,
    Color,
    Season,
    Size,
    Supplier,
)
from app.modules.inventory.models import InventoryLocation, LocationType

INITIAL_PERMISSIONS = [
    # Users
    {"name": "users:read", "resource": "users", "action": "read", "description": "Ver lista y detalles de usuarios"},
    {"name": "users:write", "resource": "users", "action": "write", "description": "Crear y modificar usuarios y roles"},
    # Catalog
    {"name": "products:read", "resource": "products", "action": "read", "description": "Consultar catálogo de productos"},
    {"name": "products:write", "resource": "products", "action": "write", "description": "Crear, editar y eliminar productos y variantes"},
    # Inventory
    {"name": "inventory:read", "resource": "inventory", "action": "read", "description": "Consultar stock por sucursal"},
    {"name": "inventory:adjust", "resource": "inventory", "action": "adjust", "description": "Ajustar y transferir inventario"},
    # Orders & Sales
    {"name": "orders:read", "resource": "orders", "action": "read", "description": "Ver órdenes y ventas"},
    {"name": "orders:create", "resource": "orders", "action": "create", "description": "Registrar compras y ventas"},
    {"name": "pos:operate", "resource": "pos", "action": "operate", "description": "Cobrar y emitir comprobantes en caja"},
    # Reservations
    {"name": "reservations:read", "resource": "reservations", "action": "read", "description": "Consultar reservas de prendas"},
    {"name": "reservations:manage", "resource": "reservations", "action": "manage", "description": "Preparar y confirmar reservas"},
    # Reports & AI
    {"name": "reports:read", "resource": "reports", "action": "read", "description": "Ver reportes y dashboards gerenciales"},
]

ROLE_PERMISSIONS_MAP = {
    "ADMIN": [p["name"] for p in INITIAL_PERMISSIONS],
    "BRANCH_MANAGER": [
        "products:read",
        "inventory:read",
        "inventory:adjust",
        "orders:read",
        "reservations:read",
        "reservations:manage",
        "reports:read",
    ],
    "CASHIER": [
        "products:read",
        "inventory:read",
        "orders:read",
        "orders:create",
        "pos:operate",
        "reservations:read",
    ],
    "SUPPLIER": [
        "products:read",
        "products:write",
        "inventory:read",
    ],
    "CUSTOMER": [
        "products:read",
        "orders:create",
        "reservations:read",
    ],
}

INITIAL_ROLES = [
    {"name": "ADMIN", "description": "System Administrator with full access"},
    {"name": "CUSTOMER", "description": "Standard retail customer account"},
    {"name": "BRANCH_MANAGER", "description": "Branch and physical store manager"},
    {"name": "CASHIER", "description": "POS cashier operator for store sales"},
    {"name": "SUPPLIER", "description": "External supplier for inventory and stock"},
]

INITIAL_CATEGORIES = [
    {"name": "Vestidos", "description": "Vestidos formales, casuales y de fiesta"},
    {"name": "Blusas", "description": "Blusas de seda, lino y algodón"},
    {"name": "Pantalones", "description": "Pantalones de vestir, palazzos y jeans"},
    {"name": "Faldas", "description": "Faldas midi, plisadas y tubo"},
    {"name": "Chaquetas", "description": "Blazers, abrigos y chaquetas de cuero"},
]

INITIAL_COLLECTIONS = [
    {"name": "Gala Elegance", "description": "Colección de vestidos y prendas de noche"},
    {"name": "Urban Chic", "description": "Moda urbana contemporánea y versátil"},
    {"name": "Summer Breeze", "description": "Prendas frescas para temporada de calor"},
]

INITIAL_SEASONS = [
    {"name": "Primavera - Verano", "year": 2026},
    {"name": "Otoño - Invierno", "year": 2026},
]

INITIAL_SUPPLIERS = [
    {
        "name": "Textiles Andinos S.A.",
        "contact_email": "contacto@textilesandinos.com",
        "phone": "+59122114455",
    },
    {
        "name": "Confecciones Alta Costura S.R.L.",
        "contact_email": "ventas@altacostura.com",
        "phone": "+59133445566",
    },
]

INITIAL_COLORS = [
    {"name": "Negro", "hex_code": "#000000"},
    {"name": "Blanco", "hex_code": "#FFFFFF"},
    {"name": "Rojo Rubí", "hex_code": "#E0115F"},
    {"name": "Azul Marino", "hex_code": "#000080"},
    {"name": "Verde Esmeralda", "hex_code": "#50C878"},
    {"name": "Rosa Palo", "hex_code": "#DDA0DD"},
]

INITIAL_SIZES = [
    {"name": "XS", "sort_order": 1},
    {"name": "S", "sort_order": 2},
    {"name": "M", "sort_order": 3},
    {"name": "L", "sort_order": 4},
    {"name": "XL", "sort_order": 5},
    {"name": "XXL", "sort_order": 6},
]

INITIAL_LOCATIONS = [
    {
        "name": "Sucursal Santa Cruz",
        "type": LocationType.BRANCH,
        "address": "Av. San Martín #450, Equipetrol",
        "phone": "+59133441122",
    },
    {
        "name": "Sucursal La Paz",
        "type": LocationType.BRANCH,
        "address": "Av. 16 de Julio #1230, El Prado",
        "phone": "+59122334455",
    },
    {
        "name": "Almacén Central",
        "type": LocationType.WAREHOUSE,
        "address": "Parque Industrial Mz. 12, Santa Cruz",
        "phone": "+59133889900",
    },
]


def seed_permissions(db: Session) -> dict[str, Permission]:
    """Idempotently seed granular permissions."""
    permission_map = {}
    for perm_data in INITIAL_PERMISSIONS:
        stmt = select(Permission).where(Permission.name == perm_data["name"])
        existing_perm = db.scalars(stmt).first()
        if not existing_perm:
            new_perm = Permission(
                name=perm_data["name"],
                resource=perm_data["resource"],
                action=perm_data["action"],
                description=perm_data["description"],
            )
            db.add(new_perm)
            db.commit()
            db.refresh(new_perm)
            permission_map[new_perm.name] = new_perm
            print(f"[SEED] Created permission: {new_perm.name}")
        else:
            permission_map[existing_perm.name] = existing_perm
    return permission_map


def seed_roles(db: Session) -> list[Role]:
    """Idempotently seed the initial 5 system roles and assign permissions."""
    permissions_map = seed_permissions(db)
    created_or_found_roles = []

    for role_data in INITIAL_ROLES:
        stmt = select(Role).where(Role.name == role_data["name"])
        existing_role = db.scalars(stmt).first()

        target_perm_names = ROLE_PERMISSIONS_MAP.get(role_data["name"], [])
        target_perms = [permissions_map[name] for name in target_perm_names if name in permissions_map]

        if not existing_role:
            new_role = Role(
                name=role_data["name"],
                description=role_data["description"],
            )
            new_role.permissions = target_perms
            db.add(new_role)
            db.commit()
            db.refresh(new_role)
            created_or_found_roles.append(new_role)
            print(f"[SEED] Created role: {new_role.name} with {len(target_perms)} permissions")
        else:
            existing_role.permissions = target_perms
            db.commit()
            db.refresh(existing_role)
            created_or_found_roles.append(existing_role)

    return created_or_found_roles


def seed_catalog(db: Session) -> None:
    """Idempotently seed initial catalog metadata (categories, collections, seasons, suppliers, colors, sizes)."""
    # 1. Categories
    for item in INITIAL_CATEGORIES:
        stmt = select(Category).where(Category.name == item["name"])
        if not db.scalars(stmt).first():
            db.add(Category(name=item["name"], description=item["description"]))
            db.commit()
            print(f"[SEED] Created Category: {item['name']}")

    # 2. Collections
    for item in INITIAL_COLLECTIONS:
        stmt = select(Collection).where(Collection.name == item["name"])
        if not db.scalars(stmt).first():
            db.add(Collection(name=item["name"], description=item["description"]))
            db.commit()
            print(f"[SEED] Created Collection: {item['name']}")

    # 3. Seasons
    for item in INITIAL_SEASONS:
        stmt = select(Season).where(Season.name == item["name"], Season.year == item["year"])
        if not db.scalars(stmt).first():
            db.add(Season(name=item["name"], year=item["year"]))
            db.commit()
            print(f"[SEED] Created Season: {item['name']} ({item['year']})")

    # 4. Suppliers
    for item in INITIAL_SUPPLIERS:
        stmt = select(Supplier).where(Supplier.name == item["name"])
        if not db.scalars(stmt).first():
            db.add(Supplier(
                name=item["name"],
                contact_email=item["contact_email"],
                phone=item["phone"],
            ))
            db.commit()
            print(f"[SEED] Created Supplier: {item['name']}")

    # 5. Colors
    for item in INITIAL_COLORS:
        stmt = select(Color).where(Color.name == item["name"])
        if not db.scalars(stmt).first():
            db.add(Color(name=item["name"], hex_code=item["hex_code"]))
            db.commit()
            print(f"[SEED] Created Color: {item['name']}")

    # 6. Sizes
    for item in INITIAL_SIZES:
        stmt = select(Size).where(Size.name == item["name"])
        if not db.scalars(stmt).first():
            db.add(Size(name=item["name"], sort_order=item["sort_order"]))
            db.commit()
            print(f"[SEED] Created Size: {item['name']}")


def seed_inventory(db: Session) -> None:
    """Idempotently seed initial physical inventory locations (branches and warehouses)."""
    for loc_data in INITIAL_LOCATIONS:
        stmt = select(InventoryLocation).where(InventoryLocation.name == loc_data["name"])
        if not db.scalars(stmt).first():
            new_loc = InventoryLocation(
                name=loc_data["name"],
                type=loc_data["type"],
                address=loc_data["address"],
                phone=loc_data["phone"],
                is_active=True,
            )
            db.add(new_loc)
            db.commit()
            print(f"[SEED] Created Location: {new_loc.name} ({new_loc.type.value})")


def run_seed() -> None:
    """Entrypoint to run database seeding from command line."""
    db = SessionLocal()
    try:
        print("[SEED] Starting database seeding (Roles + Permissions + Catalog + Inventory)...")
        seed_roles(db)
        seed_catalog(db)
        seed_inventory(db)
        print("[SEED] All seeding completed successfully.")
    except Exception as e:
        print(f"[SEED ERROR] Failed to seed database: {e}", file=sys.stderr)
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
