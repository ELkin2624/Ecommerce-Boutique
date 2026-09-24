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

all_diagrams = """@startuml FashionStore_333_Clases_Entidad
allowmixing
hide circle
skinparam monochrome true
skinparam shadowing false

' CU01
actor "Cliente" as C1_A
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
C1_A -r- RegistroView
RegistroView -r- RegistroController
RegistroController -r- User

newpage
' CU02
actor "Usuario" as C2_A
class LoginView {
  +emailInput: string
  +passwordInput: string
  +rememberMe: bool
  __
  +mostrarLogin(): void
  +enviarCredenciales(): void
  +guardarTokensStorage(): void
  +mostrarErrorAuth(msg: str): void
}
class AuthController {
  +validarCredenciales(): bool
  +verificarHashArgon2(): bool
  +generarAccessToken(): string
  +generarRefreshToken(): string
}
class User {
  +id: uuid
  +email: string
  +password_hash: string
  +roles: list
  +last_login: datetime
  __
  +verificarPassword(): bool
  +actualizarUltimoLogin(): bool
  +obtenerRolesPermisos(): list
}
C2_A -r- LoginView
LoginView -r- AuthController
AuthController -r- User

newpage
' CU03
actor "Cliente" as C3_A
class CatalogoView {
  +filtroCategoria: string
  +filtroTalla: string
  +filtroPrecio: float
  +sucursalSeleccionada: uuid
  __
  +renderizarGrid(): void
  +aplicarFiltros(): void
  +mostrarRecomendacionesIA(): void
  +verDetallePrenda(): void
}
class CatalogoController {
  +obtenerProductos(): list
  +solicitarRecomendacionFastAPI(): dict
  +filtrarPorSucursal(): list
  +calcularDescuentos(): list
}
class ProductVariant {
  +id: uuid
  +product_id: uuid
  +sku: string
  +color: string
  +size: string
  +price: decimal
  +stock_actual: int
  __
  +consultarVariantes(): list
  +verificarDisponibilidad(): bool
  +obtenerGaleriaFotos(): list
}
C3_A -r- CatalogoView
CatalogoView -r- CatalogoController
CatalogoController -r- ProductVariant

newpage
' CU04
actor "Cliente" as C4_A
class ProbadorARView {
  +cameraStream: Stream
  +prendaSeleccionadaId: uuid
  +landmarksPose: list
  __
  +iniciarCameraVision(): void
  +renderizarOverlaySkia(): void
  +capturarMedidasUsuario(): dict
  +mostrarCalceTalla(): void
}
class ProbadorARController {
  +detectarPoseMediaPipe(): dict
  +consultarFittingFastAPI(): dict
  +ajustarEscalaPrenda(): Matrix
  +estimarTallaRecomendada(): string
}
class PrendaFitting {
  +variant_id: uuid
  +measurements_json: dict
  +asset_3d_url: string
  +fit_tolerance: float
  __
  +cargarTablaMedidas(): dict
  +calcularScoreCalce(): float
  +obtenerModeloVisual(): binary
}
C4_A -r- ProbadorARView
ProbadorARView -r- ProbadorARController
ProbadorARController -r- PrendaFitting

newpage
' CU05
actor "Cliente" as C5_A
class ReservaModalView {
  +itemsSeleccionados: list
  +sucursalId: uuid
  +fechaHora: datetime
  +notaAdicional: string
  __
  +abrirModalReserva(): void
  +confirmarReserva(): void
  +mostrarEstadoVestidor(): void
  +descargarTicketQR(): void
}
class ReservationController {
  +validarDisponibilidadVestidor(): bool
  +crearReserva(): dict
  +retenerStockTemporal(): bool
  +notificarSucursalWebSocket(): void
}
class Reservation {
  +id: uuid
  +user_id: uuid
  +branch_id: uuid
  +status: enum
  +expires_at: datetime
  +qr_code: string
  __
  +guardarReserva(): bool
  +cambiarEstado(): bool
  +liberarStockExpirado(): bool
}
C5_A -r- ReservaModalView
ReservaModalView -r- ReservationController
ReservationController -r- Reservation

newpage
' CU06
actor "Cliente" as C6_A
class CheckoutView {
  +cartId: uuid
  +stripeToken: string
  +direccionEnvio: string
  +totalAPagar: decimal
  __
  +mostrarResumenCompra(): void
  +capturarTarjetaStripe(): void
  +procesarCheckout(): void
  +mostrarComprobante(): void
}
class PaymentOnlineController {
  +crearPaymentIntentStripe(): dict
  +confirmarTransaccion(): bool
  +generarOrdenOnline(): dict
  +enviarReciboCorreo(): void
}
class Order {
  +id: uuid
  +user_id: uuid
  +type: enum
  +status: enum
  +total: decimal
  +payment_ref: string
  __
  +crearOrden(): bool
  +asociarPago(): bool
  +actualizarEstadoPago(): bool
}
C6_A -r- CheckoutView
CheckoutView -r- PaymentOnlineController
PaymentOnlineController -r- Order

newpage
' CU07
actor "Encargado de Sucursal" as C7_A
class PanelReservasPOSView {
  +alertaReservaActiva: dict
  +vestidorSeleccionado: int
  +filtroEstado: string
  __
  +escucharWebSockets(): void
  +mostrarNotificacion(): void
  +marcarVestidorListo(): void
  +verDetallePrendas(): void
}
class ReservationPOSController {
  +recepcionarEventoWS(): void
  +asignarVestidorFisico(): bool
  +actualizarEstadoPreparado(): dict
  +notificarClienteListo(): void
}
class Reservation {
  +id: uuid
  +branch_id: uuid
  +fitting_room_no: int
  +status: enum
  +items_reserved: list
  __
  +actualizarEstado(): bool
  +asignarVestidor(): bool
  +consultarPendientes(): list
}
C7_A -r- PanelReservasPOSView
PanelReservasPOSView -r- ReservationPOSController
ReservationPOSController -r- Reservation

newpage
' CU08
actor "Cajero" as C8_A
class TerminalPOSView {
  +codigoBarraInput: string
  +metodoPago: enum
  +montoRecibido: decimal
  +nitCliente: string
  __
  +escanearProducto(): void
  +calcularTotal(): void
  +ejecutarCobro(): void
  +imprimirFactura(): void
}
class VentaPOSController {
  +procesarVentaTienda(): dict
  +descontarStockFisico(): bool
  +generarFacturaSIN(): dict
  +emitirComprobante(): binary
}
class Order {
  +id: uuid
  +branch_id: uuid
  +cashier_id: uuid
  +total: decimal
  +tipo_pago: string
  +nro_factura: string
  __
  +registrarVentaPresencial(): bool
  +descontarInventario(): bool
  +generarCodigoControl(): string
}
C8_A -r- TerminalPOSView
TerminalPOSView -r- VentaPOSController
VentaPOSController -r- Order

newpage
' CU09
actor "Cajero" as C9_A
class SyncOfflineView {
  +estadoConexion: bool
  +totalPendientesSync: int
  +ultimoSyncTimestamp: datetime
  __
  +detectarConectividad(): void
  +mostrarBadgePendientes(): void
  +iniciarSincronizacionManual(): void
  +mostrarLogSync(): void
}
class SyncOfflineController {
  +leerTransaccionesSQLite(): list
  +enviarLoteANestJS(): dict
  +resolverConflictosStock(): bool
  +purgarOutboxLocal(): void
}
class OutboxTransaction {
  +id: uuid
  +payload_json: dict
  +sync_status: enum
  +created_at: datetime
  +retry_count: int
  __
  +obtenerPendientes(): list
  +marcarSincronizado(): bool
  +registrarFallo(): void
}
C9_A -r- SyncOfflineView
SyncOfflineView -r- SyncOfflineController
SyncOfflineController -r- OutboxTransaction

newpage
' CU10
actor "Admin Global" as C10_A
class InventarioPanel {
  +productoNombre: string
  +categoriaId: uuid
  +skuInput: string
  +sucursalDestino: uuid
  __
  +mostrarTablaStock(): void
  +abrirModalProducto(): void
  +guardarPrenda(): void
  +ejecutarTransferencia(): void
}
class InventoryController {
  +crearProductoConVariantes(): dict
  +actualizarStockAlmacen(): bool
  +transferirEntreSucursales(): dict
  +registrarAuditoriaMovimiento(): void
}
class Product {
  +id: uuid
  +name: string
  +brand: string
  +category_id: uuid
  +is_active: bool
  +variants: list
  __
  +guardarProducto(): bool
  +actualizarDatos(): bool
  +listarConStock(): list
}
C10_A -r- InventarioPanel
InventarioPanel -r- InventoryController
InventoryController -r- Product

newpage
' CU11
actor "Admin Global" as C11_A
class ReportesIADashboard {
  +promptTexto: string
  +audioGrabado: blob
  +tipoGrafico: enum
  +rangoFechas: dict
  __
  +capturarVozMicrofono(): void
  +enviarConsultaNL(): void
  +renderizarRecharts(): void
  +exportarReportePDF(): void
}
class ReportsAIController {
  +transcribirVozSTT(): string
  +consultarFastAPILLM(): dict
  +ejecutarQueryPrisma(): list
  +generarResumenGerencial(): dict
}
class ReporteMetricas {
  +query_json: dict
  +metric: string
  +data_points: list
  +generated_at: datetime
  +summary_text: string
  __
  +construirDataset(): list
  +almacenarHistorialReporte(): bool
  +validarFiltrosSeguros(): bool
}
C11_A -r- ReportesIADashboard
ReportesIADashboard -r- ReportsAIController
ReportsAIController -r- ReporteMetricas

newpage
' CU12
actor "Admin Global" as C12_A
class SucursalesPanel {
  +nombreSucursal: string
  +direccion: string
  +ciudadId: uuid
  +coordenadasLatLong: string
  __
  +mostrarListaSucursales(): void
  +abrirModalSucursal(): void
  +guardarSucursal(): void
  +verMapaGeolocalizacion(): void
}
class BranchController {
  +crearSucursal(): dict
  +inicializarAlmacenYPiso(): bool
  +actualizarCoordenadas(): bool
  +listarSucursalesActivas(): list
}
class Branch {
  +id: uuid
  +city_id: uuid
  +name: string
  +address: string
  +phone: string
  +lat_long: string
  __
  +guardar(): bool
  +obtenerConAlmacenes(): dict
  +desactivarSucursal(): bool
}
C12_A -r- SucursalesPanel
SucursalesPanel -r- BranchController
BranchController -r- Branch

newpage
' CU13
actor "Admin Global" as C13_A
class UsuariosRolesPanel {
  +usuarioId: uuid
  +rolSeleccionado: string
  +permisosAsignados: list
  --
  +mostrarMatrizUsuarios(): void
  +abrirModalRoles(): void
  +asignarRolUsuario(): void
  +revocarPermiso(): void
}
class UsersRolesController {
  +asignarRolRBAC(): bool
  +actualizarPermisos(): bool
  +listarRolesYPermisos(): list
  +verificarJerarquia(): bool
}
class UserRole {
  +user_id: uuid
  +role_id: uuid
  +resource_action: string
  +assigned_at: datetime
  __
  +vincularRol(): bool
  +obtenerPermisosUsuario(): list
  +removerRol(): bool
}
C13_A -r- UsuariosRolesPanel
UsuariosRolesPanel -r- UsersRolesController
UsersRolesController -r- UserRole

newpage
' CU14
actor "Usuario" as C14_A
class NavbarView {
  +usuarioActivoId: uuid
  +sesionEstado: bool
  __
  +mostrarBotonLogout(): void
  +ejecutarLogout(): void
  +limpiarLocalStorage(): void
  +redirigirLogin(): void
}
class SessionController {
  +invalidarRefreshToken(): bool
  +revocarSesionRedis(): bool
  +auditarCierreSesion(): void
}
class TokenJWT {
  +token_id: string
  +user_id: uuid
  +is_revoked: bool
  +expires_at: datetime
  __
  +marcarRevocado(): bool
  +verificarEstadoToken(): bool
}
C14_A -r- NavbarView
NavbarView -r- SessionController
SessionController -r- TokenJWT

@enduml"""

url = plantuml_url(all_diagrams)
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    resp = urllib.request.urlopen(req)
    print("ALL DIAGRAMS SUCCESS! HTTP Status:", resp.getcode(), "Bytes:", len(resp.read()))
except Exception as e:
    print("ALL DIAGRAMS ERROR:", e)
