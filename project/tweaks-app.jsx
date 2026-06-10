/* ============================================================
   Tweaks app — drives shared CSS variables on both pages.
   Lets the user dial in the liquid-glass look & blue accent.
   ============================================================ */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#2A6FDB",
  "glassBlur": 22,
  "glassStyle": "frosted",
  "headlineFont": "Plus Jakarta Sans",
  "tickerSpeed": 46
}/*EDITMODE-END*/;

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + amt)));
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}
function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r}, ${g}, ${b}, ${a})`; }

const GLASS = {
  clear:   { tint: 'rgba(255,255,255,0.46)', edge: 'rgba(13,27,62,0.06)', sat: 1.4 },
  frosted: { tint: 'rgba(255,255,255,0.62)', edge: 'rgba(13,27,62,0.07)', sat: 1.7 },
  tinted:  { tint: 'rgba(236,243,255,0.66)', edge: 'rgba(42,111,219,0.14)', sat: 1.9 }
};

const FONTS = {
  'Plus Jakarta Sans': "'Plus Jakarta Sans', system-ui, sans-serif",
  'Space Grotesk':     "'Space Grotesk', system-ui, sans-serif",
  'Inter':             "'Inter', system-ui, sans-serif"
};

function ensureFont(name) {
  if (name === 'Plus Jakarta Sans') return; // already loaded
  const id = 'tw-font-' + name.replace(/\s/g, '');
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id; link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=' + name.replace(/\s/g, '+') +
    ':wght@400;500;600;700;800&display=swap';
  document.head.appendChild(link);
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    const root = document.documentElement.style;
    // accent
    root.setProperty('--blue', t.accent);
    root.setProperty('--blue-ink', shade(t.accent, -50));
    root.setProperty('--blue-soft', rgba(t.accent, 0.10));
    root.setProperty('--blue-tint', rgba(t.accent, 0.06));
    // glass
    root.setProperty('--glass-blur', t.glassBlur + 'px');
    const g = GLASS[t.glassStyle] || GLASS.frosted;
    root.setProperty('--glass-tint', g.tint);
    root.setProperty('--glass-edge', g.edge);
    // font
    ensureFont(t.headlineFont);
    root.setProperty('--font', FONTS[t.headlineFont]);
    // ticker speed (landing only)
    document.querySelectorAll('.ticker-track').forEach(tr => {
      tr.style.animationDuration = t.tickerSpeed + 's';
    });
  }, [t]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Accent" />
      <TweakColor label="Blue accent" value={t.accent}
        options={['#2A6FDB', '#1E6BFF', '#2E8BD8', '#5B5BF0', '#0E8C73']}
        onChange={(v) => setTweak('accent', v)} />

      <TweakSection label="Liquid glass" />
      <TweakRadio label="Glass style" value={t.glassStyle}
        options={['clear', 'frosted', 'tinted']}
        onChange={(v) => setTweak('glassStyle', v)} />
      <TweakSlider label="Frost amount" value={t.glassBlur} min={6} max={36} step={2} unit="px"
        onChange={(v) => setTweak('glassBlur', v)} />

      <TweakSection label="Type" />
      <TweakRadio label="Headline font" value={t.headlineFont}
        options={['Plus Jakarta Sans', 'Space Grotesk', 'Inter']}
        onChange={(v) => setTweak('headlineFont', v)} />

      <TweakSection label="Hero" />
      <TweakSlider label="Ticker speed" value={t.tickerSpeed} min={20} max={80} step={2} unit="s"
        onChange={(v) => setTweak('tickerSpeed', v)} />
    </TweaksPanel>
  );
}

(function mountTweaks() {
  const el = document.createElement('div');
  el.id = 'tweaks-root';
  document.body.appendChild(el);
  ReactDOM.createRoot(el).render(<App />);
})();
