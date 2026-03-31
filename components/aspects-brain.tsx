"use client"

import { useState } from "react"

// ── Types ────────────────────────────────────────────────────────────────────

export interface AspectsRegions {
  caudate: boolean
  putamen: boolean
  internalCapsule: boolean
  insular: boolean
  m1: boolean
  m2: boolean
  m3: boolean
  m4: boolean
  m5: boolean
  m6: boolean
}

interface TerritoryDef {
  id: string
  key: keyof AspectsRegions
  label: string
  fullName: string
  points: string
  lx: number // label circle center X
  ly: number // label circle center Y
  labelFontSize?: number
}

// ── Territory definitions ────────────────────────────────────────────────────
//
// Two axial brain slices drawn in a single 660×316 SVG viewBox:
//   Brain 1 (Basal Ganglia level)  – outer ellipse cx=160 cy=158, rx=135 ry=124
//   Brain 2 (Corona Radiata level) – outer ellipse cx=494 cy=155, rx=118 ry=108
//
// Territories approximate the Barber et al. (AJNR 2000) ASPECTS diagram.
// Only the RIGHT hemisphere (x > midline) is interactive; the left half serves
// as a visual reference.  A dashed midline is drawn to make this explicit.
//
// Polygon coordinates are hardcoded approximations – anatomy is simplified but
// clinically recognisable for teaching purposes.

const GANGLIONIC: TerritoryDef[] = [
  {
    id: "C",
    key: "caudate",
    label: "C",
    fullName: "Núcleo Caudado",
    points: "162,100 177,97 186,103 185,140 171,142 162,136",
    lx: 174,
    ly: 120,
  },
  {
    id: "IC",
    key: "internalCapsule",
    label: "IC",
    fullName: "Cápsula Interna",
    points: "186,101 199,99 198,143 185,141",
    lx: 192,
    ly: 121,
    labelFontSize: 7,
  },
  {
    id: "L",
    key: "putamen",
    label: "L",
    fullName: "Putamen / Lenticular",
    points: "199,99 223,98 232,116 231,152 217,157 199,151",
    lx: 215,
    ly: 129,
  },
  {
    id: "I",
    key: "insular",
    label: "I",
    fullName: "Corteza Insular (ínsula)",
    points: "232,114 247,120 247,163 232,165",
    lx: 240,
    ly: 141,
    labelFontSize: 7,
  },
  {
    id: "M1",
    key: "m1",
    label: "M1",
    fullName: "Corteza ACM anterior",
    // From midline-top → anterior brain surface → down to deep structures → midline
    points:
      "160,34 188,38 212,50 232,66 248,92 248,120 232,114 222,98 199,99 186,101 177,97 162,100 160,100",
    lx: 206,
    ly: 70,
  },
  {
    id: "M2",
    key: "m2",
    label: "M2",
    fullName: "Corteza ACM lateral (sobre ínsula)",
    points: "248,92 270,110 282,145 276,178 258,194 248,163 247,120",
    lx: 268,
    ly: 143,
  },
  {
    id: "M3",
    key: "m3",
    label: "M3",
    fullName: "Corteza ACM posterior",
    // Posterior arc from M2-bottom → posterior brain surface → midline-bottom → up to deep structures
    points:
      "258,194 242,228 214,253 186,264 162,258 160,258 160,165 162,165 199,165 231,153 232,165 248,163",
    lx: 213,
    ly: 222,
  },
]

const CORONA: TerritoryDef[] = [
  {
    id: "M4",
    key: "m4",
    label: "M4",
    fullName: "ACM anterior-superior",
    points:
      "494,47 516,44 538,54 558,76 566,104 560,130 542,130 520,126 496,125 494,108",
    lx: 530,
    ly: 90,
  },
  {
    id: "M5",
    key: "m5",
    label: "M5",
    fullName: "ACM lateral-superior",
    points: "566,104 584,124 592,157 584,188 564,202 547,184 546,148 560,130",
    lx: 572,
    ly: 153,
  },
  {
    id: "M6",
    key: "m6",
    label: "M6",
    fullName: "ACM posterior-superior",
    points: "564,202 546,232 520,248 494,255 494,196 496,182 547,184",
    lx: 523,
    ly: 218,
  },
]

// ── Clinical interpretation table (AHA/ASA Stroke Guidelines 2026) ────────────

interface Interp {
  label: string
  detail: string
  barColor: string
  textColor: string
  badgeClass: string
}

