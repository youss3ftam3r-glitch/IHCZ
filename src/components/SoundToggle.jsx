import React, { useState, useRef } from 'react';

export default function SoundToggle() {
  const [on, setOn] = useState(false);
  const audioRef = useRef(null);

  function toggle() {
    if (!audioRef.current) return;
    if (on) {
      audioRef.current.pause();
    } else {
      audioRef.current.volume = 0.25;
      audioRef.current.play().catch(() => {});
    }
    setOn(!on);
  }

  return (
    <>
      {/* Swap src for a real loopable engine idle file before launch */}
      <audio ref={audioRef} loop src="/audio/engine-idle.mp3" />
      <button
        onClick={toggle}
        aria-label={on ? 'Mute engine sound' : 'Unmute engine sound'}
        style={{
          position: 'fixed',
          top: 28,
          right: '5vw',
          zIndex: 11,
          width: 0,
          height: 0,
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        {/* Intentionally tucked away — replaced by the icon below to avoid nav collision */}
      </button>
      <button
        onClick={toggle}
        aria-label={on ? 'Mute engine sound' : 'Unmute engine sound'}
        style={{
          position: 'fixed',
          top: 26,
          right: '1.6vw',
          zIndex: 11,
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: '1px solid rgba(243,239,233,0.25)',
          background: 'rgba(0,0,0,0.2)',
          color: '#f3efe9',
          fontSize: 13,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {on ? '♪' : '✕'}
      </button>
    </>
  );
}
