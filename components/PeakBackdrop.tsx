export default function PeakBackdrop() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        maskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 90%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 90%)',
      }}
      preserveAspectRatio="xMidYMax slice"
      viewBox="0 0 1200 400"
      aria-hidden="true"
    >
      <circle cx="850" cy="60" r="1.5" fill="#E4C473" opacity="0.6" />
      <circle cx="920" cy="100" r="1" fill="#E4C473" opacity="0.4" />
      <circle cx="300" cy="40" r="1" fill="#E4C473" opacity="0.5" />
      <circle cx="1000" cy="40" r="1.5" fill="#E4C473" opacity="0.5" />

      <polygon points="0,400 0,260 220,140 420,260 420,400" fill="#14171B" />
      <polygon points="300,400 300,220 560,70 820,220 820,400" fill="#1C2025" />
      <polygon points="650,400 650,250 900,120 1200,250 1200,400" fill="#14171B" />
      <polygon
        points="560,70 500,180 620,180"
        fill="#C19955"
        opacity="0.35"
      />
    </svg>
  )
}