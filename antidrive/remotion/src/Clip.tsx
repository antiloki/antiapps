import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import type {ClipDef, Shot} from './clips';

// antiDrive palette, sampled from the Raft of the Medusa art.
const C = {bg: '#1c1b1a', panel: '#262523', rule: '#3a3835', ink: '#e5e2d8', dim: '#a09f99', red: '#b3171f', redText: '#e0787b'};
const SW = 1280, SH = 800; // screenshot size
const FW = 800, FH = 500; // window size inside the 960x600 frame
const FX = 80, FY = 54;

const Hatch: React.FC = () => (
  // engraving texture: fine diagonal hatching that slowly drifts
  <svg width={960} height={600} style={{position: 'absolute', opacity: 0.07}}>
    <defs><pattern id="h" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><line x1="0" y1="0" x2="0" y2="7" stroke={C.ink} strokeWidth="1" /></pattern></defs>
    <rect width="960" height="600" fill="url(#h)" />
  </svg>
);

const ShotView: React.FC<{s: Shot}> = ({s}) => {
  const f = useCurrentFrame();
  const local = f - s.from, len = s.to - s.from;
  const opacity = interpolate(local, [0, 8, len - 6, len], [0, 1, 1, s.to >= 180 ? 1 : 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const [cx, cy, z0, z1] = s.zoom ?? [640, 400, 1, 1.05];
  const z = interpolate(local, [0, len], [z0, z1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const scale = (FW / SW) * z;
  const tx = FW / 2 - cx * scale, ty = FH / 2 - cy * scale;
  const clampX = Math.min(0, Math.max(FW - SW * scale, tx)), clampY = Math.min(0, Math.max(FH - SH * scale, ty));
  let boxEl = null;
  if (s.box) {
    const [bx, by, bw, bh] = s.box;
    const per = 2 * (bw + bh) * scale;
    const draw = interpolate(local, [14, 40], [per, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
    const tagO = interpolate(local, [34, 46], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    boxEl = (
      <>
        <svg width={FW} height={FH} style={{position: 'absolute', left: 0, top: 0}}>
          <rect x={clampX + bx * scale} y={clampY + by * scale} width={bw * scale} height={bh * scale} rx={6} fill="rgba(179,23,31,.12)" stroke={C.red} strokeWidth={2.5} strokeDasharray={per} strokeDashoffset={draw} />
        </svg>
        {s.tag ? <div style={{position: 'absolute', left: clampX + bx * scale, top: clampY + (by + bh) * scale + 6, opacity: tagO, background: C.red, color: '#f4f1ea', font: '600 13px "IBM Plex Sans",sans-serif', padding: '3px 8px', borderRadius: 5}}>{s.tag}</div> : null}
      </>
    );
  }
  return (
    <div style={{position: 'absolute', inset: 0, opacity}}>
      <Img src={staticFile(s.img)} style={{position: 'absolute', left: clampX, top: clampY, width: SW * scale, height: SH * scale}} />
      {boxEl}
    </div>
  );
};

export const Clip: React.FC<{clip: ClipDef}> = ({clip}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const win = spring({frame: f, fps, config: {damping: 18, mass: 0.7}});
  const loopOut = interpolate(f, [168, 180], [1, 0], {extrapolateLeft: 'clamp'}); // fade to loop cleanly
  return (
    <AbsoluteFill style={{background: C.bg, fontFamily: '"IBM Plex Sans",sans-serif'}}>
      <Hatch />
      <div style={{position: 'absolute', left: 80, top: 22, color: C.redText, font: '500 13px "JetBrains Mono",monospace', letterSpacing: '.14em', textTransform: 'uppercase', opacity: interpolate(f, [0, 10], [0, 1])}}>{clip.title}</div>
      <div style={{position: 'absolute', left: FX, top: FY, width: FW, height: FH, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.rule}`, background: C.panel,
        boxShadow: '0 30px 80px rgba(0,0,0,.55)', transform: `translateY(${(1 - win) * 30}px) scale(${0.96 + win * 0.04})`, opacity: win * loopOut}}>
        {clip.shots.map((s, i) => (f >= s.from - 1 && f <= s.to + 1 ? <ShotView key={i} s={s} /> : null))}
        {(clip.insets ?? []).map((n, i) => {
          const p = spring({frame: f - n.from, fps, config: {damping: 16}});
          return <Img key={i} src={staticFile(n.img)} style={{position: 'absolute', left: n.x * (FW / 960), top: n.y * (FH / 600), width: n.w, borderRadius: 10, border: `1px solid ${C.rule}`, boxShadow: '0 20px 50px rgba(0,0,0,.6)', opacity: p, transform: `translateX(${(1 - p) * 60}px)`}} />;
        })}
        {(clip.typed ?? []).map((t, i) => {
          const n = Math.max(0, Math.floor((f - t.from) * 1.1));
          const o = interpolate(f - t.from, [0, 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const agent = t.who === 'Agent';
          return (
            <div key={i} style={{position: 'absolute', left: t.x * (FW / 960) - 60, top: t.y * (FH / 600) - 40, width: t.w, opacity: o, background: agent ? 'rgba(179,23,31,.14)' : C.bg, border: `1px solid ${agent ? C.red : C.rule}`, borderRadius: 10, padding: '10px 14px', color: C.ink, fontSize: 16}}>
              <div style={{font: '500 11px "JetBrains Mono",monospace', color: agent ? C.redText : C.dim, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4}}>{t.who}</div>
              {t.text.slice(0, n)}<span style={{opacity: n < t.text.length && f % 16 < 8 ? 1 : 0}}>▍</span>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 40, right: 40, top: FY + FH + 12, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', opacity: loopOut}}>
        {clip.chips.map((c, i) => {
          const p = spring({frame: f - c.from, fps, config: {damping: 15, mass: 0.6}});
          const active = f >= c.from && (i === clip.chips.length - 1 || f < clip.chips[i + 1].from);
          return <div key={i} style={{opacity: p, transform: `translateY(${(1 - p) * 14}px)`, padding: '6px 12px', borderRadius: 999, font: '500 14px "IBM Plex Sans",sans-serif',
            color: active ? '#f4f1ea' : C.dim, background: active ? C.red : C.panel, border: `1px solid ${active ? C.red : C.rule}`}}>{c.text}</div>;
        })}
      </div>
    </AbsoluteFill>
  );
};
