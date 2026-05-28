import React from "react";

/** Animated leaf + circuit logo (inline SVG). */
export default function Logo({ size = 40, animated = true, className = "" }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={animated ? "transition-transform duration-500 hover:rotate-6" : ""}
      >
        <defs>
          <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#11653F" />
            <stop offset="100%" stopColor="#0B4A2D" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#EAE0C8" />
          </linearGradient>
        </defs>
        {/* leaf shape */}
        <path
          d="M32 4 C 16 12, 8 26, 10 44 C 12 56, 24 60, 32 60 C 48 58, 58 44, 56 26 C 54 14, 44 6, 32 4 Z"
          fill="url(#leafGrad)"
          stroke="url(#goldGrad)"
          strokeWidth="1.5"
        />
        {/* central vein */}
        <path
          d="M32 6 L32 58"
          stroke="url(#goldGrad)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        {/* circuit branches */}
        <g stroke="url(#goldGrad)" strokeWidth="1" fill="none">
          <path d="M32 20 L20 28" />
          <path d="M32 32 L44 38" />
          <path d="M32 42 L22 46" />
          <circle cx="20" cy="28" r="1.6" fill="#D4AF37" />
          <circle cx="44" cy="38" r="1.6" fill="#D4AF37" />
          <circle cx="22" cy="46" r="1.6" fill="#D4AF37" />
          <circle cx="32" cy="32" r="2.2" fill="#D4AF37" />
        </g>
      </svg>
    </div>
  );
}
