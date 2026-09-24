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

diag_perfect_stack = """@startuml Arquitectura_Diseno_FashionStore
skinparam monochrome true
skinparam shadowing false
skinparam packageStyle rectangle

package "UI - Frontend (React & Móvil)\\n<<capa de presentación>>" as Layer_UI {
    package "Autenticación & Clientes - UI" as UI_Auth
    package "Catálogo, Carrito & Admin - UI" as UI_Commerce
    package "Probador AR & Asistente IA - UI" as UI_AR
}

package "Servidor Backend (NestJS + FastAPI)\\n<<capa de aplicación y servicios>>" as Layer_App {
    package "Auth & RBAC Module\\n(NestJS / JWT / Argon2)" as Srv_Auth
    package "Commerce & POS API\\n(NestJS / Catalog / Orders)" as Srv_Commerce
    package "Yjs & WebSocket Server\\n(Alertas Reservas / POS WS)" as Srv_WS
    package "AI & Fitting API\\n(FastAPI / LLM / MediaPipe)" as Srv_AI
}

package "Core Domain (DDD)\\n<<capa de dominio y procesamiento>>" as Layer_Domain {
    package "Modelo Catálogo & Inventario\\n(Product, Variant, Stock, Branch)" as Dom_CatInv
    package "Motor de Reservas Omnicanal\\n(Reservation, FittingRoom, States)" as Dom_Res
    package "Motor de Pagos & Facturación\\n(Order, Payment, Factura SIN)" as Dom_Pay
}

package "BD & Entorno\\n<<capa de persistencia e infraestructura>>" as Layer_Infra {
    package "PostgreSQL 16\\n(Prisma ORM Central DB)" as DB_PG
    package "SQLite Local\\n(Outbox Offline Móvil / POS)" as DB_SQLite
    package "Servicios Externos & Cloud\\n(Stripe API / SIN / Azure Blob)" as Ext_Services
    package "Docker Compose\\n(Orquestación de Contenedores)" as Infra_Docker
}

' Flujos directos entre columnas (Top-Down vertical)
UI_Auth ..> Srv_Auth : (HTTP REST / JWT)
UI_Commerce ..> Srv_Commerce : (HTTP REST)
UI_Commerce ..> Srv_WS : (WebSockets Alerts)
UI_AR ..> Srv_AI : (Fitting Stream / REST)

Srv_Auth ..> Dom_CatInv : (Auth Check)
Srv_Commerce ..> Dom_CatInv : (Catalog & Stock)
Srv_Commerce ..> Dom_Res : (Reservas)
Srv_Commerce ..> Dom_Pay : (Ventas & Facturas)
Srv_Commerce ..> Srv_AI : (Inferencia Interna)

Dom_CatInv ..> DB_PG : (Prisma ORM)
Dom_Res ..> DB_PG : (Prisma ORM)
Dom_Pay ..> DB_PG : (Prisma ORM)

Dom_Pay ..> Ext_Services : (Stripe / SIN)
Srv_WS ..> DB_SQLite : (Sync Outbox)
DB_PG ..> Infra_Docker : (Containerized)

@enduml"""

url = plantuml_url(diag_perfect_stack)
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    resp = urllib.request.urlopen(req)
    with open("c:/Parcial-si2/brain/arch_perfect.png", "wb") as f:
        f.write(resp.read())
    print("SUCCESS: Perfect stack saved!")
except Exception as e:
    print("ERROR:", e)
