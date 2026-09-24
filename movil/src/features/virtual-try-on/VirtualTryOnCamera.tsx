import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCameraPermissions } from './hooks/useCameraPermissions';
import { useCameraLifecycle } from './hooks/useCameraLifecycle';
import { CameraView } from './components/CameraView';
import { CameraControls } from './components/CameraControls';
import { PermissionGate } from './components/PermissionGate';
import { usePoseDetection } from './pose/hooks/usePoseDetection';
import { CoordinateDebugHUD } from './pose/components/CoordinateDebugHUD';
import { useCoordinateSampling } from './pose/hooks/useCoordinateSampling';
import { PoseCanvas } from './rendering/components/PoseCanvas';
import { usePoseRenderData } from './rendering/hooks/usePoseRenderData';
import { useSelectedGarment } from './garment/hooks/useSelectedGarment';
import { useCatalog } from '@/features/catalog/hooks/useCatalog';
import { GarmentDebugInfo } from './garment/components/GarmentDebugInfo';
import type { CameraPosition } from './types/camera.types';
import type { PreviewSize } from './pose/types/coordinate.types';

export const VirtualTryOnCamera: React.FC = () => {
  const { hasPermission, status, requestPermission, openSettings } = useCameraPermissions();
  const { isSystemActive } = useCameraLifecycle();
  const params = useLocalSearchParams<{ garmentId?: string }>();

  // Cargar catálogo de productos de la boutique
  const { products: catalogProducts } = useCatalog();

  // Posición frontal por defecto para el probador virtual
  const [position, setPosition] = useState<CameraPosition>('front');

  // Control manual para suspender captura y liberar hardware
  const [isActive, setIsActive] = useState<boolean>(true);

  // Control visual del esqueleto Skia (Fase 5) — se puede alternar con el botón
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);

  // Control visual de la prenda virtual 2D (Fase 6 & 7) — filtro AR
  const [showGarment, setShowGarment] = useState<boolean>(true);

  // Prenda seleccionada (soporta presets locales, productos del catálogo y prendas del carrito)
  const { selectedGarment, garmentStatus, selectGarmentById } = useSelectedGarment(
    params.garmentId,
    catalogProducts
  );

  useEffect(() => {
    if (params.garmentId) {
      selectGarmentById(params.garmentId);
    }
  }, [params.garmentId, selectGarmentById, catalogProducts]);

  // Dimensiones del contenedor del preview en píxeles de pantalla (Fase 4)
  const [previewSize, setPreviewSize] = useState<PreviewSize>({ width: 0, height: 0 });

  // Toggle para HUD de depuración
  const [showCoordinateDebug, setShowCoordinateDebug] = useState<boolean>(false);

  // Modo espejo: en Android frontal, false mantiene correspondencia directa con la pantalla
  const [isMirrored, setIsMirrored] = useState<boolean>(false);

  // La captura sólo está activa si el usuario no la pausó y el sistema está en foreground
  const effectiveActive = isActive && isSystemActive;

  // Pipeline de detección de pose corporal mediante IA local (Fase 3)
  const {
    frameOutput,
    landmarksShared,
    poseStatus,
    metrics: poseMetrics,
  } = usePoseDetection({
    isActive: effectiveActive,
  });

  // Muestreo de coordenadas para HUD numérico (sin spamming de console.log)
  const coordinateSamples = useCoordinateSampling({
    landmarksShared,
    previewSize,
    isMirrored,
    throttleMs: 400,
  });

  // Pipeline de renderizado Skia en tiempo real con suavizado temporal EMA (Fase 5)
  const { screenLandmarksShared } = usePoseRenderData({
    landmarksShared,
    previewSize,
    isMirrored,
  });

  // Solicitar permiso automáticamente al montar si aún no se ha determinado
  useEffect(() => {
    if (!hasPermission && status === 'not-determined') {
      requestPermission();
    }
  }, [hasPermission, status, requestPermission]);

  const handleTogglePosition = () => {
    setPosition((prev) => (prev === 'front' ? 'back' : 'front'));
  };

  const handleToggleActive = () => {
    setIsActive((prev) => !prev);
  };

  const handleToggleSkeleton = () => {
    setShowSkeleton((prev) => !prev);
  };

  const handleToggleGarment = () => {
    setShowGarment((prev) => !prev);
  };

  const handleToggleCoordinateDebug = () => {
    setShowCoordinateDebug((prev) => !prev);
  };

  const handleClose = () => {
    setIsActive(false);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/fitting' as never);
    }
  };

  // Si no cuenta con permisos, mostrar la interfaz de gestión de permisos
  if (!hasPermission) {
    return (
      <PermissionGate
        status={status}
        onRequestPermission={requestPermission}
        onOpenSettings={openSettings}
        onClose={handleClose}
      />
    );
  }

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setPreviewSize({ width, height });
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />

      {/* 1. Vista de Cámara (Fondo) */}
      <CameraView
        position={position}
        isActive={isActive}
        isSystemActive={isSystemActive}
        targetFps={30}
        frameOutput={frameOutput}
      />

      {/* 2. Renderer Gráfico en Tiempo Real Skia (Filtro AR de Prenda + Esqueleto) */}
      <PoseCanvas
        landmarksShared={screenLandmarksShared}
        isVisible={effectiveActive}
        garment={selectedGarment}
        showGarment={showGarment}
        showSkeleton={showSkeleton}
        showPoints={showSkeleton}
      />

      {/* 3. HUD de inspección numérica de coordenadas (Depuración) */}
      <CoordinateDebugHUD
        isVisible={showCoordinateDebug}
        isMirrored={isMirrored}
        previewWidth={previewSize.width}
        previewHeight={previewSize.height}
        samples={coordinateSamples}
      />

      {/* 4. Badge de información de prenda (Debug) */}
      <GarmentDebugInfo
        isVisible={showCoordinateDebug}
        garment={selectedGarment}
        status={garmentStatus}
      />

      {/* 5. Controles y UI Completa del Probador Virtual (Image 2) */}
      <CameraControls
        position={position}
        isActive={isActive}
        poseStatus={poseStatus}
        currentFps={30}
        showSkeleton={showSkeleton}
        showGarment={showGarment}
        showCoordinateDebug={showCoordinateDebug}
        selectedGarment={selectedGarment}
        onSelectGarment={selectGarmentById}
        onTogglePosition={handleTogglePosition}
        onToggleActive={handleToggleActive}
        onToggleSkeleton={handleToggleSkeleton}
        onToggleGarment={handleToggleGarment}
        onToggleCoordinateDebug={handleToggleCoordinateDebug}
        onClose={handleClose}
        catalogProducts={catalogProducts}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
