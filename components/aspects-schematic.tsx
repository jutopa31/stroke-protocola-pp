"use client"

const REGION_META = {
  caudate: { code: "C", name: "Núcleo caudado" },
  putamen: { code: "L", name: "Núcleo lentiforme" },
  internalCapsule: { code: "IC", name: "Cápsula interna" },
  insular: { code: "I", name: "Ínsula" },
  m1: { code: "M1", name: "Corteza MCA anterior" },
  m2: { code: "M2", name: "Corteza MCA lateral" },
  m3: { code: "M3", name: "Corteza MCA posterior" },
  m4: { code: "M4", name: "Territorio MCA anterior superior" },
  m5: { code: "M5", name: "Territorio MCA lateral superior" },
  m6: { code: "M6", name: "Territorio MCA posterior superior" },
}

type RegionKey = keyof typeof REGION_META
type AspectsRegions = Record<RegionKey, boolean>
type RegionShape = {
  key: RegionKey
  d: string
  label: { x: number; y: number }
}

const BASAL_REGIONS: RegionShape[] = [
  {
    key: "m1",
    d: "M88 72 L136 94 L146 170 L98 198 L54 156 L60 100 Z",
    label: { x: 104, y: 112 },
  },
  {
    key: "insular",
    d: "M142 146 L158 152 L162 214 L146 242 L130 228 L128 172 Z",
    label: { x: 150, y: 192 },
  },
  {
    key: "m2",
    d: "M166 120 L222 122 L242 198 L216 274 L168 290 L154 250 L166 198 Z",
    label: { x: 200, y: 194 },
  },
  {
    key: "m3",
    d: "M120 260 L156 294 L226 302 L206 386 L126 398 L86 346 L96 286 Z",
    label: { x: 160, y: 336 },
  },
  {
    key: "caudate",
    d: "M84 138 L122 124 L142 148 L132 204 L94 214 L72 184 Z",
    label: { x: 107, y: 172 },
  },
  {
    key: "putamen",
    d: "M116 186 L146 170 L166 196 L154 248 L122 258 L96 222 Z",
    label: { x: 130, y: 216 },
  },
  {
    key: "internalCapsule",
    d: "M148 184 L164 190 L164 258 L148 266 L138 250 L138 198 Z",
    label: { x: 152, y: 228 },
  },
]

const SUPRAGANGLIONIC_REGIONS: RegionShape[] = [
  {
    key: "m4",
    d: "M82 76 L148 96 L170 176 L132 246 L74 220 L46 142 Z",
    label: { x: 116, y: 132 },
  },
  {
    key: "m5",
    d: "M170 108 L232 124 L250 226 L210 330 L154 326 L136 246 L170 176 Z",
    label: { x: 198, y: 212 },
  },
  {
    key: "m6",
    d: "M104 246 L150 332 L212 346 L194 404 L116 404 L70 350 L72 282 Z",
    label: { x: 146, y: 340 },
  },
]

function RegionPath({ region, isNormal, onToggle }: { region: RegionShape; isNormal: boolean; onToggle: () => void }) {
  return (
    <g>
      <path
        d={region.d}
        fill={isNormal ? "#f8fafc" : "#b8c2cc"}
        stroke="#223042"
        strokeWidth="2.2"
        vectorEffect="non-scaling-stroke"
        className="cursor-pointer transition-all duration-150 hover:fill-[#dbe4ec]"
        onClick={onToggle}
      />
      <g className="pointer-events-none">
        <circle cx={region.label.x} cy={region.label.y} r="16" fill="#122033" opacity="0.95" />
        <text
          x={region.label.x}
          y={region.label.y + 5}
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          letterSpacing="0.08em"
          fill="#f8fafc"
        >
          {REGION_META[region.key].code}
        </text>
      </g>
    </g>
  )
}

