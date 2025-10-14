import React from 'react';
import ReactDOM from 'react-dom/client';
import { FullGridDemo } from './demo';
import 'react-day-picker/dist/style.css';

const rootElement = document.getElementById('root')!;

// 保存 root 实例以便 HMR 时重用
let root = (window as any).__REACT_ROOT__;
if (!root) {
  root = ReactDOM.createRoot(rootElement);
  (window as any).__REACT_ROOT__ = root;
}

root.render(
  <React.StrictMode>
    <FullGridDemo />
  </React.StrictMode>
);

