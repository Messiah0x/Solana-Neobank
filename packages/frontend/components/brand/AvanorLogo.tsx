interface Props {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export function AvanorLogo({ size = 32, showWordmark = true, className = '' }: Props) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* A mark */}
      <svg
        width={size * 0.75}
        height={size}
        viewBox="0 0 75 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="avanor-gold" x1="37.5" y1="0" x2="37.5" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D4AF7F" />
            <stop offset="100%" stopColor="#8B6914" />
          </linearGradient>
        </defs>
        {/* Outer A with inner shard cutout using evenodd rule */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M37.5 2 L0 98 L14 98 L37.5 22 L61 98 L75 98 L37.5 2 Z M37.5 62 L28 98 L47 98 Z"
          fill="url(#avanor-gold)"
        />
      </svg>

      {/* Wordmark */}
      {showWordmark && (
        <span
          className="font-heading font-bold tracking-[0.15em] text-ivory"
          style={{ fontSize: size * 0.5 }}
        >
          AVANOR
        </span>
      )}
    </div>
  );
}
