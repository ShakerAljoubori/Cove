interface CoveLogoProps {
  size?: number;
  className?: string;
}

function CoveLogo({ size = 32, className }: CoveLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="cove-logo-grad" x1="2" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7b9df9" />
          <stop offset="100%" stopColor="#e8997a" />
        </linearGradient>
      </defs>
      {/* Outer arc — main C shape */}
      <path
        d="M 24 9 A 13 13 0 1 0 24 28"
        stroke="url(#cove-logo-grad)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Inner arc — depth layer, suggests nested cove bay */}
      <path
        d="M 20 14 A 7 7 0 1 0 20 23"
        stroke="url(#cove-logo-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export default CoveLogo;
