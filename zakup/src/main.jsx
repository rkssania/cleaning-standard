import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { connect } from './lib/store.js';
import './index.css';

const root = createRoot(document.getElementById('root'));
root.render(<div className="p-8 text-center text-slate-500">Подключение…</div>);
// Общая база доступна только на странице claude.ai; без неё приложение работает локально.
connect().then((conn) => root.render(<App conn={conn} />));
