import React from 'react';

export default function VineBorder({ width = '100%' }) {
  // width can be a percentage like '100%' or a number like '300'
  const isPercent = typeof width === 'string' && width.includes('%');
  
  return (
    <svg width={width} height="20" style={{ display:'block', margin:'8px 0', overflow: 'visible' }}>
      {/* We use a simple path that can stretch if it's 100% or conform to the fixed width */}
      {isPercent ? (
        <path
          d="M0 10 Q 25 2 50 10 T 100 10"
          fill="none"
          stroke="#22C55E"
          strokeWidth="1"
          strokeDasharray="1000"
          strokeDashoffset="1000"
          style={{ animation: 'vineGrow 2s ease-out forwards', vectorEffect: 'non-scaling-stroke' }}
          opacity="0.5"
          transform="scale(10, 1)"
        />
      ) : (
        <path
          d={`M0 10 Q${parseInt(width)*0.25} 2 ${parseInt(width)*0.5} 10 Q${parseInt(width)*0.75} 18 ${parseInt(width)} 10`}
          fill="none"
          stroke="#22C55E"
          strokeWidth="1"
          strokeDasharray="1000"
          strokeDashoffset="1000"
          style={{ animation: 'vineGrow 2s ease-out forwards' }}
          opacity="0.5"
        />
      )}
      
      {/* Leaf nodes along vine */}
      {[0.2, 0.5, 0.8].map((pos, i) => (
        <circle key={i}
          cx={`${pos * 100}%`}
          cy="10"
          r="3"
          fill="#22C55E"
          opacity="0.6"
          style={{ animation: `sprout 0.5s ${0.5 + i * 0.3}s ease-out both` }}
        />
      ))}
    </svg>
  )
}