function interpret(score: number): Interp {
  if (score === 10)
    return {
      label: "ASPECTS 10 — Sin cambios isquémicos",
      detail: "Candidato ideal para EVT en cualquier ventana.",
      barColor: "#15803d",
      textColor: "text-green-800",
      badgeClass: "bg-green-100 border-green-300",
    }
  if (score >= 8)
    return {
      label: `ASPECTS ${score} — Carga leve`,
      detail: "EVT indicado en cualquier ventana. COR 1/A (AHA 2026).",
      barColor: "#2563eb",
      textColor: "text-blue-800",
      badgeClass: "bg-blue-100 border-blue-300",
    }
  if (score >= 6)
    return {
      label: `ASPECTS ${score} — Límite ventana extendida`,
      detail:
        "COR 1/A en ventana 6-24h. Evaluación DAWN/DEFUSE-3 recomendada.",
      barColor: "#0891b2",
      textColor: "text-cyan-800",
      badgeClass: "bg-cyan-100 border-cyan-300",
    }
  if (score >= 3)
    return {
      label: `ASPECTS ${score} — Large core`,
      detail: "COR 1/A en 6-24h con ASPECTS 3-5 (AHA 2026). Discutir con equipo.",
      barColor: "#d97706",
      textColor: "text-amber-800",
      badgeClass: "bg-amber-100 border-amber-300",
    }
  if (score >= 1)
    return {
      label: `ASPECTS ${score} — Very large core`,
      detail:
        "COR 2a/B-R en <6h sin efecto de masa. Alto riesgo hemorrágico.",
      barColor: "#dc2626",
      textColor: "text-red-800",
      badgeClass: "bg-red-100 border-red-300",
    }
  return {
    label: "ASPECTS 0 — Territorio ACM completo",
    detail: "Sin indicación de EVT. Manejo médico óptimo.",
    barColor: "#7f1d1d",
    textColor: "text-red-900",
    badgeClass: "bg-red-100 border-red-300",
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  regions: AspectsRegions
  onToggle: (key: keyof AspectsRegions) => void
}

export default function AspectsBrain({ regions, onToggle }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  const score = Object.values(regions).filter(Boolean).length
  const { label, detail, barColor, textColor, badgeClass } = interpret(score)

  // Returns fill color for a territory polygon
  const fill = (t: TerritoryDef) => {
    const normal = regions[t.key]
    if (!normal) return "#ef4444" // infarcted → red
    if (hovered === t.id) return "#86efac" // hovered normal → light green
    return "#22c55e" // normal → green
  }

  const fillOpacity = (t: TerritoryDef) =>
    regions[t.key] ? (hovered === t.id ? 0.45 : 0.28) : 0.78

  // Renders a territory polygon + label badge
  const renderTerritory = (t: TerritoryDef) => {
    const normal = regions[t.key]
    const isHov = hovered === t.id
    const f = fill(t)
    const fop = fillOpacity(t)
    const r = t.label.length > 1 ? 12 : 10

    return (
      <g
        key={t.id}
        style={{ cursor: "pointer" }}
        onClick={() => onToggle(t.key)}
        onMouseEnter={() => setHovered(t.id)}
        onMouseLeave={() => setHovered(null)}
        role="button"
        aria-label={`${t.fullName}: ${normal ? "normal" : "infartado"}`}
      >
        <polygon
          points={t.points}
          fill={f}
          fillOpacity={fop}
          stroke={f}
          strokeWidth={isHov ? 2.5 : 1.5}
          strokeOpacity={0.9}
          style={{ transition: "fill 0.12s, fill-opacity 0.12s" }}
        />
        {/* Label badge */}
        <circle
          cx={t.lx}
          cy={t.ly}
          r={r}
          fill={normal ? "white" : "#dc2626"}
          stroke={normal ? "#94a3b8" : "#991b1b"}
          strokeWidth={1}
          style={{ pointerEvents: "none" }}
        />
        <text
          x={t.lx}
          y={t.ly}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={t.labelFontSize ?? (t.label.length > 1 ? 8 : 9)}
          fontWeight="700"
          fill={normal ? "#1e293b" : "white"}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {t.label}
        </text>
      </g>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Score header ── */}
      <div
        className={`flex flex-wrap items-start gap-3 rounded-xl border p-4 ${badgeClass}`}
      >
        <div className="flex items-baseline gap-1">
          <span
            className="text-5xl font-black"
            style={{ color: barColor }}
          >
            {score}
          </span>
          <span className="text-xl font-semibold text-gray-500">/10</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-base ${textColor}`}>{label}</p>
          <p className="text-sm text-gray-600 mt-0.5">{detail}</p>
        </div>
        <div className="text-xs text-gray-400 leading-relaxed text-right shrink-0">
          Clic en cada región<br />para marcarla como infartada
        </div>
      </div>

      {/* ── SVG Diagram ── */}
      <div className="w-full overflow-x-auto rounded-xl border border-gray-100 bg-white p-2">
        <svg
          viewBox="0 0 660 316"
          className="w-full"
          style={{ minWidth: 420, maxWidth: 820, display: "block", margin: "0 auto" }}
        >
          {/* ─── Slice labels ─── */}
          <text
            x="160"
            y="14"
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill="#64748b"
          >
            Nivel Ganglios Basales
          </text>
          <text
            x="494"
            y="14"
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill="#64748b"
          >
            Nivel Corona Radiada
          </text>

          {/* ─── Brain 1 outline ─── */}
          <ellipse
            cx="160"
            cy="158"
            rx="135"
            ry="124"
            fill="#f1f5f9"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          {/* Left hemisphere (non-interactive mirror) */}
          <path
            d="M160,34 A135,124 0 0,0 160,282 Z"
            fill="#e2e8f0"
            stroke="none"
          />
          {/* Midline (dashed) */}
          <line
            x1="160"
            y1="34"
            x2="160"
            y2="282"
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="5,4"
          />

          {/* ─── Brain 2 outline ─── */}
          <ellipse
            cx="494"
            cy="155"
            rx="118"
            ry="108"
            fill="#f1f5f9"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          {/* Left hemisphere (non-interactive mirror) */}
          <path
            d="M494,47 A118,108 0 0,0 494,263 Z"
            fill="#e2e8f0"
            stroke="none"
          />
          {/* Midline (dashed) */}
          <line
            x1="494"
            y1="47"
            x2="494"
            y2="263"
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="5,4"
          />

          {/* ─── Interactive territories ─── */}
          {GANGLIONIC.map(renderTerritory)}
          {CORONA.map(renderTerritory)}

          {/* ─── Hemisphere label ─── */}
          <text x="110" y="158" textAnchor="middle" fontSize="9" fill="#94a3b8">
            ref.
          </text>
          <text x="448" y="155" textAnchor="middle" fontSize="9" fill="#94a3b8">
            ref.
          </text>

          {/* ─── Legend ─── */}
          <g transform="translate(8, 299)">
            <rect width="12" height="12" rx="2" fill="#22c55e" fillOpacity="0.35" stroke="#22c55e" strokeWidth="1" />
            <text x="16" y="10" fontSize="9" fill="#6b7280">Normal (contribuye al score)</text>
            <rect x="155" width="12" height="12" rx="2" fill="#ef4444" fillOpacity="0.78" stroke="#ef4444" strokeWidth="1" />
            <text x="171" y="10" fontSize="9" fill="#6b7280">Infartado (resta 1 punto)</text>
            <text x="335" y="10" fontSize="9" fill="#94a3b8">Barber et al. AJNR 2000 · AHA/ASA Stroke 2026</text>
          </g>
        </svg>
      </div>

      {/* ── Hover tooltip ── */}
      <div className="h-6 text-center text-sm text-gray-500">
        {hovered ? (
          <span>
            <strong className="text-gray-800">
              {[...GANGLIONIC, ...CORONA].find((t) => t.id === hovered)?.label}
            </strong>{" "}
            —{" "}
            {[...GANGLIONIC, ...CORONA].find((t) => t.id === hovered)?.fullName}
            {" · "}
            {regions[[...GANGLIONIC, ...CORONA].find((t) => t.id === hovered)!.key]
              ? "Normal"
              : "Infartado"}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">
            Pasá el mouse sobre una región para ver su nombre
          </span>
        )}
      </div>

      {/* ── Region grid (quick toggle) ── */}
      <div className="grid grid-cols-5 gap-1.5">
        {[...GANGLIONIC, ...CORONA].map((t) => {
          const normal = regions[t.key]
          return (
            <button
              key={t.id}
              onClick={() => onToggle(t.key)}
              className={`rounded-lg border py-2 px-1 text-center text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                normal
                  ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              }`}
            >
              <div className="text-sm font-black">{t.label}</div>
              <div className="opacity-70 mt-0.5">{normal ? "Normal" : "Infarto"}</div>
            </button>
          )
        })}
      </div>

      {/* ── Interpretation table ── */}
      <div className="rounded-lg border border-gray-100 overflow-hidden text-xs">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="text-left py-2 px-3 font-semibold">ASPECTS</th>
              <th className="text-left py-2 px-3 font-semibold">Interpretación</th>
              <th className="text-left py-2 px-3 font-semibold">Recomendación AHA 2026</th>
            </tr>
          </thead>
          <tbody>
            {[
              { range: "10", interp: "Sin cambios isquémicos", rec: "EVT ideal — cualquier ventana" },
              { range: "8-9", interp: "Cambios mínimos", rec: "EVT — cualquier ventana · COR 1/A" },
              { range: "6-7", interp: "Cambios moderados", rec: "EVT ventana extendida 6-24h · COR 1/A" },
              { range: "3-5", interp: "Large core", rec: "EVT 6-24h si seleccionado · COR 1/A" },
              { range: "1-2", interp: "Very large core", rec: "EVT <6h evaluar · COR 2a/B-R" },
              { range: "0", interp: "ACM completo", rec: "Sin indicación EVT" },
            ].map(({ range, interp, rec }) => {
              const [lo, hi] = range.includes("-")
                ? range.split("-").map(Number)
                : [Number(range), Number(range)]
              const active = score >= lo && score <= hi
              return (
                <tr
                  key={range}
                  className={`border-t border-gray-100 ${active ? "bg-blue-50 font-semibold" : "text-gray-600"}`}
                >
                  <td className="py-1.5 px-3 font-mono">{range}</td>
                  <td className="py-1.5 px-3">{interp}</td>
                  <td className={`py-1.5 px-3 ${active ? "text-blue-800" : ""}`}>{rec}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