function SliceFrame({
  title,
  subtitle,
  regions,
  aspectsRegions,
  onToggle,
  yOffset = 0,
}: {
  title: string
  subtitle: string
  regions: RegionShape[]
  aspectsRegions: AspectsRegions
  onToggle: (key: RegionKey) => void
  yOffset?: number
}) {
  return (
    <g transform={`translate(0 ${yOffset})`}>
      <rect x="24" y="24" width="372" height="440" rx="30" fill="#f4efe7" stroke="#d5c9b7" strokeWidth="2" />
      <text x="44" y="56" fontSize="20" fontWeight="700" fill="#2b2f33">
        {title}
      </text>
      <text x="44" y="80" fontSize="12" fill="#5c6470" letterSpacing="0.04em">
        {subtitle}
      </text>

      <path
        d="M70 110 C92 82 132 66 184 64 C246 62 300 82 334 120 C366 156 382 220 376 278 C368 346 330 402 270 420 C220 436 168 436 118 420 C62 402 30 352 30 282 C30 212 44 154 70 110 Z"
        fill="#ebe5db"
        stroke="#5b6066"
        strokeWidth="3"
      />

      <path
        d="M202 70 C212 132 214 362 202 418"
        fill="none"
        stroke="#353c44"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="4 8"
      />

      <path
        d="M58 130 C76 98 122 82 176 84 C176 84 178 404 176 404 C114 404 78 388 56 352 C38 322 32 214 40 178 C44 160 48 144 58 130 Z"
        fill="#ffffff"
        opacity="0.42"
      />
      <path
        d="M228 118 C248 92 282 82 318 90 C338 96 354 112 362 134 C374 164 376 302 362 334 C350 360 332 374 312 382 C284 394 252 394 228 386 Z"
        fill="#ffffff"
        opacity="0.32"
      />

      <path
        d="M132 90 C160 112 170 154 162 198 C154 234 142 268 114 296 C88 322 70 330 52 332 C38 334 34 324 36 306 C38 268 50 202 76 144 C88 118 106 100 132 90 Z"
        fill="#faf6ef"
        opacity="0.9"
      />

      {regions.map((region) => (
        <RegionPath
          key={region.key}
          region={region}
          isNormal={aspectsRegions[region.key]}
          onToggle={() => onToggle(region.key)}
        />
      ))}

      <text x="56" y="446" fontSize="11" fill="#5c6470">
        Hemisferio evaluado: izquierdo
      </text>
      <text x="226" y="446" fontSize="11" fill="#5c6470">
        Contralateral: referencia
      </text>
    </g>
  )
}

export default function AspectsSchematic({
  aspectsRegions,
  onToggle,
}: {
  aspectsRegions: AspectsRegions
  onToggle: (key: RegionKey) => void
}) {
  const affectedCount = Object.values(aspectsRegions).filter((value) => !value).length

  return (
    <div className="rounded-[28px] border border-stone-300 bg-[linear-gradient(180deg,#f7f2e9_0%,#efe4d4_100%)] p-5 shadow-[0_18px_50px_rgba(66,48,26,0.12)]">
      <div className="mb-4 flex flex-col gap-3 border-b border-stone-300 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">ASPECTS Published Scheme</p>
          <h3 className="font-serif text-2xl font-semibold text-stone-900">Diagrama estándar en dos cortes axiales</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-700">
            Esquema basado en la distribución publicada de C, L, IC, I y M1-M6. Prioriza fidelidad al lenguaje visual
            del score, no apariencia de TC real.
          </p>
        </div>
        <div className="rounded-2xl border border-stone-400 bg-[#fffaf2] px-4 py-3 text-right shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Regiones afectadas</div>
          <div className="mt-1 text-3xl font-bold leading-none text-stone-900">{affectedCount}</div>
        </div>
      </div>

      <svg viewBox="0 0 420 940" className="w-full">
        <SliceFrame
          title="Ganglios basales"
          subtitle="C, L, IC, I, M1, M2, M3"
          regions={BASAL_REGIONS}
          aspectsRegions={aspectsRegions}
          onToggle={onToggle}
        />
        <SliceFrame
          title="Nivel supraganglionar"
          subtitle="M4, M5, M6"
          regions={SUPRAGANGLIONIC_REGIONS}
          aspectsRegions={aspectsRegions}
          onToggle={onToggle}
          yOffset={470}
        />
      </svg>

      <div className="mt-4 grid gap-3 text-xs text-stone-700 md:grid-cols-3">
        <div className="rounded-2xl border border-stone-300 bg-white/70 p-3">
          <span className="font-semibold text-stone-900">Normal</span>: región conservada, suma 1 punto.
        </div>
        <div className="rounded-2xl border border-stone-300 bg-white/70 p-3">
          <span className="font-semibold text-stone-900">Gris</span>: cambios isquémicos tempranos, resta 1 punto.
        </div>
        <div className="rounded-2xl border border-stone-300 bg-white/70 p-3">
          <span className="font-semibold text-stone-900">Interacción</span>: click sobre una región para alternar normal/afectada.
        </div>
      </div>
    </div>
  )
}
