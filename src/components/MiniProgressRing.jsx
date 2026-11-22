import React from 'react';

export default function MiniProgressRing({ current, total, size = 64 }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const progressPercent = total === 0 ? 0 : (current / total);
  const cappedPercent = Math.min(progressPercent, 1);
  const offset = circumference - (cappedPercent * circumference);
  const isCompleted = current >= total && total > 0;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="#141d26" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="transparent" 
          stroke={isCompleted ? '#22c55e' : '#4ade80'} 
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease-in-out', filter: isCompleted ? 'drop-shadow(0 0 6px rgba(34,197,94,0.6))' : 'none' }}
        />
      </svg>
      <span style={{ fontSize: '13px', fontWeight: '900', color: isCompleted ? '#22c55e' : '#ffffff', lineHeight: '1', zIndex: 2 }}>
        {current}/{total}
      </span>
    </div>
  );
}
