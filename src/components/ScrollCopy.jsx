import React, { useRef, useEffect } from 'react';

const BEATS = [
  {
    range: [0.0, 0.1],
    eyebrow: '',
    title: '',
    sub: '',
  },
  {
    range: [0.28, 0.40],
    eyebrow: 'HOOD &amp; FRONT LIP',
    title: 'EVERY PANEL EARNED ITS PLACE',
    sub: 'Carbon, shaped to flow.',
  },
  {
    range: [0.40, 0.56],
    eyebrow: 'GRILLE &amp; KIT',
    title: 'AGGRESSION, ENGINEERED',
    sub: 'Widebody. Wide stance. No compromise.',
  },
  {
    range: [0.58, 0.72],
    eyebrow: 'SIDE PROFILE',
    title: 'BUILT FOR THE LINE, NOT THE LOT',
    sub: 'This is what intent looks like from the side.',
  },
  {
    range: [0.74, 0.88],
    eyebrow: 'DIFFUSER &amp; WING',
    title: 'DOWNFORCE YOU CAN SEE',
    sub: 'Function first. Always.',
  },
  {
    range: [0.92, 1.0],
    eyebrow: 'INHOUSECARBONZ',
    title: 'BUILT BY PETROL HEADS.\nDRIVEN BY COMMUNITY.',
    sub: 'Shop the full widebody kit below.',
    cta: true,
  },
];

function useScrollProgress(onProgress) {
  const containerRef = useRef(null);

  useEffect(() => {
    function handleScroll() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const t = Math.max(0, Math.min(1, scrolled / total));
      onProgress(t);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onProgress]);

  return containerRef;
}

function Beat({ beat, progress }) {
  const [start, end] = beat.range;
  const mid = (start + end) / 2;
  const span = (end - start) / 2;
  const dist = Math.abs(progress - mid);
  const visible = dist < span;
  const opacity = visible ? 1 - dist / span : 0;

  if (!beat.title) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '9%',
        transform: `translateX(-50%) translateY(${visible ? 0 : 12}px)`,
        textAlign: 'center',
        opacity,
        transition: 'opacity 0.25s linear, transform 0.4s ease',
        pointerEvents: opacity > 0.5 ? 'auto' : 'none',
        zIndex: 3,
        width: '92%',
        maxWidth: 720,
      }}
    >
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.22em',
          color: '#a13a2f',
          marginBottom: 14,
        }}
        dangerouslySetInnerHTML={{ __html: beat.eyebrow }}
      />
      <h2
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(28px, 5vw, 56px)',
          color: '#f3efe9',
          letterSpacing: '0.02em',
          lineHeight: 1.08,
          margin: 0,
          whiteSpace: 'pre-line',
          textShadow: '0 4px 24px rgba(0,0,0,0.6)',
        }}
      >
        {beat.title}
      </h2>
      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 15,
          color: 'rgba(243,239,233,0.6)',
          marginTop: 14,
          fontWeight: 400,
        }}
      >
        {beat.sub}
      </p>
      {beat.cta && (
        <button
          style={{
            marginTop: 28,
            padding: '14px 36px',
            background: '#a13a2f',
            color: '#f3efe9',
            border: 'none',
            borderRadius: 2,
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Shop The Kit
        </button>
      )}
    </div>
  );
}

export default function ScrollCopy({ onProgress }) {
  const containerRef = useScrollProgress(onProgress);
  const [progress, setProgress] = React.useState(0);

  useEffect(() => {
    function handle() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const t = Math.max(0, Math.min(1, scrolled / total));
      setProgress(t);
    }
    window.addEventListener('scroll', handle, { passive: true });
    handle();
    return () => window.removeEventListener('scroll', handle);
  }, [containerRef]);

  return (
    <div ref={containerRef} style={{ height: '500vh', position: 'relative' }}>
      {BEATS.map((beat, i) => (
        <Beat key={i} beat={beat} progress={progress} />
      ))}

      {/* Scroll hint, only visible at the very start */}
      <div
        style={{
          position: 'fixed',
          left: '50%',
          bottom: '6%',
          transform: 'translateX(-50%)',
          opacity: progress < 0.04 ? 1 : 0,
          transition: 'opacity 0.4s ease',
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          letterSpacing: '0.2em',
          color: 'rgba(243,239,233,0.4)',
          textTransform: 'uppercase',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      >
        Scroll
      </div>

      {/* Credit, tucked quietly at the very bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          right: 12,
          fontFamily: "'Inter', sans-serif",
          fontSize: 9,
          color: 'rgba(243,239,233,0.18)',
          zIndex: 3,
        }}
      >
        3D model: BMW M4 Modified Widebody by{' '}
        <a href="https://sketchfab.com/3d-models/bmw-m4-modified-widebody-knitro-builds-6e325ec23a0f41c08366472b34b8f8c8" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>knitro_builds</a>
        {' '}— <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>CC BY 4.0</a>; materials and presentation adapted
      </div>
    </div>
  );
}
