# MANUAL DE USUARIO
## PLATAFORMA E-COMMERCE OMNICANAL FASHIONSTORE SAAS MULTITENANT

> **Documento:** Manual Oficial de Operación y Procedimientos de Usuario  
> **Fecha de Publicación:** 23 de septiembre de 2026 | **Versión:** 2.1 (Producción - Ciclo 2)  
> **Metodología y Estándar:** ICONIX Process / OMG UML 2.5.1  
> **Clasificación:** Guía Operativa de Usuario Final y Administrativo  

---

## RESUMEN EJECUTIVO

El presente manual describe de manera integral el funcionamiento operativo, procedimientos y buenas prácticas para la plataforma **FashionStore**, una solución omnicanal de comercio electrónico inteligente bajo modelo de software como servicio (*SaaS Multitenant*). La plataforma articula capacidades avanzadas de Realidad Aumentada (*AR Try-On* para probador virtual en dispositivos móviles), reservas de probadores físicos en tiendas presenciales con sincronización bidireccional en tiempo real, gestión de inventarios multialmacén con consistencia transaccional ACID, un Punto de Venta físico (*POS*) resiliente con capacidad de facturación desconectada (*Offline-First*) y un motor de analítica empresarial en lenguaje natural potenciado por Inteligencia Artificial generativa (**ReportIQ**).

### Matriz de Roles y Alcance de Acceso (RBAC)

La plataforma gobierna las acciones de sus usuarios mediante un modelo estricto de control de acceso basado en roles (*Role-Based Access Control*, RBAC):

| Rol de Usuario | Entorno Principal | Alcance y Responsabilidades Principales |
| :--- | :--- | :--- |
| **Propietario / Administrador SaaS (`OWNER`)** | Portal Web Administrativo | Gestión integral de tiendas (*tenants*), control de cuotas y límites de suscripción, catálogo maestro global, configuración de pasarelas de pago y consultas analíticas con IA. |
| **Encargado de Sucursal (`MANAGER`)** | Portal Web / Tablet de Tienda | Monitor de probadores en tiempo real, recepción y preparación física de prendas reservadas, control de inventario local y asignación de cabinas. |
| **Cajero / Operador POS (`CASHIER`)** | Terminal Web Punto de Venta | Facturación en mostrador, lectura de códigos de barra, cobros en efectivo/QR/tarjeta, emisión de comprobantes y operación en modo *offline*. |
| **Cliente Final (`CLIENT`)** | Aplicación Móvil / Web Storefront | Navegación de catálogo, prueba de prendas en Realidad Aumentada (AR), recomendación biométrica de tallas, reservas en sucursal y compras online. |

---

## 1. PRIMEROS PASOS Y ACCESO A LA PLATAFORMA

### 1.1. Registro de Nuevos Clientes
1. Ingrese a la dirección web de la tienda o abra la aplicación móvil **FashionStore** en su dispositivo Android o iOS.
2. En la barra superior de navegación (o en la pantalla de bienvenida móvil), pulse sobre el botón **"Registrarse"**.
3. Complete los campos requeridos en el formulario:
   * **Nombre y Apellidos:** Identificación personal del titular.
   * **Correo Electrónico:** Dirección corporativa o personal que fungirá como identificador único de cuenta.
   * **Contraseña:** Clave de seguridad (mínimo 8 caracteres, al menos una mayúscula, un número y un carácter especial `# $ % &`).
4. Acepte los Términos de Servicio y la Política de Privacidad de Datos.
5. Al presionar **"Crear Cuenta"**, el sistema autenticará inmediatamente la sesión emitiendo un token de seguridad cifrado (JWT), permitiéndole comenzar a comprar y utilizar el probador virtual sin demoras.

> [!NOTE]
> Para el registro de nuevas marcas comerciales o empresas que deseen operar bajo el modelo SaaS, el registro se efectúa desde la opción **"Registrar Mi Marca / Crear Tienda"**, la cual inicializa el aprovisionamiento automatizado del esquema dedicado en PostgreSQL.

---

### 1.2. Inicio de Sesión y Autenticación Unificada
1. Seleccione **"Iniciar Sesión"** en la esquina superior derecha del portal o en la pantalla de bienvenida móvil.
2. Ingrese su correo electrónico y contraseña registrados.
3. El sistema valida las credenciales y, en función del rol asignado a su cuenta:
   * **Clientes:** Son dirigidos al escaparate comercial (*Storefront*) con su carrito y preferencias sincronizadas.
   * **Cajeros:** Son redirigidos automáticamente a la terminal de Punto de Venta (**POS**) de su sucursal autorizada.
   * **Encargados de Sucursal:** Son dirigidos a la consola del **Monitor de Probadores**.
   * **Administradores:** Acceden al panel gerencial con métricas de ventas y configuración de tienda.

