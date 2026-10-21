import React from 'react';
import logo from '../assets/logo.svg'; // чтобы поставить официальный логотип, замените этот файл (svg/png, тогда поправьте расширение в импорте)

export default function Logo({ className = 'h-9' }) {
  return <img src={logo} alt="Центр гематологии, Астана" className={`w-auto ${className}`} />;
}
