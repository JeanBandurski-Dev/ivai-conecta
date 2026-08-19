// Ivaí Conecta Logo SVG — reutilizável em Navbar e Footer
const Logo = ({ size = 46, color = '#0052FF', accentColor = '#22C55E' }) => (
  <svg
    width={size}
    height={Math.round(size * 0.91)}
    viewBox="0 0 100 90"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="8" fill={color} />
    <rect x="9" y="32" width="14" height="48" rx="7" fill={color} />
    <path
      d="M 72 26 C 55 12 36 24 36 50 C 36 76 56 86 78 76"
      stroke={color}
      strokeWidth="14"
      strokeLinecap="round"
      fill="none"
    />
    <line x1="56" y1="36" x2="72" y2="20" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
    <line x1="72" y1="20" x2="88" y2="40" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
    <line x1="56" y1="36" x2="88" y2="40" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="72" cy="20" r="7" fill={accentColor} />
    <circle cx="56" cy="36" r="6" fill={color} />
    <circle cx="88" cy="40" r="6" fill={color} />
  </svg>
);

export default Logo;
