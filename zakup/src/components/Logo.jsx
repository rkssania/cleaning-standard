import React from 'react';
import full from '../assets/logo.png'; // полный логотип: знак и название
import mark from '../assets/logo-mark.png'; // только знак (для шапки)

// Чтобы заменить логотип, подмените файлы в src/assets (PNG или SVG; для SVG поправьте расширение в импортах).
export default function Logo({ variant = 'full', className = 'h-24' }) {
  return <img src={variant === 'mark' ? mark : full} alt="Центр гематологии" className={`w-auto ${className}`} />;
}
