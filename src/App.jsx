import React, { useState, useRef } from 'react';
import CarScene from './scenes/CarScene.jsx';
import Nav from './components/Nav.jsx';
import SoundToggle from './components/SoundToggle.jsx';
import ScrollCopy from './components/ScrollCopy.jsx';

export default function App() {
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef(null);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Nav progress={progress} />
      <SoundToggle />

      {/* Fixed 3D canvas layer */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1 }}>
        <CarScene progress={progress} />
      </div>

      {/* Scrollable text/content layer driving progress */}
      <div ref={scrollRef} style={{ position: 'relative', zIndex: 2 }}>
        <ScrollCopy onProgress={setProgress} />
      </div>
    </div>
  );
}
