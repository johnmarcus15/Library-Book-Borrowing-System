import { useEffect } from 'react';
export default function Modal({ title, onClose, children }) {
  useEffect(() => { const h = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  return <div className="overlay" onMouseDown={onClose}><div className="modal card pad" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
    <div className="row between"><h2 style={{ margin: 0 }}>{title}</h2><button className="btn sm ghost" onClick={onClose} aria-label="Close">✕</button></div>{children}</div></div>;
}
