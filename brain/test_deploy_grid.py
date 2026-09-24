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

deploy_grid = """@startuml Diagrama_Despliegue_FashionStore
skinparam monochrome true
skinparam shadowing false
skinparam packageStyle rectangle
skinparam linetype ortho

' ============================================================
' COLUMNA IZQUIERDA
' ============================================================

node "Dispositivo Cliente - PC / Móvil\\n<<device>>" as ClientDevice {
    node "Navegador Web / Runtime Móvil\\n<<execution environment>>\\n(Chrome / Safari / React Native)" as ClientEnv {
        artifact "App Web React 18 + Vite (SPA)" as Art_Web
        artifact "App Móvil React Native (AR Vision)" as Art_Mobile
        artifact "SQLite Local (Outbox Offline)" as Art_SQLite
    }
}

node "Servidor Web Estático\\n<<execution environment>>\\n(Azure Static Web Apps / CDN)" as StaticServer {
    artifact "Bundle SPA Compilado\\n(HTML5, JS, CSS)" as Art_StaticBundle
}

node "Servidor de Base de Datos\\n<<database server>>\\n(Azure Database for PostgreSQL)" as DBServer {
    artifact "Motor Relacional PostgreSQL 16" as Art_PG_Engine
    artifact "Base de Datos - fashionstore_db\\n(Tablas: users, catalog, stock,\\nreservations, orders, payments)" as Art_PG_DB
}

' ============================================================
' COLUMNA DERECHA
' ============================================================

node "Router Local - Gateway Cliente\\n(Ethernet / Wi-Fi / 4G-5G)" as LocalRouter

node "Router Perimetral & Firewall\\n<<device>>\\n(Azure Front Door / WAF & Load Balancer)" as PerimeterRouter

node "Servidor de Aplicaciones\\n<<device>>\\n(Azure Container Apps / Linux Host)" as AppServer {
    node "Motor Docker Engine\\n<<execution environment>>" as DockerEngine {
        artifact "Contenedor Backend Core\\n- NestJS (Node.js 20 / :3000)\\n- Auth JWT, RBAC, Inventario,\\nReservas, Orders, POS" as Art_Nest
        artifact "Contenedor Microservicio IA\\n- FastAPI (Python 3.11 / :8000)\\n- Recommendations, LLM Reports,\\nFitting & Size Estimator" as Art_FastAPI
        artifact "Contenedor WebSockets\\n- NestJS Gateway (:3001)\\n- Alertas Reservas / Sync Outbox" as Art_WS
    }
}

node "Servicios Cloud Externos\\n<<cloud services>>" as ExternalCloud {
    artifact "Pasarela Stripe (API HTTPS)" as Art_Stripe
    artifact "Facturación Electrónica SIN" as Art_SIN
    artifact "Azure Blob Storage (Assets 3D)" as Art_Blob
}

' ============================================================
' ALINEACIÓN Y CONEXIONES (Flujo idéntico a referencia)
' ============================================================

' Fila 1: Cliente a Router Local
ClientDevice -right-> LocalRouter : Conexión LAN / Wi-Fi / 4G

' Fila 1 a Fila 2: Router Local a Router Perimetral
LocalRouter -down-> PerimeterRouter : Protocolos Públicos (HTTPS :443 / WSS :443)\\nRED WAN / INTERNET\\nTráfico Cifrado TLS 1.3 / SSL

' Fila 2: Router Perimetral a Servidor Estático y a Servidor Apps
PerimeterRouter -left-> StaticServer : HTTPS (:443)\\nDescarga Estáticos
PerimeterRouter -down-> AppServer : WSS / HTTPS (:3000 / :8000 / :3001)\\nReenvío a Subred Privada (VNet)

' Fila 3: Servidor Apps a Base de Datos (a la izquierda) y a Cloud (abajo)
AppServer -left-> DBServer : Red Interna / Protocolo TCP/IP\\nPuerto Seguro (:5432)\\nPrisma ORM Connection Pool
AppServer -down-> ExternalCloud : HTTPS REST API (:443)\\nIntegraciones Externas

' Alineación vertical izquierda
ClientDevice -[hidden]down-> StaticServer
StaticServer -[hidden]down-> DBServer

@enduml"""

url = plantuml_url(deploy_grid)
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    resp = urllib.request.urlopen(req)
    with open("c:/Parcial-si2/brain/deploy_grid.png", "wb") as f:
        f.write(resp.read())
    print("SUCCESS: Grid deployment diagram saved!")
except Exception as e:
    print("ERROR:", e)
