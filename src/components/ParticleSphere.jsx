import { useEffect, useRef } from "react";

// Brand visual: a slowly rotating sphere of teal-cyan to white dots (plain canvas, no library).
export default function ParticleSphere({ className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Points spread evenly over a sphere (Fibonacci lattice).
    const N = 900;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const pts = Array.from({ length: N }, (_, i) => {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      return { x: Math.cos(golden * i) * r, y, z: Math.sin(golden * i) * r, pink: i % 37 === 0 };
    });

    let angle = 0;
    let raf = 0;
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, w * dpr);
      canvas.height = Math.max(1, h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.42;
      const cx = w / 2;
      const cy = h / 2;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      for (const p of pts) {
        const x = p.x * c + p.z * s;
        const z = -p.x * s + p.z * c;
        const depth = (z + 1) / 2; // 0 = back, 1 = front
        ctx.fillStyle = p.pink
          ? `rgba(253,233,255,${0.4 + depth * 0.6})`
          : `rgba(${Math.round(203 * depth)},${Math.round(130 + 125 * depth)},${Math.round(124 + 128 * depth)},${0.2 + depth * 0.8})`;
        ctx.beginPath();
        ctx.arc(cx + x * R, cy + p.y * R, 0.6 + depth * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduce) {
        angle += 0.003;
        raf = requestAnimationFrame(draw);
      }
    };

    resize();
    draw();
    const observer = new ResizeObserver(() => {
      resize();
      if (reduce) draw();
    });
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}
