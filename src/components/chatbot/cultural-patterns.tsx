"use client"

export function SohraiPattern({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Traditional Sohrai art pattern inspired by Jharkhand tribal art */}
      <g opacity="0.1">
        {/* Central flower motif */}
        <circle cx="100" cy="100" r="30" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="100" cy="100" r="20" stroke="currentColor" strokeWidth="1" fill="none" />
        <circle cx="100" cy="100" r="10" stroke="currentColor" strokeWidth="1" fill="currentColor" />

        {/* Petals around center */}
        <ellipse cx="100" cy="70" rx="8" ry="15" fill="currentColor" />
        <ellipse cx="130" cy="100" rx="15" ry="8" fill="currentColor" />
        <ellipse cx="100" cy="130" rx="8" ry="15" fill="currentColor" />
        <ellipse cx="70" cy="100" rx="15" ry="8" fill="currentColor" />

        {/* Corner decorative elements */}
        <path d="M20 20 Q30 10 40 20 Q30 30 20 20" fill="currentColor" />
        <path d="M180 20 Q170 10 160 20 Q170 30 180 20" fill="currentColor" />
        <path d="M20 180 Q30 170 40 180 Q30 190 20 180" fill="currentColor" />
        <path d="M180 180 Q170 170 160 180 Q170 190 180 180" fill="currentColor" />

        {/* Connecting lines */}
        <line x1="40" y1="40" x2="60" y2="60" stroke="currentColor" strokeWidth="1" />
        <line x1="160" y1="40" x2="140" y2="60" stroke="currentColor" strokeWidth="1" />
        <line x1="40" y1="160" x2="60" y2="140" stroke="currentColor" strokeWidth="1" />
        <line x1="160" y1="160" x2="140" y2="140" stroke="currentColor" strokeWidth="1" />
      </g>
    </svg>
  )
}

export function KohbarPattern({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Traditional Kohbar art pattern */}
      <g opacity="0.08">
        {/* Bamboo grove pattern */}
        <rect x="20" y="20" width="4" height="110" fill="currentColor" />
        <rect x="35" y="15" width="4" height="120" fill="currentColor" />
        <rect x="50" y="25" width="4" height="100" fill="currentColor" />
        <rect x="65" y="10" width="4" height="130" fill="currentColor" />
        <rect x="80" y="20" width="4" height="110" fill="currentColor" />
        <rect x="95" y="15" width="4" height="120" fill="currentColor" />
        <rect x="110" y="25" width="4" height="100" fill="currentColor" />
        <rect x="125" y="18" width="4" height="114" fill="currentColor" />

        {/* Leaves */}
        <ellipse cx="25" cy="40" rx="8" ry="3" fill="currentColor" transform="rotate(45 25 40)" />
        <ellipse cx="42" cy="35" rx="8" ry="3" fill="currentColor" transform="rotate(-30 42 35)" />
        <ellipse cx="55" cy="50" rx="8" ry="3" fill="currentColor" transform="rotate(60 55 50)" />
        <ellipse cx="72" cy="30" rx="8" ry="3" fill="currentColor" transform="rotate(-45 72 30)" />
        <ellipse cx="85" cy="45" rx="8" ry="3" fill="currentColor" transform="rotate(30 85 45)" />
        <ellipse cx="100" cy="40" rx="8" ry="3" fill="currentColor" transform="rotate(-60 100 40)" />
        <ellipse cx="115" cy="55" rx="8" ry="3" fill="currentColor" transform="rotate(45 115 55)" />
        <ellipse cx="130" cy="38" rx="8" ry="3" fill="currentColor" transform="rotate(-30 130 38)" />
      </g>
    </svg>
  )
}
