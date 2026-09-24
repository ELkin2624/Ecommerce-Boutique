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

tests = {
"Option 1 (skinparam actorStyle)": """@startuml
skinparam monochrome true
skinparam shadowing false
left to right direction

class "Cliente" as Act << (A,#FFFFFF) >>

class RegistroView {
  +nombreInput: string
  --
  +mostrarFormulario(): void
}

class RegistroController {
  +validar(): bool
}

class User {
  +id: uuid
}

Act -right- RegistroView
RegistroView -right- RegistroController
RegistroController -right- User
@enduml""",

"Option 2 (actor with class in PlantUML 1.2023+)": """@startuml
skinparam monochrome true
skinparam shadowing false
left to right direction

actor "Cliente"

class "RegistroView" {
  +nombreInput: string
  --
  +mostrarFormulario(): void
}

class "RegistroController" {
  +validar(): bool
}

class "User" {
  +id: uuid
}

"Cliente" -right- "RegistroView"
"RegistroView" -right- "RegistroController"
"RegistroController" -right- "User"
@enduml""",

"Option 3 (declare classes first, then actor)": """@startuml
skinparam monochrome true
skinparam shadowing false
left to right direction

class RegistroView {
  +nombreInput: string
  --
  +mostrarFormulario(): void
}

class RegistroController {
  +validar(): bool
}

class User {
  +id: uuid
}

actor Cliente

Cliente -right- RegistroView
RegistroView -right- RegistroController
RegistroController -right- User
@enduml""",

"Option 4 (class Cliente <<actor>>)": """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam class {
    HeaderBackgroundColor<<actor>> White
}

class Cliente <<actor>> {
}

class RegistroView {
  +nombreInput: string
  --
  +mostrarFormulario(): void
}

class RegistroController {
  +validar(): bool
}

class User {
  +id: uuid
}

Cliente -right- RegistroView
RegistroView -right- RegistroController
RegistroController -right- User
@enduml""",

"Option 5 (allow_mixing directive)": """@startuml
allowmixing
skinparam monochrome true
skinparam shadowing false
left to right direction

actor Cliente

class RegistroView {
  +nombreInput: string
  --
  +mostrarFormulario(): void
}

class RegistroController {
  +validar(): bool
}

class User {
  +id: uuid
}

Cliente -right- RegistroView
RegistroView -right- RegistroController
RegistroController -right- User
@enduml"""
}

for name, code in tests.items():
    url = plantuml_url(code)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        r = urllib.request.urlopen(req)
        print(f"{name}: SUCCESS (bytes={len(r.read())})")
    except urllib.error.HTTPError as e:
        print(f"{name}: HTTP Error {e.code}")
    except Exception as e:
        print(f"{name}: Error {e}")
