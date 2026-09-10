from typing import List
from app.modules.recommendations.schemas import (
    RecommendationRequest,
    RecommendationResponse,
    RecommendedItem,
)


class RecommendationService:
    @staticmethod
    def generate_recommendations(req: RecommendationRequest) -> RecommendationResponse:
        scored_items: List[RecommendedItem] = []

        preferred_sizes_lower = {s.lower() for s in req.preferred_sizes}
        history_categories_lower = {c.lower() for c in req.history_categories}

        for candidate in req.candidate_products:
            score = 0.0
            reasons = []

            # 1. Validación de Talla (Peso: 0.40)
            avail_sizes_lower = {s.lower() for s in candidate.available_sizes_in_branch}
            size_overlap = preferred_sizes_lower.intersection(avail_sizes_lower)
            if size_overlap:
                score += 0.40
                reasons.append(f"Disponible en tu talla ({', '.join(size_overlap).upper()})")
            elif not req.preferred_sizes:
                score += 0.20  # Si no hay preferencia declarada, no penalizar totalmente
            else:
                score += 0.05

            # 2. Afinidad de Categoría (Peso: 0.35)
            if candidate.category.lower() in history_categories_lower:
                score += 0.35
                reasons.append(f"Basado en tu interés recurrente en '{candidate.category}'")
            else:
                score += 0.10

            # 3. Popularidad y Rating del Catálogo (Peso: 0.25)
            score += round(candidate.popularity_score * 0.25, 2)
            if candidate.popularity_score >= 0.80:
                reasons.append("Prenda destacada en tendencia esta temporada")

            # Construir justificación final
            final_reason = " • ".join(reasons) if reasons else "Recomendado por disponibilidad en sucursal"
            final_score = min(1.0, round(score, 2))

            scored_items.append(
                RecommendedItem(
                    product_id=candidate.product_id,
                    name=candidate.name,
                    score=final_score,
                    reason=final_reason,
                )
            )

        # Ordenar por score descendente
        scored_items.sort(key=lambda x: x.score, reverse=True)
        top_recommendations = scored_items[: req.limit]

        return RecommendationResponse(
            status="success",
            recommendations=top_recommendations,
            total=len(top_recommendations),
            engine_version="hybrid-contextual-v1.0",
        )
