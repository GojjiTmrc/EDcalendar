import React, { useState, useRef, useEffect } from 'react';
import { secureRandomInt } from '../../utils/rosterUtils';
import { playTick, playWinFanfare } from '../../utils/classroomGameAudio';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#84cc16', '#ec4899'];
const SPIN_MS = 5200;
const SIZE = 400;
const C = SIZE / 2;
const R = 188;

function polar(angleDeg, radius) {
  const rad = ((angleDeg - 90) * Math.PI) / 180; // 0deg = top, clockwise
  return [C + radius * Math.cos(rad), C + radius * Math.sin(rad)];
}

function slicePath(i, step) {
  const [x1, y1] = polar(i * step, R);
  const [x2, y2] = polar((i + 1) * step, R);
  const large = step > 180 ? 1 : 0;
  return `M ${C} ${C} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
}

function sliceColor(i, n) {
  if (n > 1 && i === n - 1 && i % COLORS.length === 0) return '#64748b';
  return COLORS[i % COLORS.length];
}

/**
 * Spin wheel. items: [{ id, label }]. Calls onResult(item) when the wheel stops.
 * The winner is chosen up front with a crypto random number, then the wheel animates to it.
 */
export default function SpinWheel({ items, volume = 60, onSpinStart, onResult }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const timersRef = useRef([]);
  const rotationRef = useRef(0);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  const n = items.length;
  const step = n > 0 ? 360 / n : 360;

  const handleSpin = () => {
    if (spinning || n === 0) return;
    const winnerIndex = secureRandomInt(n);
    const center = (winnerIndex + 0.5) * step;
    const jitter = (Math.random() - 0.5) * step * 0.7;
    const current = rotationRef.current;
    const currentMod = ((current % 360) + 360) % 360;
    const targetMod = (((360 - center + jitter) % 360) + 360) % 360;
    const extraTurns = 5 + secureRandomInt(3);
    const delta = ((targetMod - currentMod + 360) % 360) + 360 * extraTurns;
    const next = current + delta;

    rotationRef.current = next;
    setRotation(next);
    setSpinning(true);
    onSpinStart?.();

    // Tick sounds: easeOutCubic => time for progress p is 1 - (1 - p)^(1/3)
    const crossings = Math.floor(delta / step);
    const maxTicks = 70;
    const every = Math.max(1, Math.ceil(crossings / maxTicks));
    for (let k = 1; k <= crossings; k += every) {
      const p = k / crossings;
      const t = (1 - Math.pow(1 - p, 1 / 3)) * SPIN_MS;
      timersRef.current.push(setTimeout(() => playTick(volume), t));
    }

    timersRef.current.push(
      setTimeout(() => {
        setSpinning(false);
        playWinFanfare(volume);
        onResult?.(items[winnerIndex]);
      }, SPIN_MS + 80)
    );
  };

  if (n === 0) {
    return (
      <div className="w-full aspect-square max-w-[420px] mx-auto rounded-full border-4 border-dashed border-slate-700 flex items-center justify-center text-slate-500 text-sm text-center p-8">
        ไม่มีรายชื่อให้สุ่มแล้ว
      </div>
    );
  }

  const fontSize = Math.max(9, Math.min(20, 330 / n));
  const maxChars = n > 30 ? 6 : n > 18 ? 9 : 14;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-[420px] aspect-square">
        {/* Pointer */}
        <div
          className="absolute left-1/2 -top-1 -translate-x-1/2 z-10 w-0 h-0 drop-shadow-lg"
          style={{
            borderLeft: '16px solid transparent',
            borderRight: '16px solid transparent',
            borderTop: '30px solid #f8fafc',
          }}
        />
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full h-full"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.215, 0.61, 0.355, 1)` : 'none',
          }}
          role="img"
          aria-label="วงล้อสุ่มรายชื่อ"
        >
          <circle cx={C} cy={C} r={R + 6} fill="#0f172a" stroke="#334155" strokeWidth="4" />
          {n === 1 ? (
            <circle cx={C} cy={C} r={R} fill={sliceColor(0, 1)} />
          ) : (
            items.map((it, i) => (
              <path key={it.id} d={slicePath(i, step)} fill={sliceColor(i, n)} stroke="#0f172a" strokeWidth="1.5" />
            ))
          )}
          {items.map((it, i) => {
            const mid = (i + 0.5) * step;
            const label = it.label.length > maxChars ? `${it.label.slice(0, maxChars)}…` : it.label;
            return (
              <text
                key={`t-${it.id}`}
                x={C + R - 14}
                y={C}
                transform={`rotate(${mid - 90} ${C} ${C})`}
                textAnchor="end"
                dominantBaseline="central"
                fontSize={fontSize}
                fontWeight="700"
                fill="#ffffff"
                style={{ paintOrder: 'stroke', stroke: 'rgba(15,23,42,0.45)', strokeWidth: 3 }}
              >
                {label}
              </text>
            );
          })}
          <circle cx={C} cy={C} r="22" fill="#0f172a" stroke="#f8fafc" strokeWidth="4" />
        </svg>
      </div>

      <button
        type="button"
        onClick={handleSpin}
        disabled={spinning}
        className="px-10 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-400 hover:to-fuchsia-400 disabled:opacity-60 text-white text-lg font-extrabold shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
      >
        {spinning ? 'กำลังหมุน...' : '🎡 หมุนวงล้อ!'}
      </button>
    </div>
  );
}
