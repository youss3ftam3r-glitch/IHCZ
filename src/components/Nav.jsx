import React from 'react';

const LINKS = ['CATALOG', 'BMW', 'JDM', 'CONTACT'];

export default function Nav({ progress }) {
  // Nav stays a ghost throughout hero; once past the reveal (progress > 0.9)
  // it can pick up a touch more presence, matching brief section 5.
  const settled = progress > 0.9;

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '28px 5vw',
        background: 'transparent',
        transition: 'padding 0.4s ease',
      }}
    >
      <div
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 20,
          letterSpacing: '0.04em',
          color: '#f3efe9',
          opacity: 0.95,
        }}
      >
        INHOUSECARBONZ
      </div>
      <div style={{ display: 'flex', gap: 36 }}>
        {LINKS.map((link) => (
          <a
            key={link}
            href="#"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              fontWeight: 300,
              letterSpacing: '0.18em',
              color: '#f3efe9',
              textDecoration: 'none',
              opacity: settled ? 0.7 : 0.25,
              transition: 'opacity 0.25s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = settled ? 0.7 : 0.25)}
          >
            {link}
          </a>
        ))}
      </div>
    </nav>
  );
}
