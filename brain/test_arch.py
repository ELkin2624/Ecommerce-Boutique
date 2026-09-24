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

diag_test = """@startuml Arquitectura_Capas_FashionStore
skinparam monochrome true
skinparam shadowing false
skinparam packageStyle rectangle

package "Capa de Presentación (UI - React & Móvil)\\n<<capa de presentación>>" as CapaUI {
    package "E-Commerce Web (React 18 + FSD)\\n[Catálogo, Carrito, Checkout]" as UI_Web
    package "App Móvil (React Native)\\n[AR Try-On Vision + MediaPipe]" as UI_Movil
    package "Portal Admin & POS (Web)\\n[Inventario, Sucursales, Recharts IA]" as UI_AdminPOS
}

package "Capa de Aplicación y Servicios (NestJS + FastAPI)\\n<<capa de aplicación y servicios>>" as CapaApp {
    package "NestJS Core Monolith\\n(Auth JWT, RBAC, Orders, Prisma)" as Nest_Core
    package "WebSockets Gateway\\n(Alertas Reservas & Vestidores)" as Nest_WS
    package "Microservicio IA (FastAPI)\\n(Recomendador, LLM Reports, Fitting)" as Fast_AI
    package "Offline Sync Service\\n(Outbox SQLite Receiver)" as Nest_Sync
}

package "Capa de Dominio y Negocio (DDD Core)\\n<<capa de dominio y procesamiento>>" as CapaDominio {
    package "Módulo Catálogo & Variantes\\n(Product, Variant, Measurements)" as Dom_Cat
    package "Módulo Inventario Multi-Sucursal\\n(Branch, Stock, InventoryMovement)" as Dom_Inv
    package "Módulo Reservas Omnicanal\\n(Reservation, FittingRoom, States)" as Dom_Res
    package "Módulo Ventas & Facturación\\n(Order, Payment, FacturaSIN)" as Dom_Pay
}

package "Capa de Persistencia e Infraestructura\\n<<capa de persistencia e infraestructura>>" as CapaInfra {
    package "PostgreSQL 16\\n(Prisma ORM Central Database)" as DB_PG
    package "SQLite Local (Móvil / POS)\\n(Offline Outbox Cache)" as DB_SQLite
    package "Servicios Externos & Cloud\\n(Stripe API, SIN Facturación, Azure Blob)" as Cloud_Ext
    package "Docker Compose\\n(Orquestación y Contenedores)" as Docker_Env
}

' Dependencias entre Capas
UI_Web ..> Nest_Core : (HTTP REST / JWT)
UI_Movil ..> Nest_Core : (HTTP REST / JWT)
UI_Movil ..> Nest_Sync : (Sync Outbox)
UI_AdminPOS ..> Nest_Core : (HTTP REST)
UI_AdminPOS ..> Nest_WS : (WebSockets Alerts)

Nest_Core ..> Fast_AI : (REST Interno / Inferencia)
Nest_Core ..> Dom_Cat : (Domain Rules)
Nest_Core ..> Dom_Inv : (Domain Rules)
Nest_Core ..> Dom_Res : (Domain Rules)
Nest_Core ..> Dom_Pay : (Domain Rules)

Dom_Cat ..> DB_PG : (Prisma ORM)
Dom_Inv ..> DB_PG : (Prisma ORM)
Dom_Res ..> DB_PG : (Prisma ORM)
Dom_Pay ..> DB_PG : (Prisma ORM)

UI_Movil ..> DB_SQLite : (Local Storage)
Nest_Core ..> Cloud_Ext : (Stripe / SIN)

@enduml"""

url = plantuml_url(diag_test)
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    resp = urllib.request.urlopen(req)
    with open("c:/Parcial-si2/brain/arch_layers.png", "wb") as f:
        f.write(resp.read())
    print("SUCCESS: Layers diagram saved!")
except Exception as e:
    print("ERROR:", e)
