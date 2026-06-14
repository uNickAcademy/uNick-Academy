export default function UnicornMascot({ className = 'h-24 w-24' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="uNickorn mascot"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="50" cy="60" rx="28" ry="24" fill="#38BDF8" />
      <path d="M30 45 L18 20 L40 38 Z" fill="#C0392B" />
      <path d="M38 40 L34 14 L48 36 Z" fill="#FFFFFF" />
      <circle cx="60" cy="50" r="5" fill="#1C2B4A" />
      <path d="M50 30 L56 8 L62 32 Z" fill="#FBBF24" />
      <path d="M70 60 q14 -4 16 8 q-10 4 -16 -8 Z" fill="#FFFFFF" opacity="0.85" />
    </svg>
  )
}