---

### 1.3. Exploración del Entorno de Trabajo

#### A. Barra de Navegación y Selector de Tienda (*Store Switcher*)
Ubicada en el encabezado de la aplicación administrativa. Permite a los usuarios corporativos que administran múltiples marcas alternar la tienda activa con un solo clic. Al seleccionar una nueva marca, el sistema actualiza de inmediato el encabezado de red `X-Tenant-Slug` y reconfigura las vistas sin necesidad de cerrar sesión.

#### B. Catálogo Interactivo y Filtros Multifacéticos
Permite localizar prendas con extrema rapidez mediante filtros combinados:
* **Categorías y Colecciones:** Filtrado por Mujer, Hombre, Infantil, Temporada (Primavera/Verano, Otoño/Invierno).
* **Filtros Físicos:** Talla (XS a XL), color, rango de precios y tipo de tela.
* **Disponibilidad en Tienda Física:** Permite filtrar exclusivamente las prendas que cuentan con stock inmediato en la sucursal seleccionada para retiro o prueba presencial.

#### C. Monitor de Conectividad (Online / Offline Badge)
En la esquina superior derecha se muestra un indicador visual en tiempo real:
* 🟢 **EN LÍNEA:** Conexión activa a Internet y canal WebSocket sincronizado con la nube.
* 🔴 **MODO OFFLINE:** Pérdida de conexión a Internet detectada. La terminal activa el almacenamiento local de respaldo en IndexedDB (Dexie.js).

---

## 2. GUÍA OPERATIVA PASO A PASO POR ROL

### 2.1. Para el Administrador Global: Catálogo y Reportes con IA

```
[Administrador Global]
       │
       ├─► Catálogo Maestro ──► Alta de Producto ──► Definir SKUs / Tallas / Color ──► Medidas AR (JSON)
       │
       ├─► Administración SaaS ──► Gestión de Tiendas ──► Control de Límites (Starter / Pro / Enterprise)
       │
       └─► ReportIQ (IA) ──► Consulta en Lenguaje Natural ──► Validación Pydantic ──► Gráficos Interactivos
```

#### A. Creación y Parametrización de Productos y Variantes
1. En el menú lateral izquierdo, diríjase a **Catálogo $\rightarrow$ Productos** y haga clic en **"+ Nuevo Producto"**.
2. Complete la ficha técnica básica:
   * **Nombre del Producto:** Denominación comercial (ej. *Vestido Lino Fiesta*).
   * **Descripción:** Composición textil, instrucciones de lavado y detalles de diseño.
   * **Categoría y Marca:** Asigne la línea correspondiente.
   * **Galería Fotográfica:** Cargue las imágenes en formato WebP de alta resolución (se alojarán en AWS S3 y se servirán optimizadas mediante Amazon CloudFront).
3. En la sección **Variantes e Inventario (SKUs)**, configure cada combinación comercial:
   * Defina la **Talla** (S, M, L, XL) y el **Color** (ej. Azul Marino).
   * Asigne el **Precio de Venta al Público**, el **Costo de Adquisición** y el código de barras único (**EAN-13 / SKU**).
   * **Parámetros Antropométricos para Probador AR (`measurementsJson`):** Introduzca las dimensiones clave de la prenda (ancho de hombros en cm, contorno de pecho y largo total). Estos valores permiten que el motor de Visión en la app móvil calcule la recomendación exacta de talla al medir al cliente frente a la cámara.
4. Presione **"Guardar Producto"**. Las variantes quedarán habilitadas de forma instantánea en la tienda web, la app móvil y las terminales de caja.

#### B. Consultas Gerenciales mediante Asistente de IA (ReportIQ)
1. Navegue al módulo **Reportes IA** en la barra lateral.
2. En la barra de comandos analíticos, escriba o dicte por voz su consulta ejecutiva. Ejemplos de uso:
   * *"¿Cuáles fueron las 5 prendas más vendidas del último mes en la Sucursal Central?"*
   * *"Compara la facturación entre pagos con tarjeta y efectivo durante la última semana."*
   * *"Muestra el listado de productos que tienen menos de 5 unidades en stock."*
