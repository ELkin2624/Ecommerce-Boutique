# 📸 Probador Virtual — Fases 1 a 6: Pipeline AR Completo (FashionStore)

Este módulo implementa el probador virtual en tiempo real para **FashionStore Mobile**, integrando desde la captura del sensor hasta la superposición de la primera prenda 2D con renderizado en GPU acelerado por Skia.

---

## 🏗️ Pipeline de Arquitectura (Fases 1 a 6)

```text
1. CÁMARA (Fase 1)
   Vision Camera v5 (mirrorMode='on' en frontal, resizeMode='cover')
          ↓
2. FRAME PROCESSOR (Fase 2)
   Worklet nativo con GPU Resizer a 192×192 RGB uint8
          ↓
3. POSE MODEL IA LOCAL (Fase 3)
   MoveNet SinglePose Lightning vía react-native-fast-tflite (0 cloud overhead)
          ↓
4. TRANSFORMACIÓN DE COORDENADAS (Fase 4)
   Model [0..1] → Frame [px] → Preview [px] (cover, crop, mirror) → Screen [px]
          ↓
5. RENDERER SKIA DE ESQUELETO (Fase 5)
   PoseCanvas + LandmarkPoints + PoseSkeleton con smoothing temporal EMA
          ↓
6. PRIMERA PRENDA 2D (Fase 6)
   GarmentLayer (PNG con transparencia real, anclaje rígido en hombros)
```

---

## 📐 Fase 4: Transformación Matemática de Coordenadas

El modelo MoveNet entrega coordenadas relativas $x, y \in [0.0, 1.0]$. Para proyectarlas sin desalineación sobre el preview de la cámara en pantalla:

### Espacios de Coordenadas Modelados:
1. **Espacio de Modelo ($A$):** $x_m, y_m \in [0.0, 1.0]$.
2. **Espacio de Frame ($B$):** $x_f, y_f \in [0, W_{frame}] \times [0, H_{frame}]$.
3. **Espacio de Preview ($C$):** Coordenadas visuales en el contenedor de la pantalla.
4. **Espacio de Pantalla ($D$):** Coordenadas absolutas de la ventana del dispositivo.

### Fórmulas y Estrategia `cover`:
```ts
// Relaciones de aspecto (Portrait)
const scaleX = previewWidth / frameWidth;
const scaleY = previewHeight / frameHeight;
const scale = Math.max(scaleX, scaleY);

const scaledWidth = frameWidth * scale;
const scaledHeight = frameHeight * scale;

// Desplazamiento de recorte centrado (negativo si desborda)
const offsetX = (previewWidth - scaledWidth) / 2;
const offsetY = (previewHeight - scaledHeight) / 2;

// Inversión horizontal para cámara frontal (modo espejo/selfie)
const effectiveNormX = isMirrored ? (1.0 - normX) : normX;

const frameX = effectiveNormX * frameWidth;
const frameY = normY * frameHeight;

const previewX = frameX * scale + offsetX;
const previewY = frameY * scale + offsetY;
```

### Módulos (SRP):
* `pose/types/coordinate.types.ts`: Tipos estrictos `NormalizedPoint`, `PixelPoint`, `PreviewGeometry`, `ScreenLandmark`.
* `pose/utils/previewGeometry.ts`: Cálculo de escala uniforme y crop centrado.
* `pose/utils/mirrorTransform.ts`: Inversión horizontal condicional para cámara frontal.
* `pose/utils/coordinateTransform.ts`: Funciones puras de transformación matemática y clamping.
* `pose/utils/screenLandmarks.ts`: Transformación en lote preservando scores y filtrando por `minScore`.
* `pose/components/CoordinateDebugHUD.tsx`: HUD numérico en pantalla para auditar `MODEL`, `FRAME`, `PREVIEW` y `score` en tiempo real.

---

## 🎨 Fase 5: Skia Skeleton Renderer en Tiempo Real

* **Librería gráfica:** `@shopify/react-native-skia@2.6.2` (oficialmente compatible con Expo SDK 57, React Native 0.86.3 y React 19).
* **Módulos:**
  * `rendering/types/render.types.ts`: Tipos de renderizado y configuración anatómica.
  * `rendering/config/poseSkeletonConfig.ts`: Definición de 17 conexiones óseas MoveNet.
  * `rendering/hooks/usePoseRenderData.ts`: Suavizado temporal EMA (`smoothingFactor = 0.35`) para eliminar jitter entre frames:
    $$x_{smooth} = x_{prev} \cdot (1 - \alpha) + x_{current} \cdot \alpha$$
  * `rendering/components/PoseCanvas.tsx`: Canvas Skia raíz en `StyleSheet.absoluteFill` con `pointerEvents="none"`.
  * `rendering/components/LandmarkPoints.tsx`: Círculos de landmarks con acento visual en los hombros (`#38BDF8`).
  * `rendering/components/PoseSkeleton.tsx`: Líneas anatómicas (`Line`) con filtrado estricto de confianza en ambos extremos.
* **Rendimiento:** 0 llamadas a `setState` en React por frame; renderizado acelerado en GPU vía `useDerivedValue`.

---

## 👕 Fase 6: Primera Prenda Virtual 2D (Superposición Rígida)

* **Asset:** `assets/garments/tops/blouse-basic.png` (PNG 1024×1024 con canal alfa real, fondo transparente, vista frontal).
* **Módulos:**
  * `garment/types/garment.types.ts`: `VirtualGarment`, `GarmentCategory`, `GarmentRenderGeometry`, `GarmentStatus`.
  * `garment/data/garmentAssets.ts`: Catálogo de prendas locales con dimensiones y offsets calibrados.
  * `garment/utils/garmentAnchor.ts`:
    * Anclaje rígido en punto medio de hombros:
      $$X_{center} = \frac{X_{left} + X_{right}}{2}, \quad Y_{center} = \frac{Y_{left} + Y_{right}}{2}$$
    * Posición inicial:
      $$X = X_{center} - \frac{baseWidth}{2} + horizontalOffset$$
      $$Y = Y_{center} - topOffset$$
    * Preservación estricta de aspect ratio:
      $$height = baseWidth \times \frac{originalHeight}{originalWidth}$$
  * `garment/components/GarmentLayer.tsx`: Renderizado Skia con `useImage`, transparente y oculto automáticamente cuando la confianza de los hombros cae por debajo de `minShoulderScore`.
  * `garment/components/GarmentDebugInfo.tsx`: Panel informativo de prenda (estado, anclaje y dimensiones).
* **Límites de Fase 6 estrictamente respetados:**
  * NO rotación dinámica con `Math.atan2` (reservado para Fase 7).
  * NO escala dinámica dependiente de distancia de hombros `shoulderWidth * factor` (reservado para Fase 7).
  * NO deformación de malla ni segmentación corporal.

---

## 🎛️ Controles en Pantalla

* **Botón `[Prenda: ON/OFF]`**: Permite mostrar u ocultar la blusa virtual 2D.
* **Botón `[Esqueleto: ON/OFF]`**: Permite alternar la visualización del esqueleto de Skia para validar la alineación con el cuerpo real.
* **Botón `[HUD: ON/OFF]`**: Permite activar la inspección numérica de coordenadas (MODEL, FRAME, PREVIEW).
* **Botón `[Pausar / Reanudar Cámara]`**: Suspende el sensor y el pipeline para liberar hardware.
* **Botón de Sensor**: Alterna entre cámara frontal (espejada) y trasera.
