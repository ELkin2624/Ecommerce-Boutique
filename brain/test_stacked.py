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

diag_vertical_layers = """@startuml Arquitectura_Capas_FashionStore
skinparam monochrome true
skinparam shadowing false
skinparam packageStyle rectangle

package "UI - Frontend (Web & Móvil)\\n<<capa de presentación>>" as Layer_UI {
    package "Autenticación & Perfil - UI" as UI_Auth
    package "Catálogo, Carrito & POS - UI" as UI_Commerce
    package "Probador AR & Asistente IA - UI" as UI_AR
}

package "Servidor Backend (NestJS + FastAPI)\\n<<capa de aplicación y servicios>>" as Layer_App {
    package "AuthRouter\\n(NestJS / JWT / Argon2)" as Srv_Auth
    package "Commerce & POS API\\n(Catalog / Orders / Branches)" as Srv_Commerce
    package "WebSocket & Sync Server\\n(Alertas Reservas / Outbox Receiver)" as Srv_Sync
    package "AI Services Gateway\\n(FastAPI / LLM Reports / Fitting)" as Srv_AI
}

package "Core Domain (DDD)\\n<<capa de dominio y procesamiento>>" as Layer_Domain {
    package "Catálogo & Variantes\\n(Product, Variant, Category)" as Dom_Cat
    package "Inventario & Sucursales\\n(Branch, Stock, Movement)" as Dom_Inv
    package "Motor de Reservas\\n(Reservation, StateMachine)" as Dom_Res
    package "Ventas & Facturación\\n(Order, Payment, Factura SIN)" as Dom_Pay
}

package "BD & Entorno\\n<<capa de persistencia e infraestructura>>" as Layer_Infra {
    package "PostgreSQL 16\\n(Prisma ORM Central DB)" as DB_PG
    package "SQLite Local\\n(Outbox Offline Móvil / POS)" as DB_SQLite
    package "Servicios Externos & Cloud\\n(Stripe API / SIN / Azure Blob)" as Ext_Services
    package "Docker Compose\\n(Orquestación y Despliegue)" as Infra_Docker
}

' Enlaces de flujo descendente (Top-Down)
UI_Auth ..> Srv_Auth : (HTTP REST / JWT)
UI_Commerce ..> Srv_Commerce : (HTTP REST)
UI_Commerce ..> Srv_Sync : (WebSockets Alerts)
UI_AR ..> Srv_AI : (Fitting Stream / REST)

Srv_Auth ..> Dom_Cat : (Auth Check)
Srv_Commerce ..> Dom_Cat : (Domain Logic)
Srv_Commerce ..> Dom_Inv : (Domain Logic)
Srv_Commerce ..> Dom_Res : (Domain Logic)
Srv_Commerce ..> Dom_Pay : (Domain Logic)
Srv_Commerce ..> Srv_AI : (Inferencia Interna)

Dom_Cat ..> DB_PG : (Prisma ORM)
Dom_Inv ..> DB_PG : (Prisma ORM)
Dom_Res ..> DB_PG : (Prisma ORM)
Dom_Pay ..> DB_PG : (Prisma ORM)

Srv_Sync ..> DB_SQLite : (Sync Outbox)
Dom_Pay ..> Ext_Services : (Stripe / SIN API)
DB_PG ..> Infra_Docker : (Containerized)

@enduml"""

url = plantuml_url(diag_vertical_layers)
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    resp = urllib.request.urlopen(req)
    with open("c:/Parcial-si2/brain/arch_stacked.png", "wb") as f:
        f.write(resp.read())
    print("SUCCESS: Stacked diagram saved!")
except Exception as e:
    print("ERROR:", e)
