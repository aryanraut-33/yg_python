// Small inline icons (no emoji, no icon font).
const common = {
  width: 18,
  height: 18,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function SunIcon() {
  return (
    <svg {...common}>
      <circle cx="10" cy="10" r="3.6" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const r = (a * Math.PI) / 180;
        return <line key={a} x1={10 + 6.4 * Math.cos(r)} y1={10 + 6.4 * Math.sin(r)} x2={10 + 8.4 * Math.cos(r)} y2={10 + 8.4 * Math.sin(r)} />;
      })}
    </svg>
  );
}

export function MoonIcon() {
  return (
    <svg {...common}>
      <path d="M16 12.5A6.5 6.5 0 0 1 7.5 4a6.5 6.5 0 1 0 8.5 8.5z" />
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg {...common} fill="currentColor" stroke="none">
      <path d="M6 4.2v11.6a.8.8 0 0 0 1.2.7l9.4-5.8a.8.8 0 0 0 0-1.4L7.2 3.5A.8.8 0 0 0 6 4.2z" />
    </svg>
  );
}

export function StopIcon() {
  return (
    <svg {...common} fill="currentColor" stroke="none">
      <rect x="5" y="5" width="10" height="10" rx="2" />
    </svg>
  );
}
