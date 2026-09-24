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

test_h = """@startuml CU01_Clases
allowmixing
hide circle
skinparam monochrome true
skinparam shadowing false

actor "Cliente" as ActCliente

class RegistroView {
  +nombreInput: string
  +emailInput: string
  +passwordInput: string
  +tallaPrefInput: string
  __
  +mostrarFormulario(): void
  +capturarDatos(): dict
  +mostrarAlertaExito(): void
  +mostrarErrorValidacion(msg: str): void
}

class RegistroController {
  +validarDatosEntrada(): bool
  +cifrarPasswordArgon2(): string
  +registrarCliente(): dict
  +enviarCorreoBienvenida(): void
}

class User {
  +id: uuid
  +name: string
  +email: string
  +password_hash: string
  +preferred_size: string
  +is_active: bool
  __
  +crearUsuario(): bool
  +buscarPorEmail(): dict
  +guardarPreferencias(): bool
}

ActCliente -r- RegistroView
RegistroView -r- RegistroController
RegistroController -r- User
@enduml"""

url = plantuml_url(test_h)
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
resp = urllib.request.urlopen(req)
with open("c:/Parcial-si2/brain/cu01_horizontal.png", "wb") as f:
    f.write(resp.read())
print("Horizontal test saved!")
