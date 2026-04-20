// BrandLogo component implementing the interlocking circular nodes logo
import React from 'react';

export function BrandLogo({ className }: { className?: string }) {
  const navy = "#001F5B";
  const emerald = "#009966";

  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* 8 Interlocking nodes */}
      {/* Nodes arranged in a circle at 45 degree intervals */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const r = 30; // Radius of the ring
        const cx = 50 + r * Math.cos(rad);
        const cy = 50 + r * Math.sin(rad);
        const color = i % 2 === 0 ? navy : emerald;
        
        return (
          <React.Fragment key={angle}>
            {/* Draw 'link' connections between nodes for interlocking feel */}
            <path 
              d={`M 50 50 L ${cx} ${cy}`} 
              stroke={color} 
              strokeWidth="4" 
              opacity="0.2"
            />
            {/* Node Circle */}
            <circle 
              cx={cx} 
              cy={cy} 
              r="7" 
              fill={color} 
              className="transition-all duration-300"
            />
            {/* Inner ring circle to show structure */}
            <circle 
              cx={cx} 
              cy={cy} 
              r="10" 
              stroke={color} 
              strokeWidth="2.5" 
              className="opacity-40"
            />
          </React.Fragment>
        );
      })}
      {/* Central focus */}
      <circle cx="50" cy="50" r="15" stroke={navy} strokeWidth="1" strokeDasharray="4 4" className="opacity-20" />
    </svg>
  );
}
