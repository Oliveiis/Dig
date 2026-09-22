export function Wordmark() {
  return <svg className="dig-wordmark" viewBox="0 0 110 70" role="img" aria-label="dig">
    <g fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 9v35M32 33c0-17-23-17-23 0s23 17 23 0M49 25v20M86 33c0-17-23-17-23 0s23 17 23 0v15c0 14-15 17-22 9"/>
    </g>
    <ellipse className="wordmark-leaf" cx="50" cy="12" rx="5" ry="7" transform="rotate(35 50 12)"/>
    <circle cx="102" cy="45" r="4" fill="currentColor"/>
  </svg>;
}
