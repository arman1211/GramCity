/** Decorative Bangladesh corridor map — visual anchor for the home hero. */
export function RouteMapArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <ellipse
        cx="280"
        cy="210"
        rx="200"
        ry="160"
        className="gc-hero-glow fill-emerald-200/40"
      />
      <path
        d="M90 310 C140 250, 180 220, 230 180 C280 140, 320 110, 390 70"
        stroke="#059669"
        strokeWidth="3"
        strokeLinecap="round"
        className="gc-route-dash opacity-80"
      />
      <path
        d="M120 340 C170 300, 220 260, 280 230 C340 200, 380 160, 430 120"
        stroke="#10b981"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
        className="gc-route-dash"
        style={{ animationDelay: "0.4s" }}
      />
      {/* Cities */}
      <g>
        <circle cx="120" cy="330" r="10" className="fill-emerald-700" />
        <circle cx="120" cy="330" r="16" className="fill-emerald-600/20" />
        <text
          x="120"
          y="358"
          textAnchor="middle"
          className="fill-slate-700 text-[13px] font-medium"
        >
          Dhaka
        </text>
      </g>
      <g>
        <circle cx="250" cy="190" r="8" className="fill-emerald-600" />
        <text
          x="250"
          y="175"
          textAnchor="middle"
          className="fill-slate-600 text-[12px]"
        >
          Gazipur
        </text>
      </g>
      <g>
        <circle cx="390" cy="75" r="10" className="fill-emerald-700" />
        <circle cx="390" cy="75" r="16" className="fill-emerald-600/20" />
        <text
          x="390"
          y="55"
          textAnchor="middle"
          className="fill-slate-700 text-[13px] font-medium"
        >
          Pabna
        </text>
      </g>
      <g>
        <circle cx="175" cy="280" r="7" className="fill-teal-600" />
        <text
          x="145"
          y="275"
          textAnchor="end"
          className="fill-slate-500 text-[11px]"
        >
          Cumilla
        </text>
      </g>
      <g>
        <circle cx="430" cy="200" r="7" className="fill-teal-600" />
        <text
          x="448"
          y="204"
          textAnchor="start"
          className="fill-slate-500 text-[11px]"
        >
          Bogura
        </text>
      </g>
      {/* Parcel marker */}
      <g transform="translate(255 215)">
        <rect
          x="-14"
          y="-12"
          width="28"
          height="24"
          rx="4"
          className="fill-white stroke-emerald-700"
          strokeWidth="2"
        />
        <path d="M-14 0 H14 M0 -12 V12" className="stroke-emerald-600" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
