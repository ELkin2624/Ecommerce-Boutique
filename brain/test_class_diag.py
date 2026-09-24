import urllib.request
import zlib

def encode64p(c):
    if c < 10: return chr(48 + c)
    c -= 10
    if c < 26: return chr(65 + c)
    c -= 26
    if c < 26: return chr(97 + c)
    c -= 26
    if c == 0: return '-'
    if c == 1: return '_'
    return '?'

def encode64(data):
    r = ""
    for i in range(0, len(data), 3):
        b1 = data[i]
        b2 = data[i+1] if i+1 < len(data) else 0
        b3 = data[i+2] if i+2 < len(data) else 0
        c1 = b1 >> 2
        c2 = ((b1 & 0x3) << 4) | (b2 >> 4)
        c3 = ((b2 & 0xF) << 2) | (b3 >> 6)
        c4 = b3 & 0x3F
        r += encode64p(c1) + encode64p(c2) + encode64p(c3) + encode64p(c4)
    return r

def plantuml_url(text):
    z = zlib.compress(text.encode('utf-8'))[2:-4]
    return 'http://www.plantuml.com/plantuml/png/' + encode64(z)

class_diag = """@startuml Diagrama_Clases_FashionStore
hide circle
skinparam monochrome true
skinparam shadowing false
skinparam packageStyle rectangle

package "Seguridad y Accesos (RBAC)" {
    class User {
        -id: UUID
        -name: String
        -email: String
        -password_hash: String
        -preferred_size: String
        -is_active: Boolean
        -created_at: DateTime
        --
        +validatePassword(raw: String): Boolean
        +updateProfile(data: JSON): Boolean
    }

    class Role {
        -id: UUID
        -name: String
        -description: String
    }

    class Permission {
        -id: UUID
        -resource: String
        -action: String
        -description: String
    }

    class UserRole {
        -id: UUID
        -user_id: UUID
        -role_id: UUID
        -assigned_at: DateTime
    }
}

package "Catálogo y Probador Virtual" {
    class Category {
        -id: UUID
        -name: String
        -description: String
        -is_active: Boolean
    }

    class Product {
        -id: UUID
        -name: String
        -description: String
        -brand: String
        -category_id: UUID
        -is_active: Boolean
        --
        +getVariants(): JSON
    }

    class ProductVariant {
        -id: UUID
        -product_id: UUID
        -sku: String
        -color: String
        -size: String
        -price: Decimal
        -cost: Decimal
        -barcode: String
        -is_active: Boolean
        --
        +calculateFitScore(userMeas: JSON): Decimal
    }

    class FittingMeasurement {
        -id: UUID
        -variant_id: UUID
        -chest_cm: Decimal
        -waist_cm: Decimal
        -hips_cm: Decimal
        -length_cm: Decimal
        -asset_3d_url: String
    }
}

package "Inventario y Sucursales" {
    class City {
        -id: UUID
        -name: String
    }

    class Branch {
        -id: UUID
        -city_id: UUID
        -name: String
        -address: String
        -phone: String
        -lat_long: String
    }

    class WarehouseLocation {
        -id: UUID
        -branch_id: UUID
        -name: String
        -type: String
    }

    class InventoryStock {
        -id: UUID
        -variant_id: UUID
        -location_id: UUID
        -quantity: Integer
        -min_stock: Integer
        --
        +updateStock(delta: Integer): Boolean
    }
}

package "Reservas y Ventas Omnicanal" {
    class Reservation {
        -id: UUID
        -user_id: UUID
        -branch_id: UUID
        -status: ReservationStatus
        -fitting_room_no: Integer
        -expires_at: DateTime
        -qr_code: String
        --
        +transitionTo(newSt: ReservationStatus): Boolean
        +assignFittingRoom(no: Integer): Boolean
    }

    class Order {
        -id: UUID
        -user_id: UUID
        -branch_id: UUID
        -type: OrderType
        -status: OrderStatus
        -total: Decimal
        -payment_ref: String
        -created_at: DateTime
        --
        +calculateTotal(): Decimal
    }

    class Payment {
        -id: UUID
        -order_id: UUID
        -method: PaymentMethod
        -status: String
        -amount: Decimal
        -transaction_ref: String
        -paid_at: DateTime
    }

    class InvoiceSIN {
        -id: UUID
        -order_id: UUID
        -invoice_number: String
        -authorization_code: String
        -control_code: String
        -nit_customer: String
        -xml_signed: String
    }
}

' Relaciones
User "1" *-- "0..*" UserRole
Role "1" *-- "0..*" UserRole
Category "1" *-- "0..*" Product
Product "1" *-- "1..*" ProductVariant
ProductVariant "1" o-- "0..1" FittingMeasurement
City "1" *-- "1..*" Branch
Branch "1" *-- "1..*" WarehouseLocation
ProductVariant "1" -- "0..*" InventoryStock
WarehouseLocation "1" -- "0..*" InventoryStock
User "1" -- "0..*" Reservation
Branch "1" -- "0..*" Reservation
User "1" -- "0..*" Order
Order "1" *-- "1" Payment
Order "1" *-- "0..1" InvoiceSIN

@enduml"""

url = plantuml_url(class_diag)
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    resp = urllib.request.urlopen(req)
    print("CLASS DIAGRAM SUCCESS! Code:", resp.getcode(), "Bytes:", len(resp.read()))
except Exception as e:
    print("ERROR:", e)
