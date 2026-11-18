import React from 'react';

export const BrandLogo: React.FC<{ size?: number; className?: string }> = ({
  size = 44,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="oxcard-grad" x1="12" y1="8" x2="116" y2="120" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="32" fill="url(#oxcard-grad)" />
    <rect
      x="34"
      y="24"
      width="66"
      height="74"
      rx="14"
      transform="rotate(8 67 61)"
      fill="#93C5FD"
      fillOpacity="0.45"
    />
    <rect x="26" y="28" width="66" height="76" rx="14" fill="#FFFFFF" />
    <rect x="38" y="46" width="24" height="7" rx="3.5" fill="#2563EB" />
    <rect x="38" y="60" width="42" height="6" rx="3" fill="#BFDBFE" />
    <rect x="38" y="72" width="32" height="6" rx="3" fill="#DBEAFE" />
    <circle cx="76" cy="88" r="7" fill="#EFF6FF" />
    <path
      d="M73 88l2.2 2.2 4-4.2"
      stroke="#2563EB"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CuteCelebrationIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 160 120"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <circle cx="80" cy="64" r="46" fill="#EFF6FF" />
    <circle cx="80" cy="64" r="34" fill="#DBEAFE" />
    {/* Soft decorative dots & sparkles in calm blue shades */}
    <circle cx="30" cy="36" r="5" fill="#BFDBFE" />
    <circle cx="134" cy="40" r="4" fill="#93C5FD" />
    <circle cx="126" cy="92" r="5.5" fill="#DBEAFE" />
    <circle cx="34" cy="90" r="3.5" fill="#93C5FD" />
    <path
      d="M118 22l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z"
      fill="#60A5FA"
    />
    <path
      d="M42 20l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5L37 25l3.5-1.5L42 20z"
      fill="#3B82F6"
    />
    {/* Stacked white flashcard */}
    <rect
      x="54"
      y="30"
      width="54"
      height="66"
      rx="14"
      transform="rotate(7 81 63)"
      fill="#93C5FD"
      fillOpacity="0.45"
    />
    <rect
      x="52"
      y="28"
      width="56"
      height="68"
      rx="14"
      fill="#FFFFFF"
      stroke="#BFDBFE"
      strokeWidth="2"
    />
    {/* Big soft check circle */}
    <circle cx="80" cy="58" r="16" fill="#2563EB" />
    <path
      d="M73 58.2l4.8 4.8L87.5 53"
      stroke="#FFFFFF"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="65" y="81" width="30" height="5" rx="2.5" fill="#DBEAFE" />
  </svg>
);
