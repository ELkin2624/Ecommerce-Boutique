import urllib.request
import zlib
import base64

def encode_plantuml(plantuml_text):
    zlibbed_str = zlib.compress(plantuml_text.encode('utf-8'))
    compressed_string = zlibbed_str[2:-4]
    
    plantuml_alphabet = """0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_"""
    def encode64(data):
        r = ''
        for i in range(0, len(data), 3):
            b1 = data[i]
            b2 = data[i+1] if i+1 < len(data) else 0
            b3 = data[i+2] if i+2 < len(data) else 0
            c1 = b1 >> 2
            c2 = ((b1 & 0x3) << 4) | (b2 >> 4)
            c3 = ((b2 & 0xF) << 2) | (b3 >> 6)
            c4 = b3 & 0x3F
            r += plantuml_alphabet[c1] + plantuml_alphabet[c2]
            if i+1 < len(data): r += plantuml_alphabet[c3]
            if i+2 < len(data): r += plantuml_alphabet[c4]
        return r
    return encode64(compressed_string)

puml = """@startuml
skinparam componentStyle uml2
skinparam monochrome true
skinparam packageStyle rectangle
skinparam linetype ortho
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 12

title Diagrama de Componentes - FashionStore (UML 2.5+)

package "Capa de Presentacion" as CapaPres {
    component "Cliente Web\\n(React 18+ / Vite)" as WebApp <<SPA / PWA>>
    component "App Movil\\n(React Native / Expo)" as MobileApp <<Mobile Client>>
}

interface "REST API (HTTPS)\\nCatalogo, Auth, POS" as HTTP_API
interface "WebSocket (WSS)\\nSincronizacion y Alertas" as WS_API

WebApp ..> HTTP_API : <<use>>
WebApp ..> WS_API : <<use>>
MobileApp ..> HTTP_API : <<use>>
MobileApp ..> WS_API : <<use>>

package "Capa de Aplicacion y Servicios" as CapaApp {
    component "Backend Principal (NestJS)" as NestJS <<Servidor / Modular Monolith>>
    
    component "Modulo Inventario & Ventas" as ModInv <<Subsistema Transaccional>>
    component "Modulo Reservas & Probador" as ModRes <<Subsistema de Negocio>>
    component "Modulo Autenticacion & RBAC" as ModAuth <<Subsistema de Seguridad>>
    component "Adaptador Gateway IA" as GatewayIA <<Integration Gateway>>
    
    NestJS ..> ModInv : <<delegate>>
    NestJS ..> ModRes : <<delegate>>
    NestJS ..> ModAuth : <<delegate>>
    NestJS ..> GatewayIA : <<delegate>>
}

HTTP_API -down- NestJS : <<provide>>
WS_API -down- NestJS : <<provide>>

interface "FastAPI Internal API (HTTP)\\nInferencia y Recomendaciones" as AI_API
interface "PostgreSQL Wire (TCP:5432)\\nPersistencia Prisma ORM" as DB_API
interface "Azure Blob Storage API\\nAssets 3D / GLB y Fotos" as BLOB_API
interface "Stripe / QR Gateway API\\nProcesamiento de Pagos" as PAY_API

GatewayIA ..> AI_API : <<use>>
ModInv ..> DB_API : <<use>>
ModRes ..> DB_API : <<use>>
ModAuth ..> DB_API : <<use>>
NestJS ..> BLOB_API : <<use>>
ModInv ..> PAY_API : <<use>>

package "Capa de Inteligencia Artificial" as CapaIA {
    component "Microservicio IA (FastAPI)" as FastAPIServ <<Motor de IA>>
    
    component "Motor Recomendaciones" as RecEngine <<Engine>>
    component "Reportes Generativos (LLM)" as LLMEngine <<NLP Service>>
    component "Estimador Tallas & AR Fitting" as SizeEngine <<Computer Vision>>
    
    FastAPIServ ..> RecEngine : <<delegate>>
    FastAPIServ ..> LLMEngine : <<delegate>>
    FastAPIServ ..> SizeEngine : <<delegate>>
}

AI_API -down- FastAPIServ : <<provide>>

package "Capa de Persistencia" as CapaPersist {
    component "PostgreSQL 16" as PostgresDB <<RDBMS Relacional>>
}

DB_API -down- PostgresDB : <<provide>>

package "Servicios Cloud y Externos" as CapaExt {
    component "Azure Blob Storage" as AzureBlob <<Cloud Storage>>
    component "Pasarela de Pagos (Stripe / QR)" as StripeServ <<External Cloud>>
}

BLOB_API -down- AzureBlob : <<provide>>
PAY_API -down- StripeServ : <<provide>>

@enduml"""

encoded = encode_plantuml(puml)
url = f"http://www.plantuml.com/plantuml/png/{encoded}"
print("URL:", url)

try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as response:
        img_data = response.read()
        with open('brain/test_component_diagram.png', 'wb') as f:
            f.write(img_data)
    print("Generated brain/test_component_diagram.png successfully!")
except Exception as e:
    print("Error downloading:", e)
