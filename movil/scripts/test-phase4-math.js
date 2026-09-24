/**
 * Standalone verification runner for Phase 4 coordinate mathematics
 */

function calculatePreviewGeometry(frameSize, previewSize) {
  const { width: fWidth, height: fHeight } = frameSize;
  const { width: pWidth, height: pHeight } = previewSize;

  if (fWidth <= 0 || fHeight <= 0 || pWidth <= 0 || pHeight <= 0) {
    return { scale: 1, scaledWidth: pWidth, scaledHeight: pHeight, offsetX: 0, offsetY: 0 };
  }

  const scaleX = pWidth / fWidth;
  const scaleY = pHeight / fHeight;
  const scale = Math.max(scaleX, scaleY);

  const scaledWidth = fWidth * scale;
  const scaledHeight = fHeight * scale;

  const offsetX = (pWidth - scaledWidth) / 2;
  const offsetY = (pHeight - scaledHeight) / 2;

  return { scale, scaledWidth, scaledHeight, offsetX, offsetY };
}

function applyNormalizedMirror(normX, isMirrored) {
  return isMirrored ? 1.0 - normX : normX;
}

function transformLandmarkToPreview(normPoint, frameSize, previewSize, isMirrored) {
  const effectiveNormX = applyNormalizedMirror(normPoint.x, isMirrored);
  const geometry = calculatePreviewGeometry(frameSize, previewSize);

  const frameX = effectiveNormX * frameSize.width;
  const frameY = normPoint.y * frameSize.height;

  const previewX = frameX * geometry.scale + geometry.offsetX;
  const previewY = frameY * geometry.scale + geometry.offsetY;

  return { x: previewX, y: previewY };
}

function clampToPreview(point, previewSize) {
  return {
    x: Math.max(0, Math.min(previewSize.width, point.x)),
    y: Math.max(0, Math.min(previewSize.height, point.y)),
  };
}

function assertApprox(actual, expected, tolerance = 0.001, label = '') {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(`[FAIL] ${label}: actual ${actual}, expected ${expected} (diff: ${diff})`);
  }
  console.log(`[PASS] ${label}: ${actual} ~= ${expected}`);
}

console.log('=== VERIFICACIÓN MATEMÁTICA FASE 4 ===');
const frameSize = { width: 720, height: 1280 };
const previewSize = { width: 1080, height: 2400 };

// Caso A: (0, 0)
const ptA = transformLandmarkToPreview({ x: 0, y: 0 }, frameSize, previewSize, false);
assertApprox(ptA.x, -135, 0.01, 'Caso A - x (0,0)');
assertApprox(ptA.y, 0, 0.01, 'Caso A - y (0,0)');

// Caso B: (1, 1)
const ptB = transformLandmarkToPreview({ x: 1, y: 1 }, frameSize, previewSize, false);
assertApprox(ptB.x, 1215, 0.01, 'Caso B - x (1,1)');
assertApprox(ptB.y, 2400, 0.01, 'Caso B - y (1,1)');

// Caso C: (0.5, 0.5) Centro lógico
const ptC = transformLandmarkToPreview({ x: 0.5, y: 0.5 }, frameSize, previewSize, false);
assertApprox(ptC.x, 540, 0.01, 'Caso C - Centro x (0.5,0.5)');
assertApprox(ptC.y, 1200, 0.01, 'Caso C - Centro y (0.5,0.5)');

// Caso D: Mirroring simétrico
const ptNorm = transformLandmarkToPreview({ x: 0.25, y: 0.5 }, frameSize, previewSize, false);
const ptMirr = transformLandmarkToPreview({ x: 0.25, y: 0.5 }, frameSize, previewSize, true);
assertApprox(ptNorm.x + ptMirr.x, previewSize.width, 0.01, 'Caso D - Simetría espejo (ptNorm.x + ptMirr.x == previewWidth)');
assertApprox(ptMirr.x, 877.5, 0.01, 'Caso D - Valor x espejado');

// Caso E & F: Aspect ratio & Crop
const geom = calculatePreviewGeometry(frameSize, previewSize);
assertApprox(geom.scale, 1.875, 0.001, 'Caso E - Escala de cover');
assertApprox(geom.offsetX, -135, 0.01, 'Caso F - Crop horizontal');
assertApprox(geom.offsetY, 0, 0.01, 'Caso F - Offset vertical');

// Caso G: Clamping
const clamped = clampToPreview({ x: -100, y: 3000 }, previewSize);
assertApprox(clamped.x, 0, 0.01, 'Caso G - Clamp inferior');
assertApprox(clamped.y, 2400, 0.01, 'Caso G - Clamp superior');

console.log('=== TODOS LOS CASOS MATEMÁTICOS DE FASE 4 APROBADOS ===');
