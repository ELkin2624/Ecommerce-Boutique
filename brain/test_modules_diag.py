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
skinparam defaultFontSize 11

title 3.5.4 Diagrama de Modulos Implementados - FashionStore (UML 2.5+)

package "M1. RESERVAS Y PROBADOR FISICO" as M1 {
    component "reservation_view.tsx\\n(React / Web)" as M1_FE1 <<Frontend>>
    component "fitting_room_tablet.tsx\\n(React / POS)" as M1_FE2 <<Frontend>>
    
    interface "API REST" as M1_REST
    interface "WebSockets" as M1_WS
    
    M1_FE1 .down.> M1_REST
    M1_FE2 .down.> M1_WS
    
    component "reservations.controller.ts\\n(NestJS)" as M1_BE <<Backend>>
    
    M1_REST -down- M1_BE
    M1_WS -down- M1_BE
    
    interface "ORM" as M1_ORM1
    interface "ORM" as M1_ORM2
    
    M1_BE .down.> M1_ORM1
    M1_BE .down.> M1_ORM2
    
    component "reservations.sql\\n(PostgreSQL)" as M1_DB1 <<Database>>
    component "inventory_stocks.sql\\n(PostgreSQL)" as M1_DB2 <<Database>>
    
    M1_ORM1 -down- M1_DB1
    M1_ORM2 -down- M1_DB2
}

package "M2. INTELIGENCIA ARTIFICIAL Y REPORTES" as M2 {
    component "AiReportAssistant.tsx\\n(React / Web)" as M2_FE <<Frontend>>
    
    interface "API (Audio / Prompt)" as M2_API
    
    M2_FE .down.> M2_API
    
    component "reports.controller.ts\\n(NestJS Gateway)" as M2_BE <<Backend>>
    M2_API -down- M2_BE
    
    component "reports_engine.py\\n(FastAPI / Python)" as M2_AI2 <<Microservicio IA>>
    component "gemini_client.py\\n(Google Gemini API)" as M2_AI1 <<Cloud LLM>>
    
    M2_BE .down.> M2_AI2 : Invoca
    M2_AI2 .down.> M2_AI1 : Prompt / JSON
    
    interface "ORM" as M2_ORM
    M2_BE .down.> M2_ORM
    
    component "orders.sql (JSONB)\\n(PostgreSQL)" as M2_DB <<Database>>
    M2_ORM -down- M2_DB
}

package "M3. AUTENTICACION Y SEGURIDAD" as M3 {
    component "register_view.tsx\\n(React / Web)" as M3_FE1 <<Frontend>>
    component "login_view.tsx\\n(React / Web)" as M3_FE2 <<Frontend>>
    
    interface "Registro" as M3_REG
    interface "Login" as M3_LOG
    
    M3_FE1 .down.> M3_REG
    M3_FE2 .down.> M3_LOG
    
    component "auth.controller.ts\\n(NestJS)" as M3_BE <<Backend>>
    M3_REG -down- M3_BE
    M3_LOG -down- M3_BE
    
    component "security_service.ts\\n(Argon2 / JWT)" as M3_SEC <<Seguridad>>
    M3_BE .down.> M3_SEC : Genera Token
    
    interface "ORM" as M3_ORM1
    interface "ORM" as M3_ORM2
    
    M3_BE .down.> M3_ORM1
    M3_SEC .down.> M3_ORM2
    
    component "users.sql\\n(PostgreSQL)" as M3_DB1 <<Database>>
    component "refresh_tokens.sql\\n(PostgreSQL)" as M3_DB2 <<Database>>
    
    M3_ORM1 -down- M3_DB1
    M3_ORM2 -down- M3_DB2
}

@enduml"""

encoded = encode_plantuml(puml)
url = f"http://www.plantuml.com/plantuml/png/{encoded}"
print("URL:", url)

try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as response:
        img_data = response.read()
        with open('brain/test_modules_diagram.png', 'wb') as f:
            f.write(img_data)
    print("Generated brain/test_modules_diagram.png successfully!")
except Exception as e:
    print("Error downloading:", e)
