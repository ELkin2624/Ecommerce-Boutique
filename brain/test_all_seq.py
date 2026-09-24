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

seq_all = [
# CU01
"""@startuml
hide footbox
skinparam monochrome true
skinparam shadowing false
title CU01. Registrar Usuario

actor "Cliente" as User
participant "Vista (Registro)\\n<<boundary>>" as View
participant "Controller (Auth)\\n<<control>>" as Ctrl
participant "Model (User)\\n<<entity>>" as Model

User -> View : 1 Ingresa datos de registro
activate View
View -> Ctrl : 2 enviarDatosRegistro(datos)
activate Ctrl
Ctrl -> Ctrl : 3 validar_datos(datos)
Ctrl -> Model : 4 verificar_correo_duplicado(email)
activate Model
Model --> Ctrl : 5 return (disponible)
deactivate Model
Ctrl -> Model : 6 crear_nuevo_usuario(datos_cifrados)
activate Model
Model --> Ctrl : 7 return (usuario_creado)
deactivate Model
Ctrl -> Ctrl : 8 generar_token_jwt(usuario_creado)
Ctrl --> View : 9 return (exito)
deactivate Ctrl
View --> User : 10 Muestra mensaje de éxito y redirige
deactivate View
@enduml""",

# CU02
"""@startuml
hide footbox
skinparam monochrome true
skinparam shadowing false
title CU02. Iniciar Sesión

actor "Usuario" as User
participant "Vista (Login)\\n<<boundary>>" as View
participant "Controller (Auth)\\n<<control>>" as Ctrl
participant "Model (User)\\n<<entity>>" as Model
participant "Model (TokenJWT)\\n<<entity>>" as Token

User -> View : 1 Ingresa credenciales (email, password)
activate View
View -> Ctrl : 2 autenticarUsuario(email, password)
activate Ctrl
Ctrl -> Model : 3 buscarPorEmail(email)
activate Model
Model --> Ctrl : 4 return (usuario_data)
deactivate Model
Ctrl -> Ctrl : 5 verificarHashArgon2(password, hash)
Ctrl -> Token : 6 emitirTokens(userId, roles)
activate Token
Token --> Ctrl : 7 return (accessToken, refreshToken)
deactivate Token
Ctrl --> View : 8 return (authExitoso)
deactivate Ctrl
View --> User : 9 Almacena sesión y carga workspace
deactivate View
@enduml""",

# CU03
"""@startuml
hide footbox
skinparam monochrome true
skinparam shadowing false
title CU03. Explorar Catálogo Inteligente

actor "Cliente" as User
participant "Vista (Catálogo)\\n<<boundary>>" as View
participant "Controller (Catálogo)\\n<<control>>" as Ctrl
participant "Servicio (FastAPI IA)\\n<<external>>" as AI
participant "Model (ProductVariant)\\n<<entity>>" as Model

User -> View : 1 Selecciona categoría y filtros
activate View
View -> Ctrl : 2 obtenerProductosCatalogo(filtros, sucursalId)
activate Ctrl
Ctrl -> AI : 3 consultarRecomendaciones(userId, sucursalId)
activate AI
AI --> Ctrl : 4 return (variantIdsRecomendados)
deactivate AI
Ctrl -> Model : 5 consultarVariantesYStock(variantIds, sucursalId)
activate Model
Model --> Ctrl : 6 return (listaProductosConStock)
deactivate Model
Ctrl --> View : 7 return (catalogoRenderizable)
deactivate Ctrl
View --> User : 8 Renderiza grid con badges de IA y stock
deactivate View
@enduml""",

# CU04
"""@startuml
hide footbox
skinparam monochrome true
skinparam shadowing false
title CU04. Utilizar Probador Virtual (AR)

actor "Cliente" as User
participant "Vista (Probador AR)\\n<<boundary>>" as View
participant "Controller (Fitting AR)\\n<<control>>" as Ctrl
participant "Servicio (FastAPI IA)\\n<<external>>" as AI
participant "Model (PrendaFitting)\\n<<entity>>" as Model

User -> View : 1 Activa cámara y elige prenda
activate View
View -> Ctrl : 2 procesarFramePose(landmarksMediaPipe)
activate Ctrl
Ctrl -> Model : 3 obtenerMedidasPrenda(variantId)
activate Model
Model --> Ctrl : 4 return (tablaMedidas, asset3D)
deactivate Model
Ctrl -> AI : 5 estimarCalceTalla(medidasUsuario, tablaMedidas)
activate AI
AI --> Ctrl : 6 return (scoreCalce, tallaSugerida)
deactivate AI
Ctrl --> View : 7 return (overlayCoords, ajusteTalla)
deactivate Ctrl
View --> User : 8 Renderiza prenda 3D sobre cuerpo y muestra talla
deactivate View
@enduml""",

# CU05
"""@startuml
hide footbox
skinparam monochrome true
skinparam shadowing false
title CU05. Solicitar Reserva para Prueba

actor "Cliente" as User
participant "Vista (Reserva)\\n<<boundary>>" as View
participant "Controller (Reservas)\\n<<control>>" as Ctrl
participant "Model (Reservation)\\n<<entity>>" as ResModel
participant "Model (InventoryStock)\\n<<entity>>" as StockModel

User -> View : 1 Selecciona prendas, sucursal y horario
activate View
View -> Ctrl : 2 crearSolicitudReserva(items, branchId, fecha)
activate Ctrl
Ctrl -> StockModel : 3 retenerStockTemporal(variantIds, branchId)
activate StockModel
StockModel --> Ctrl : 4 return (stockRetenidoOK)
deactivate StockModel
Ctrl -> ResModel : 5 registrarReserva(userId, branchId, items, PENDING)
activate ResModel
ResModel --> Ctrl : 6 return (reservaCreada, qrCode)
deactivate ResModel
Ctrl -> Ctrl : 7 emitirNotificacionWebSocket(branchId, reservaId)
Ctrl --> View : 8 return (reservaConfirmada)
deactivate Ctrl
View --> User : 9 Muestra confirmación y ticket con código QR
deactivate View
@enduml""",

# CU06
"""@startuml
hide footbox
skinparam monochrome true
skinparam shadowing false
title CU06. Procesar Pago en Línea

actor "Cliente" as User
participant "Vista (Checkout)\\n<<boundary>>" as View
participant "Controller (Pagos)\\n<<control>>" as Ctrl
participant "Pasarela (Stripe)\\n<<external>>" as Stripe
participant "Model (Order)\\n<<entity>>" as OrderModel
participant "Model (Payment)\\n<<entity>>" as PayModel

User -> View : 1 Confirma carrito y datos de tarjeta
activate View
View -> Ctrl : 2 procesarPagoCarrito(cartId, stripeToken)
activate Ctrl
Ctrl -> Stripe : 3 crearCargoPaymentIntent(total, token)
activate Stripe
Stripe --> Ctrl : 4 return (transaccionAprobada, chargeId)
deactivate Stripe
Ctrl -> OrderModel : 5 generarOrden(userId, ONLINE, PAID)
activate OrderModel
OrderModel --> Ctrl : 6 return (orderId)
deactivate OrderModel
Ctrl -> PayModel : 7 registrarPago(orderId, GATEWAY, chargeId)
activate PayModel
PayModel --> Ctrl : 8 return (pagoRegistrado)
deactivate PayModel
Ctrl --> View : 9 return (comprobanteExito)
deactivate Ctrl
View --> User : 10 Muestra recibo digital y resumen de envío
deactivate View
@enduml""",

# CU07
"""@startuml
hide footbox
skinparam monochrome true
skinparam shadowing false
title CU07. Gestionar Reservas Entrantes

actor "Encargado de Sucursal" as Encargado
participant "Vista (POS Reservas)\\n<<boundary>>" as View
participant "Controller (Reservas POS)\\n<<control>>" as Ctrl
participant "Model (Reservation)\\n<<entity>>" as ResModel

Encargado -> View : 1 Recepciona alerta WebSocket en tiempo real
activate View
View -> Ctrl : 2 cargarDetalleReserva(reservaId)
activate Ctrl
Ctrl -> ResModel : 3 obtenerPrendasReservadas(reservaId)
activate ResModel
ResModel --> Ctrl : 4 return (itemsDetalle)
deactivate ResModel
Ctrl --> View : 5 return (listaPrendasPreparar)
deactivate Ctrl
Encargado -> View : 6 Asigna vestidor y marca "Listo"
View -> Ctrl : 7 confirmarVestidorListo(reservaId, nroVestidor)
activate Ctrl
Ctrl -> ResModel : 8 actualizarEstado(READY, nroVestidor)
activate ResModel
ResModel --> Ctrl : 9 return (actualizacionOK)
deactivate ResModel
Ctrl -> Ctrl : 10 notificarClientePush(reservaId, "Vestidor Listo")
Ctrl --> View : 11 return (exito)
deactivate Ctrl
View --> Encargado : 12 Muestra estado actualizado en tablero
deactivate View
@enduml""",

# CU08
"""@startuml
hide footbox
skinparam monochrome true
skinparam shadowing false
title CU08. Procesar Pago Presencial

actor "Cajero" as Cajero
participant "Vista (Terminal POS)\\n<<boundary>>" as View
participant "Controller (Venta POS)\\n<<control>>" as Ctrl
participant "Model (Order)\\n<<entity>>" as OrderModel
participant "Model (InventoryStock)\\n<<entity>>" as StockModel

Cajero -> View : 1 Escanea código de barras de prendas
activate View
View -> Ctrl : 2 registrarItemsVenta(skus, sucursalId)
activate Ctrl
Ctrl --> View : 3 return (subtotal, impuestos, total)
deactivate Ctrl
Cajero -> View : 4 Ingresa método de cobro (Efectivo/QR/Tarjeta)
View -> Ctrl : 5 ejecutarCobroPOS(total, metodoPago, nitCliente)
activate Ctrl
Ctrl -> OrderModel : 6 crearOrdenPresencial(IN_STORE, COMPLETED)
activate OrderModel
OrderModel --> Ctrl : 7 return (orderId, nroFactura)
deactivate OrderModel
Ctrl -> StockModel : 8 descontarStockVenta(variantIds, sucursalId)
activate StockModel
StockModel --> Ctrl : 9 return (stockActualizado)
deactivate StockModel
Ctrl -> Ctrl : 10 generarFacturaElectronicaSIN(orderId)
Ctrl --> View : 11 return (facturaEmitida)
deactivate Ctrl
View --> Cajero : 12 Imprime factura y abre gaveta de dinero
deactivate View
@enduml""",

# CU09
"""@startuml
hide footbox
skinparam monochrome true
skinparam shadowing false
title CU09. Sincronizar Transacciones Offline

actor "Cajero" as Cajero
participant "Vista (Sync Offline)\\n<<boundary>>" as View
participant "Controller (Sync)\\n<<control>>" as Ctrl
participant "Model (OutboxSQLite)\\n<<entity>>" as LocalDB
participant "Model (Order Central)\\n<<entity>>" as CentralDB

Cajero -> View : 1 Conexión a internet restablecida
activate View
View -> Ctrl : 2 iniciarSincronizacionOffline()
activate Ctrl
Ctrl -> LocalDB : 3 obtenerTransaccionesPendientes()
activate LocalDB
LocalDB --> Ctrl : 4 return (loteTransacciones)
deactivate LocalDB
Ctrl -> CentralDB : 5 enviarLoteANestJS(loteTransacciones)
activate CentralDB
CentralDB -> CentralDB : 6 consolidarVentasYAuditoria()
CentralDB --> Ctrl : 7 return (sincronizadosOK, fallidos)
deactivate CentralDB
Ctrl -> LocalDB : 8 marcarComoSincronizados(sincronizadosOK)
activate LocalDB
LocalDB --> Ctrl : 9 return (outboxActualizado)
deactivate LocalDB
Ctrl --> View : 10 return (resumenSync)
deactivate Ctrl
View --> Cajero : 11 Muestra total de ventas sincronizadas
deactivate View
@enduml""",

# CU10
"""@startuml
hide footbox
skinparam monochrome true
skinparam shadowing false
title CU10. Administrar Inventario Global

actor "Admin Global" as Admin
participant "Vista (Inventario)\\n<<boundary>>" as View
participant "Controller (Inventario)\\n<<control>>" as Ctrl
participant "Model (Product)\\n<<entity>>" as ProductModel
participant "Model (InventoryStock)\\n<<entity>>" as StockModel

Admin -> View : 1 Ingresa datos de prenda, variantes y stock
activate View
View -> Ctrl : 2 registrarNuevoProducto(productoData, variantes)
activate Ctrl
Ctrl -> ProductModel : 3 guardarProductoMaestro(nombre, categoria, marca)
activate ProductModel
ProductModel --> Ctrl : 4 return (productId)
deactivate ProductModel
Ctrl -> StockModel : 5 inicializarStockSucursales(productId, variantes)
activate StockModel
StockModel --> Ctrl : 6 return (stockRegistrado)
deactivate StockModel
Ctrl -> Ctrl : 7 registrarMovimientoAuditoria(PURCHASE)
Ctrl --> View : 8 return (productoCreadoExitoso)
deactivate Ctrl
View --> Admin : 9 Actualiza tabla de catálogo e inventario
deactivate View
@enduml""",

# CU11
"""@startuml
hide footbox
skinparam monochrome true
skinparam shadowing false
title CU11. Generar Reportes Gerenciales con IA

actor "Admin Global" as Admin
participant "Vista (Dashboard IA)\\n<<boundary>>" as View
participant "Controller (Reportes)\\n<<control>>" as Ctrl
participant "Servicio (FastAPI IA)\\n<<external>>" as AI
participant "Model (Prisma Metrics)\\n<<entity>>" as PrismaModel

Admin -> View : 1 Dicta consulta en lenguaje natural (voz/texto)
activate View
View -> Ctrl : 2 procesarConsultaReporte(promptTexto, audioBlob)
activate Ctrl
Ctrl -> AI : 3 parseQueryReporte(prompt)
activate AI
AI -> AI : 4 interpretarPromptLLM()
AI --> Ctrl : 5 return (queryJSONEstructurado)
deactivate AI
Ctrl -> PrismaModel : 6 ejecutarConsultaSegura(metricas, filtros, fecha)
activate PrismaModel
PrismaModel --> Ctrl : 7 return (datasetResultados)
deactivate PrismaModel
Ctrl --> View : 8 return (datosGrafico, chartSuggestion, resumenIA)
deactivate Ctrl
View --> Admin : 9 Renderiza dashboard dinámico en Recharts
deactivate View
@enduml""",

# CU12
"""@startuml
hide footbox
skinparam monochrome true
skinparam shadowing false
title CU12. Gestionar Sucursales

actor "Admin Global" as Admin
participant "Vista (Sucursales)\\n<<boundary>>" as View
participant "Controller (Sucursales)\\n<<control>>" as Ctrl
participant "Model (Branch)\\n<<entity>>" as BranchModel
participant "Model (WarehouseLocation)\\n<<entity>>" as LocationModel

Admin -> View : 1 Ingresa datos de sucursal, ciudad y geolocalización
activate View
View -> Ctrl : 2 registrarSucursal(nombre, direccion, cityId, coords)
activate Ctrl
Ctrl -> BranchModel : 3 crearSucursal(datosSucursal)
activate BranchModel
BranchModel --> Ctrl : 4 return (branchId)
deactivate BranchModel
Ctrl -> LocationModel : 5 inicializarAlmacenYPisoVenta(branchId)
activate LocationModel
LocationModel --> Ctrl : 6 return (ubicacionesCreadas)
deactivate LocationModel
Ctrl --> View : 7 return (sucursalRegistrada)
deactivate Ctrl
View --> Admin : 8 Muestra nueva sucursal en mapa y lista
deactivate View
@enduml""",

# CU13
"""@startuml
hide footbox
skinparam monochrome true
skinparam shadowing false
title CU13. Gestionar Usuarios y Roles

actor "Admin Global" as Admin
participant "Vista (Usuarios/RBAC)\\n<<boundary>>" as View
participant "Controller (RBAC)\\n<<control>>" as Ctrl
participant "Model (UserRole)\\n<<entity>>" as RBACModel

Admin -> View : 1 Selecciona usuario y asigna rol/permisos
activate View
View -> Ctrl : 2 actualizarRolesUsuario(userId, roleId, permisos)
activate Ctrl
Ctrl -> Ctrl : 3 validarJerarquiaAdmin()
Ctrl -> RBACModel : 4 asignarRolYPermisos(userId, roleId, permisos)
activate RBACModel
RBACModel --> Ctrl : 5 return (asignacionOK)
deactivate RBACModel
Ctrl --> View : 6 return (permisosActualizados)
deactivate Ctrl
View --> Admin : 7 Muestra notificación de actualización RBAC
deactivate View
@enduml""",

# CU14
"""@startuml
hide footbox
skinparam monochrome true
skinparam shadowing false
title CU14. Cerrar Sesión

actor "Usuario" as User
participant "Vista (Navbar)\\n<<boundary>>" as View
participant "Controller (Sesión)\\n<<control>>" as Ctrl
participant "Model (TokenJWT)\\n<<entity>>" as TokenModel

User -> View : 1 Clic en "Cerrar Sesión"
activate View
View -> Ctrl : 2 cerrarSesion(refreshToken)
activate Ctrl
Ctrl -> TokenModel : 3 revocarToken(refreshToken)
activate TokenModel
TokenModel --> Ctrl : 4 return (tokenRevocado)
deactivate TokenModel
Ctrl -> Ctrl : 5 auditarCierreSesion(userId)
Ctrl --> View : 6 return (logoutExitoso)
deactivate Ctrl
View -> View : 7 limpiarLocalStorageYTokens()
View --> User : 8 Redirige a pantalla de Login
deactivate View
@enduml"""
]

for idx, code in enumerate(seq_all):
    url = plantuml_url(code)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        r = urllib.request.urlopen(req)
        print(f"CU{idx+1:02d} Sequence: SUCCESS (bytes={len(r.read())})")
    except Exception as e:
        print(f"CU{idx+1:02d} Sequence: ERROR {e}")