3. Presione el botón **"Consultar con IA"** (o presione `Enter`).
4. **Respuesta del Sistema:** En menos de 2 segundos, el motor **ReportIQ** (orquestado en FastAPI con Google Gemini 1.5 Flash y validado contra esquemas estrictos de Pydantic v2) interpretará los parámetros, consultará el esquema de su tienda y desplegará un tablero interactivo con gráficos de barras, líneas o circulares (Recharts), acompañado de un resumen ejecutivo sintetizado.

> [!TIP]
> Puede exportar los resultados generados por el asistente de IA en formatos PDF y hojas de cálculo CSV para sus reuniones de directorio o auditorías contables.

---

### 2.2. Para el Encargado de Sucursal: Gestión de Probadores Físicos

```
[App Móvil Cliente]                   [Consola de Sucursal (Tablet)]
       │                                            │
       │─── 1. Solicita Reserva de Probador ───────►│ (Alerta Sonora WebSocket)
       │                                            │
       │                                            ├── 2. Encargado busca prendas
       │                                            └── 3. Marca: "PREPARADO"
       │                                                         │
       │◄── 4. Notificación al Cliente: "Tu ropa está lista" ───┘
       │
       │─── 5. Cliente llega a tienda y muestra Código QR/PIN ──►│
       │                                                         │
       │                                                         └── 6. Asigna: "CABINA 03"
```

El módulo de probadores físicos erradica las filas de espera y conecta la experiencia digital con la tienda presencial. El encargado opera desde una tableta ubicada en la zona de vestidores:

1. **Monitoreo en Tiempo Real:** Mantenga abierta la vista **"Monitor de Probadores"**. La consola está conectada mediante WebSockets seguros (WSS en puerto 3001), por lo que las solicitudes aparecen instantáneamente sin necesidad de recargar la página.
2. **Recepción de Solicitud:** Al sonar la notificación acústica de nueva reserva, aparecerá una tarjeta en la columna **"Pendiente"** con el nombre del cliente, la hora solicitada y los SKUs seleccionados.
3. **Apartado Físico de Prendas:**
   * Pulse sobre la tarjeta para ver las imágenes y ubicaciones de pasillo de las prendas.
   * Recoja las prendas del piso de venta o almacén.
   * Presione el botón **"Marcar como Preparado"**. En ese instante, la tarjeta se mueve a la columna correspondiente y el cliente recibe una notificación automática en su teléfono móvil indicándole que sus prendas ya están listas en la tienda.
4. **Llegada del Cliente y Asignación de Cabina:**
   * Al presentarse el cliente en la entrada de vestidores, solicite su código de reserva (PIN de 4 dígitos o código QR emitido en su app).
   * Escanee el código o introduzca el PIN en la pantalla.
   * Seleccione una cabina disponible (ej. *Cabina 02*) y presione **"Ingresar a Probador"**.
5. **Finalización del Servicio:** Cuando el cliente concluye la prueba, pulse **"Finalizar"**. Si el cliente decide adquirir las prendas, el sistema permite transferir la reserva directamente al Punto de Venta (POS) para un cobro inmediato sin tener que reescanear los productos.

---

### 2.3. Para el Cajero: Ventas en Punto de Venta (POS) y Resiliencia Offline

```
[Cajero en Terminal POS]
       │
       ├─► Búsqueda por Lector de Código de Barras / SKU / Nombre
       │
       ├─► Selección de Pago: Efectivo (Cambio automático) / QR Interoperable / Tarjeta
       │
       ├─► ¿Hay Conexión a Internet?
       │        │
       │        ├─► SÍ ──► Venta centralizada inmediata en PostgreSQL ──► Ticket Oficial
       │        │
       │        └─► NO ──► Guarda en IndexedDB (Dexie.js) ──► Emite Ticket Provisional (#OFF-)
       │                     │
       │                     └── (Al reconectar red) ──► Sincronización automática idempotente
```

La interfaz del Punto de Venta está optimizada para operaciones táctiles y de alta velocidad en mostrador:

1. **Apertura de Caja:** Al inicio del turno, introduzca el monto de fondo inicial en efectivo y confirme la apertura.
2. **Carga de Artículos al Carrito:**
   * Escanee el código de barras de la prenda con el lector óptico, o escriba el nombre o código SKU en el buscador rápido.
   * Para ajustar cantidades, pulse sobre los botones `+` o `-` en la línea del producto.
