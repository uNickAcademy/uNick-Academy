'use client'

export function UNickorn({ size = 200 }: { size?: number }) {
  return (
    <div className="animate-float" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
      >
        {/* Body */}
        <ellipse cx="100" cy="130" rx="55" ry="45" fill="#c4b5fd" />

        {/* Legs */}
        <rect x="68" y="158" width="14" height="28" rx="7" fill="#a78bfa" />
        <rect x="88" y="162" width="14" height="24" rx="7" fill="#a78bfa" />
        <rect x="108" y="162" width="14" height="24" rx="7" fill="#a78bfa" />
        <rect x="128" y="158" width="14" height="28" rx="7" fill="#a78bfa" />

        {/* Tail */}
        <path
          d="M45 140 Q20 120 30 100 Q40 80 45 105 Q50 125 35 135"
          stroke="#f0abfc"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M45 145 Q15 130 22 108 Q28 90 38 112"
          stroke="#c084fc"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Head */}
        <ellipse cx="130" cy="88" rx="38" ry="34" fill="#ddd6fe" />

        {/* Snout */}
        <ellipse cx="155" cy="100" rx="16" ry="12" fill="#ede9fe" />

        {/* Nostrils */}
        <circle cx="151" cy="103" r="2" fill="#c4b5fd" />
        <circle cx="159" cy="103" r="2" fill="#c4b5fd" />

        {/* Eye */}
        <ellipse cx="125" cy="82" rx="9" ry="10" fill="white" />
        <ellipse cx="126" cy="83" rx="5" ry="6" fill="#4c1d95" />
        <circle cx="128" cy="81" r="2" fill="white" />

        {/* Eyelashes */}
        <line x1="117" y1="76" x2="114" y2="72" stroke="#4c1d95" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="121" y1="73" x2="120" y2="69" stroke="#4c1d95" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="125" y1="72" x2="125" y2="68" stroke="#4c1d95" strokeWidth="1.5" strokeLinecap="round" />

        {/* Ear */}
        <path d="M110 70 L102 52 L118 62 Z" fill="#a78bfa" />
        <path d="M110 70 L105 56 L115 64 Z" fill="#f0abfc" />

        {/* Horn */}
        <path d="M108 60 L100 20 L116 55 Z" fill="url(#hornGrad)" />
        <defs>
          <linearGradient id="hornGrad" x1="108" y1="60" x2="108" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fef3c7" />
          </linearGradient>
        </defs>

        {/* Horn sparkles */}
        <circle cx="95" cy="30" r="2" fill="#fbbf24" opacity="0.8" />
        <circle cx="115" cy="25" r="1.5" fill="#fbbf24" opacity="0.6" />
        <circle cx="88" cy="18" r="1" fill="#fbbf24" opacity="0.5" />

        {/* Mane */}
        <path d="M105 75 Q90 65 88 80 Q86 90 100 88" fill="#f0abfc" />
        <path d="M108 72 Q95 58 92 72 Q89 82 103 82" fill="#c084fc" />
        <path d="M112 70 Q100 55 97 68 Q94 78 108 76" fill="#e879f9" />

        {/* Stars/sparkles */}
        <text x="30" y="75" fontSize="14" fill="#fbbf24" opacity="0.7">✦</text>
        <text x="160" y="55" fontSize="10" fill="#c084fc" opacity="0.8">✦</text>
        <text x="50" y="105" fontSize="8" fill="#818cf8" opacity="0.6">✦</text>

        {/* Smile */}
        <path d="M148 107 Q155 113 163 107" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Blush */}
        <ellipse cx="142" cy="102" rx="6" ry="4" fill="#f9a8d4" opacity="0.5" />
      </svg>
    </div>
  )
}
