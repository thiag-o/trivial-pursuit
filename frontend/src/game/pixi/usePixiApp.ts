import { useEffect, useRef, useState, type RefObject } from 'react';
import { Application } from 'pixi.js';
import { CANVAS_SIZE } from '../constants';

export function usePixiApp(containerRef: RefObject<HTMLDivElement | null>) {
  const [app, setApp] = useState<Application | null>(null);
  const [error, setError] = useState<string | null>(null);
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let destroyed = false;
    const pixiApp = new Application();

    pixiApp
      .init({
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        background: 0x1a1a2e,
        antialias: true,
      })
      .then(() => {
        if (destroyed) {
          pixiApp.destroy(true, { children: true });
          return;
        }
        container.appendChild(pixiApp.canvas);
        appRef.current = pixiApp;
        setApp(pixiApp);
      })
      .catch(() => {
        if (!destroyed) {
          setError(
            'Seu navegador não suporta WebGL. Use Chrome ou Firefox atualizados.',
          );
        }
      });

    // Resize observer: CSS scale to fit container
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width } = entry.contentRect;
      const canvas = container.querySelector('canvas');
      if (canvas) {
        const scale = width / CANVAS_SIZE;
        canvas.style.transformOrigin = 'top left';
        canvas.style.transform = `scale(${scale})`;
      }
    });
    observer.observe(container);

    return () => {
      destroyed = true;
      observer.disconnect();
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
      setApp(null);
    };
  }, [containerRef]);

  return { app, error };
}
