import math
from typing import Dict, List, Tuple
from app.modules.virtual_fitting.schemas import (
    SizeEstimationRequest,
    SizeEstimationResponse,
    SizeFitDetail,
)


class VirtualFittingService:
    # Tabla estándar de patronaje industrial (centímetros de la prenda terminada)
    STANDARD_MEASUREMENTS: Dict[str, Dict[str, float]] = {
        "XS": {"shoulders": 36.0, "chest": 84.0, "waist": 64.0, "hips": 88.0},
        "S": {"shoulders": 38.0, "chest": 88.0, "waist": 68.0, "hips": 92.0},
        "M": {"shoulders": 40.0, "chest": 94.0, "waist": 74.0, "hips": 98.0},
        "L": {"shoulders": 42.0, "chest": 100.0, "waist": 80.0, "hips": 104.0},
        "XL": {"shoulders": 45.0, "chest": 108.0, "waist": 88.0, "hips": 112.0},
    }

    @classmethod
    def estimate_size(cls, req: SizeEstimationRequest) -> SizeEstimationResponse:
        distances: List[Tuple[str, float]] = []

        # Holguras anatómicas de confort deseadas (ease)
        desired_ease = {"chest": 4.0, "waist": 3.0, "shoulders": 1.0}

        for size_label, measures in cls.STANDARD_MEASUREMENTS.items():
            diff_chest = measures["chest"] - (req.chest_circumference_cm + desired_ease["chest"])
            diff_waist = measures["waist"] - (req.waist_circumference_cm + desired_ease["waist"])
            diff_shoulders = measures["shoulders"] - (req.shoulder_width_cm + desired_ease["shoulders"])

            # Penalización cuadrática ponderada
            penalty = (
                (diff_chest * 1.5) ** 2
                + (diff_waist * 1.2) ** 2
                + (diff_shoulders * 1.8) ** 2
            )
            dist = math.sqrt(penalty)
            distances.append((size_label, dist))

        distances.sort(key=lambda x: x[1])
        best_size, min_dist = distances[0]
        runner_up_size = distances[1][0] if len(distances) > 1 else None

        # Confianza inversamente proporcional a la distancia
        confidence = max(0.70, round(1.0 - (min_dist / 60.0), 2))
        confidence = min(0.98, confidence)

        # Análisis de ajuste por parte anatómica
        best_measures = cls.STANDARD_MEASUREMENTS[best_size]
        details = [
            SizeFitDetail(
                part="Hombros",
                fit_status="Calce exacto" if abs(best_measures["shoulders"] - req.shoulder_width_cm) <= 2.0 else "Holgado",
                recommended_ease_cm=round(best_measures["shoulders"] - req.shoulder_width_cm, 1),
            ),
            SizeFitDetail(
                part="Pecho / Busto",
                fit_status="Ajuste ideal" if abs(best_measures["chest"] - req.chest_circumference_cm) <= 5.0 else "Entallado",
                recommended_ease_cm=round(best_measures["chest"] - req.chest_circumference_cm, 1),
            ),
            SizeFitDetail(
                part="Cintura",
                fit_status="Calce confortable" if abs(best_measures["waist"] - req.waist_circumference_cm) <= 4.0 else "Ajustado",
                recommended_ease_cm=round(best_measures["waist"] - req.waist_circumference_cm, 1),
            ),
        ]

        verdict = f"La talla recomendada para esta prenda es {best_size}, ofreciendo un ajuste armónico y estilizado."

        return SizeEstimationResponse(
            status="success",
            recommended_size=best_size,
            confidence_score=confidence,
            fit_verdict=verdict,
            details=details,
            alternative_size=runner_up_size,
        )
