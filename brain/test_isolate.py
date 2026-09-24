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

import re

with open("c:/Parcial-si2/brain/test_all.py", "r", encoding="utf-8") as f:
    text = f.read()

match = re.search(r'all_diagrams = """(.*?)"""', text, re.DOTALL)
if match:
    all_diagrams = match.group(1)
    blocks = all_diagrams.split("newpage\n")
    for i, b in enumerate(blocks):
        full_code = "@startuml\nallowmixing\nhide circle\nskinparam monochrome true\nskinparam shadowing false\n" + b.replace("@startuml FashionStore_333_Clases_Entidad", "").replace("@enduml", "") + "\n@enduml"
        url = plantuml_url(full_code)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            r = urllib.request.urlopen(req)
            print(f"Block CU{i+1}: SUCCESS (bytes={len(r.read())})")
        except Exception as e:
            print(f"Block CU{i+1}: ERROR {e}")
            print(full_code)
