'use client';

interface ScoreRingProps {
  score: number;
  size?: number;
}

export function ScoreRing({ score, size = 48 }: ScoreRingProps) {
  const percentage = Math.round(score * 100);
  const color = percentage >= 80 ? 'text-green-500' : percentage >= 60 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - 4) / 2}
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - 4) / 2}
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeDasharray={`${percentage * 2.51} 251`}
          className={color}
        />
      </svg>
      <span className="absolute text-xs font-semibold">{percentage}</span>
    </div>
  );
}
