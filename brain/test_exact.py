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

diag_exact = """@startuml Arquitectura_Diseno_FashionStore
skinparam monochrome true
skinparam shadowing false
skinparam packageStyle rectangle

package "UI - Frontend (Web & Móvil)\\n<<capa de presentación>>" as Layer_UI {
    package "Autenticación y Clientes - UI\\n(React / React Native FSD)" as UI_Auth
    package "Catálogo, Carrito y POS - UI\\n(Recharts / Web Speech)" as UI_Commerce
    package "Probador AR y Cámara - UI\\n(Vision Camera / MediaPipe)" as UI_AR
}

package "Servidor Backend (NestJS + FastAPI)\\n<<capa de aplicación y servicios>>" as Layer_App {
    package "AuthRouter\\n(NestJS / JWT / Argon2)" as Srv_Auth
    package "CommerceRouter\\n(NestJS / Catalog / Orders)" as Srv_Commerce
    package "BranchInventoryRouter\\n(NestJS / Sucursales / Stock)" as Srv_Branch
    package "Yjs & WebSocket Server\\n(Alertas Reservas / POS WS)" as Srv_WS
    package "Voice & AI Service API\\n(FastAPI / LLM Reports / Fitting)" as Srv_AI
}

package "Core Domain (DDD)\\n<<capa de dominio y procesamiento>>" as Layer_Domain {
    package "Modelo Usuarios y Roles\\n(User, Role, RBAC)" as Dom_Auth
    package "Modelo Catálogo y Variantes\\n(Product, Variant, Category)" as Dom_Cat
    package "Modelo Inventario y Ubicaciones\\n(Branch, Stock, Movement)" as Dom_Inv
    package "Motor de Reservas y Estados\\n(Reservation, FittingRoom)" as Dom_Res
    package "Motor de Pagos y Facturación\\n(Order, Payment, Factura SIN)" as Dom_Pay
    package "Outbox Transaction Handler\\n(Sync SQLite to PG)" as Dom_Sync
}

package "BD & Entorno\\n<<capa de persistencia e infraestructura>>" as Layer_Infra {
    package "PostgreSQL 16\\n(Prisma ORM Central DB)" as DB_PG
    package "SQLite Local\\n(Outbox Offline Móvil / POS)" as DB_SQLite
    package "Docker Compose\\n(Orquestación y Despliegue)" as DB_Docker
}

' Columna 1
UI_Auth ..> Srv_Auth : (HTTP REST / JWT)
Srv_Auth ..> Dom_Auth
Dom_Auth ..> Dom_Pay
Dom_Pay ..> DB_PG : (Prisma ORM)

' Columna 2
UI_Commerce ..> Srv_Commerce : (HTTP REST)
Srv_Commerce ..> Srv_Branch
Srv_Branch ..> Dom_Cat
Dom_Cat ..> Dom_Inv
Dom_Inv ..> DB_PG : (Prisma ORM)

' Columna 3
UI_AR ..> Srv_WS : (WebSockets Yjs / Audio)
Srv_WS ..> Srv_AI : (Auth check)
Srv_AI ..> Dom_Res
Dom_Res ..> Dom_Sync
Dom_Sync ..> DB_SQLite : (Sync Outbox)
DB_PG ..> DB_Docker : (Containerized)

@enduml"""

url = plantuml_url(diag_exact)
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    resp = urllib.request.urlopen(req)
    with open("c:/Parcial-si2/brain/arch_exact.png", "wb") as f:
        f.write(resp.read())
    print("SUCCESS: Exact architecture saved!")
except Exception as e:
    print("ERROR:", e)