3. **Liquidación y Selección del Método de Pago:**
   Presione el botón **"Cobrar"** y elija la modalidad convenida con el cliente:
   * **Efectivo:** Digite la cantidad de dinero entregada por el comprador. El sistema calculará automáticamente el cambio en pantalla grande para evitar errores humanos.
   * **Pago QR:** El sistema genera en pantalla un código QR interoperable y dinámico asociado al importe exacto de la venta. El cliente escanea con su aplicación bancaria y la confirmación se refleja automáticamente en la pantalla de cobro.
   * **Tarjeta de Débito/Crédito:** Procesamiento seguro mediante terminal bancaria integrada o pasarela Stripe.
4. **Emisión de Comprobante:** Presione **"Confirmar Venta"**. La impresora térmica emitirá el ticket de compra y el stock de las prendas se descontará inmediatamente del inventario central.

#### Operación en Contingencia sin Internet (Modo Offline-First)
Si la conexión a Internet en la sucursal se interrumpe, el sistema garantiza **continuidad operativa total**:
* La barra superior mostrará el badge rojo **`MODO OFFLINE / SIN CONEXIÓN`**.
* **El cobro en efectivo no se detiene:** Puede seguir escaneando productos y cobrando en efectivo con normalidad.
* **Persistencia Local Segura:** La venta se almacena inmediatamente en la base de datos interna del navegador (IndexedDB gobernada por Dexie.js) con estado `PENDING` y una clave única de idempotencia.
* **Ticket Provisional:** Se imprimirá un ticket oficial de contingencia con el prefijo identificador **`#OFF-<UUID>`**.
* **Sincronización Automática al Reconectar:** Cuando el enlace a Internet se restablece, el motor de sincronización despacha en segundo plano las ventas encoladas hacia el servidor.
* **Resolución de Conflictos (*PosSyncModal*):** Si durante el tiempo de desconexión otra caja física o la tienda web agotó la última unidad de una prenda, el sistema activa la regla *Server-Wins* y despliega en pantalla el modal **PosSyncModal**, alertando al supervisor para que efectúe el ajuste físico o la devolución correspondiente sin alterar el balance de caja.

---

### 2.4. Para el Cliente Final: Probador Virtual AR y Reserva Omnicanal

```
[Cliente en App Móvil]
       │
       ├─► Seleccionar Prenda en Catálogo ──► Botón "Probador Virtual AR"
       │
       ├─► Calibración de Cámara (2 metros, cuerpo completo) ──► Detección de Pose (33 Puntos)
       │
       ├─► Análisis Biométrico ──► Recomendación de Talla: "Talla M (Ajuste 94%)"
       │
       ├─► Superposición Textil en Tiempo Real (Shopify Skia a 60 FPS)
       │
       └─► Decisión de Compra:
                 │
                 ├─► Comprar en línea con envío a domicilio (Stripe / Tarjeta)
                 │
                 └─► "Reservar en Sucursal" ──► Elige Tienda y Horario ──► Genera Código PIN
```

1. **Acceso al Probador Virtual:** Abra la app móvil **FashionStore**, explore el catálogo y pulse sobre cualquier prenda que cuente con el distintivo **"Probador AR"**.
2. **Activación de la Cámara:**
   * Pulse el botón **"Probarme esta Prenda"**.
   * Conceda permiso de acceso a la cámara de su dispositivo si es la primera vez que utiliza la función.
3. **Calibración Anatómica y Detección de Silueta:**
   * Ubique el teléfono a la altura del pecho o apóyelo en una superficie fija, colocándose a una distancia de aproximadamente 2 metros para que su silueta sea visible de cuerpo entero.
   * El algoritmo de visión computacional local (*Vision Camera + TensorFlow Lite*) detectará los 33 puntos anatómicos corporales en menos de 15 milisegundos.
4. **Recomendación Inteligente de Talla:**
   * El sistema calcula la distancia euclidiana entre sus hombros y cadera, contrastándola con las medidas técnicas (`measurementsJson`) cargadas por el fabricante.
   * La pantalla desplegará la recomendación automática:  
     *`"Talla Recomendada: M (Ajuste Óptimo 94%)"`*.
5. **Superposición Textil en Realidad Aumentada:**
   * El lienzo gráfico acelerado por GPU (*Shopify Skia*) proyectará la textura digital de la prenda adaptada a su contorno corporal a 60 cuadros por segundo, permitiéndole observar cómo luce el corte y largo al moverse o girar frente a la cámara.
