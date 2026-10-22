import React from 'react';

// Собственные комикс-значки (не товарные знаки): щит со звездой и вспышка.
export function Emblem({ className = 'h-12 w-12' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Значок закупа">
      <path d="M32 3 57 12v20c0 14-10 24-25 29C17 56 7 46 7 32V12z" fill="#E62429" stroke="#000" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M32 11 50 17v15c0 10-7 17-18 21-11-4-18-11-18-21V17z" fill="#FFD23F" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M33 16 22 35h8l-3 13 13-21h-8z" fill="#12204A" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function Burst({ className = 'h-24 w-24', children }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path d="M50 2l9 20 18-12-3 22 22 2-17 15 17 15-22 2 3 22-18-12-9 20-9-20-18 12 3-22-22-2 17-15L8 41l22-2-3-22 18 12z" fill="#FFD23F" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <div className="relative flex h-full w-full items-center justify-center text-center font-display text-xl leading-none text-accent [text-shadow:1.5px_1.5px_0_#000]">{children}</div>
    </div>
  );
}
