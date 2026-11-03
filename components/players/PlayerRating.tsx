"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

interface PlayerRatingProps {
  playerId: string;
  value: number;
  size?: "sm" | "md";
  onSaved?: (rating: number) => void;
}

export function PlayerRating({
  playerId,
  value,
  size = "md",
  onSaved,
}: PlayerRatingProps) {
  const [rating, setRating] = useState(value);
  const [hovered, setHovered] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => setRating(value), [value]);

  const saveRating = async (nextRating: number) => {
    if (saving || nextRating === rating) return;
    const previousRating = rating;
    setRating(nextRating);
    setSaving(true);

    try {
      const response = await fetch(`/api/players/${playerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: nextRating }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error ?? "Não foi possível salvar a avaliação.");
      }
      onSaved?.(nextRating);
    } catch (error) {
      setRating(previousRating);
      window.alert(error instanceof Error ? error.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div
      className="inline-flex items-center gap-1"
      role="radiogroup"
      aria-label={`Avaliação do jogador: ${rating} de 5 estrelas`}
      aria-busy={saving}
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const visibleRating = hovered || rating;
        const selected = star <= visibleRating;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`Avaliar com ${star} ${star === 1 ? "estrela" : "estrelas"}`}
            disabled={saving}
            onMouseEnter={() => setHovered(star)}
            onFocus={() => setHovered(star)}
            onBlur={() => setHovered(0)}
            onClick={() => saveRating(star)}
            className="rounded-md text-amber-400 transition disabled:cursor-wait"
          >
            <Star
              className={`${iconSize} ${selected ? "fill-current" : "fill-transparent text-slate-300"}`}
              strokeWidth={2}
            />
          </button>
        );
      })}
    </div>
  );
}