6. **Reserva Omnicanal para Prueba Física:**
   * Si desea sentir la textura y probarse la ropa físicamente antes de pagar, pulse **"Reservar en Sucursal"**.
   * Elija la tienda física más cercana y seleccione el horario de su visita.
   * El sistema retendrá temporalmente la prenda en el stock central y le entregará un **Código de Reserva (PIN / QR)** para presentarlo en la tienda.

---

## 3. PREGUNTAS FRECUENTES (FAQ)

#### P1: ¿Qué sucede si un cliente no asiste a su cita de probador físico en la sucursal?
**R:** Todas las reservas en tienda cuentan con una ventana temporal de tolerancia parametrizable en el sistema (`expires_at`, configurada típicamente en 2 horas). Al transcurrir dicho lapso sin que el cliente haya ingresado a la cabina, el servidor ejecuta una tarea en segundo plano que cambia el estado de la reserva a `EXPIRED` y libera automáticamente las prendas retenidas, reintegrándolas al stock comercial disponible de la tienda física y digital.

#### P2: ¿El probador virtual por Realidad Aumentada transmite o almacena fotos de mi cuerpo en servidores externos?
**R:** **No, de forma categórica.** Siguiendo estrictos principios internacionales de privacidad biométrica y diseño seguro (*Privacy by Design*), todo el procesamiento de visión computacional y detección de silueta se ejecuta de manera 100% local en la memoria de trabajo de su teléfono inteligente. El flujo de video de la cámara jamás es grabado, transmitido ni almacenado en bases de datos externas o en la nube.

#### P3: ¿Puedo seguir cobrando en la caja del Punto de Venta si el proveedor de Internet sufre una avería prolongada?
**R:** **Sí.** El Punto de Venta de FashionStore opera bajo una arquitectura de resiliencia desconectada (*Offline-First*). Las ventas en efectivo se registran localmente en el navegador mediante el motor Dexie.js (IndexedDB) y se imprimen con comprobantes provisionales `#OFF-`. En el momento en que el servicio de Internet se restablece, el sistema sincroniza automáticamente todas las transacciones acumuladas en orden cronológico sin requerir intervención manual.

#### P4: ¿Cómo garantiza la plataforma que no existan cobros duplicados con tarjeta si ocurre un corte de red durante el pago?
**R:** El sistema aplica claves universales de idempotencia criptográfica (`idempotencyKey`) generadas de forma única por cada transacción de cobro. Si la red se corta y la terminal reintenta la petición, el backend reconoce la clave ya procesada en Stripe o en el servidor central y devuelve el recibo exitoso original sin efectuar un segundo cargo económico al cliente.

#### P5: ¿Cómo puede un administrador cambiar de una tienda a otra si gestiona múltiples marcas comerciales?
**R:** El administrador no necesita cerrar sesión. Simplemente debe pulsar sobre el selector de tienda (*Store Switcher*) ubicado en la barra superior y elegir la marca deseada. El sistema reconfigura el contexto de inquilino (`X-Tenant-Slug`), purga las memorias temporales y carga el catálogo y balance contable de la nueva tienda en menos de 200 milisegundos.

---

## 4. CATÁLOGO DE MENSAJES DE ERROR, DIAGNÓSTICO Y ACCIONES CORRECTIVAS

La siguiente tabla resume los mensajes de advertencia y error más comunes emitidos por la plataforma, detallando su origen técnico y el procedimiento de solución recomendado para los operadores:

<br>

**Tabla 13**  
*Guía de Resolución de Mensajes de Error de la Plataforma FashionStore*

| Mensaje de Error en Pantalla | Causa Probable | Procedimiento de Acción Sugerido |
| :--- | :--- | :--- |
| **"Stock insuficiente para la variante seleccionada"** | Otra caja física o cliente web completó una compra simultánea sobre la última unidad disponible en inventario. | Seleccionar otra talla/color del producto, o cambiar la sucursal asignada para el retiro de la prenda. |
| **"Permiso de cámara denegado para Probador AR"** | La aplicación móvil no cuenta con la autorización del sistema operativo para acceder al sensor de la cámara. | Ingresar a los *Ajustes* del dispositivo $\rightarrow$ *Aplicaciones* $\rightarrow$ *FashionStore* $\rightarrow$ *Permisos* y habilitar el permiso de **Cámara**. |
| **"Sesión expirada / 401 Unauthorized"** | El token de seguridad de acceso (JWT) superó su tiempo de validez y el token de refresco no pudo renovarse. | Ingresar nuevamente el correo electrónico y la contraseña en la pantalla de inicio de sesión para renovar credenciales. |
| **"Límite de sucursales alcanzado para su plan (HTTP 403)"** | El inquilino ha alcanzado el número máximo de sucursales permitidas por su suscripción SaaS (ej. 10/10 en Plan Pro). | En el panel de suscripción, solicitar la ampliación al plan *Enterprise* para desbloquear la creación de nuevas sucursales. |
| **"Conflicto de sincronización detectado (Server-Wins)"** | Al sincronizar una venta realizada sin conexión (*offline*), el servidor detectó que la prenda fue vendida en otra caja. | En el modal emergente `PosSyncModal`, revisar la prenda agotada y presionar *"Ajuste Físico"* o *"Devolución de Efectivo"*. |
| **"Transacción de pago rechazada por pasarela bancaria"** | Fondos insuficientes en la tarjeta, restricciones del banco emisor o error en la comunicación con Stripe. | Verificar la fecha de vencimiento y código CVV, solicitar otra tarjeta al cliente o seleccionar cobro en efectivo/código QR. |
| **"Error de conexión con la base de datos relacional"** | El contenedor PostgreSQL o el grupo de conexiones de base de datos se encuentra temporalmente inaccesible. | Verificar en la infraestructura del servidor que el servicio PostgreSQL en Docker o Amazon RDS esté en estado activo (*Running*). |

*Nota.* Elaboración propia basada en los manejadores de excepciones globales del API Gateway y la interfaz de usuario (2026).

---

## 5. GUÍA DE INDICADORES DE ESTADO Y AYUDA CONTEXTUAL

Para facilitar la rápida interpretación visual por parte de los cajeros y dependientes de tienda, la plataforma utiliza distintivos y badges de estado estandarizados:

### 1. Indicadores de Conectividad y Sincronización
* 🟢 **`EN LÍNEA (WebSocket Activo)`:** Conexión bidireccional estable. La terminal recibe alertas sonoras de vestidores y cambios de inventario con una latencia inferior a 50 ms.
* 🟡 **`SINCRONIZANDO OUTBOX (X órdenes pendientes)`:** La terminal acaba de recuperar la conexión a Internet y está transmitiendo las ventas acumuladas hacia la base de datos central.
* 🔴 **`MODO OFFLINE (IndexedDB Activo)`:** Terminal desconectada. Las transacciones se guardan en el almacenamiento local de respaldo con clave de idempotencia.

### 2. Indicadores de Disponibilidad de Inventario
* 🟢 **`STOCK ÓPTIMO`:** Cantidad disponible superior al umbral de seguridad (más de 10 unidades por variante).
* 🟠 **`STOCK CRÍTICO (Punto de Reorden)`:** Cantidad disponible igual o inferior al mínimo configurado (`minStock`, ej. $\le 3$ unidades). Advierte al administrador la necesidad de reabastecer la prenda.
* ⚪ **`RESERVADO EN PROBADOR`:** Cantidad apartada temporalmente por clientes con citas activas en vestidores. No puede ser vendida a otro cliente hasta que concluya la cita o expire el tiempo de tolerancia.
* 🔴 **`AGOTADO / SIN EXISTENCIAS`:** Stock en cero. La prenda se bloquea automáticamente para cobro o reserva.

### 3. Estados de la Consola de Probadores en Sucursales
* 🔵 **`PENDIENTE`:** La reserva fue generada desde la app móvil y está a la espera de que el personal de tienda recoja las prendas.
* 🟡 **`PREPARANDO`:** El personal está reuniendo las prendas solicitadas en el piso de venta o almacén.
* 🟢 **`LISTO EN VESTIDOR`:** Las prendas fueron depositadas en la zona de probadores y el cliente fue notificado.
* 🟣 **`EN PROBADOR`:** El cliente se encuentra físicamente en la cabina probándose la ropa.
* ⚫ **`FINALIZADO / EXPIRADO`:** El cliente concluyó la prueba (pasando a caja para compra) o la cita venció por inasistencia y las prendas retornaron al catálogo general.

### 4. Distintivos Comerciales Especiales
* 🏷️ **Badge "Mayorista" (`isWholesaler = true`):** Se muestra junto al nombre del cliente en el Punto de Venta y en la tienda web, aplicando de forma automatizada descuentos por volumen en compras que superen la docena de prendas.
