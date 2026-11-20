import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Timer, RotateCcw, Shuffle, Eye, EyeOff, Settings2, Dices } from 'lucide-react';
import SpinWheel from './SpinWheel';
import {
  displayName,
  fullDisplayName,
  makeGroups,
  shuffle,
  sortStudents,
  DISPLAY_MODES,
} from '../../utils/rosterUtils';
import {
  loadGameState,
  saveGameState,
  loadGamePrefs,
  saveGamePrefs,
} from '../../utils/rosterStorage';
import { playPop, playWinFanfare } from '../../utils/classroomGameAudio';

const TABS = [
  { key: 'wheel', label: '🎡 วงล้อสุ่ม' },
  { key: 'groups', label: '👥 แบ่งกลุ่ม' },
  { key: 'order', label: '🎯 จับฉลากลำดับ' },
  { key: 'options', label: '⚙️ ตัวเลือก/เช็กคนไม่มา' },
];

const TIMER_CHOICES = [
  { sec: 30, label: '30 วินาที' },
  { sec: 60, label: '1 นาที' },
  { sec: 120, label: '2 นาที' },
  { sec: 180, label: '3 นาที' },
  { sec: 300, label: '5 นาที' },
  { sec: 600, label: '10 นาที' },
];

/**
 * Classroom games for the fullscreen clock: spin wheel (fair draw), group maker, order draw,
 * linked to the activity timer. Student data never leaves this browser.
 *
 * Props: defaultClassGroup, rosters, volume (0 = muted), onClose(), onStartTimer(seconds), onOpenRosterManager(classGroup)
 */
export default function ClassroomGamesPanel({
  defaultClassGroup = '',
  rosters = {},
  volume = 60,
  onClose,
  onStartTimer,
  onOpenRosterManager,
}) {
  const rosterGroups = useMemo(
    () =>
      Object.keys(rosters)
        .filter((g) => (rosters[g]?.students || []).length > 0)
        .sort((a, b) => a.localeCompare(b, 'th', { numeric: true })),
    [rosters]
  );

  const [pickedGroup, setPickedGroup] = useState('');
  const group =
    (pickedGroup && rosterGroups.includes(pickedGroup) && pickedGroup) ||
    (defaultClassGroup && rosterGroups.includes(defaultClassGroup) && defaultClassGroup) ||
    rosterGroups[0] ||
    '';

  const [tab, setTab] = useState('wheel');
  const [prefs, setPrefs] = useState(() => loadGamePrefs());
  const [timerSec, setTimerSec] = useState(60);

  // Per-class progress: absent students + students already drawn this round
  const [gs, setGs] = useState(() => ({ group, ...loadGameState(group) }));
  let cur = gs;
  if (gs.group !== group) {
    cur = { group, ...loadGameState(group) };
    setGs(cur);
  }
  // Latest game state for callbacks that run later (e.g. after the wheel stops)
  const gsRef = useRef(cur);
  useEffect(() => {
    gsRef.current = cur;
  });

  const updateGs = (patch) => {
    const next = { ...gsRef.current, ...patch };
    gsRef.current = next;
    setGs(next);
    if (next.group) saveGameState(next.group, next);
  };

  const updatePrefs = (patch) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    saveGamePrefs(next);
  };

  const allStudents = useMemo(
    () =>
      sortStudents(
        (rosters[group]?.students || []).filter((s) => (s.firstName || s.lastName || '').trim())
      ),
    [rosters, group]
  );
  const present = allStudents.filter((s) => !cur.absent.includes(s.id));
  const wheelPool = prefs.fair ? present.filter((s) => !cur.drawn.includes(s.id)) : present;
  const labelOf = (s) => displayName(s, prefs.displayMode, prefs.hideSurname);

  const [winner, setWinner] = useState(null);

  // Group maker state
  const [groupMode, setGroupMode] = useState('count');
  const [groupValue, setGroupValue] = useState(4);
  const [groupMethod, setGroupMethod] = useState('random');
  const [groupResult, setGroupResult] = useState([]);

  // Order draw state
  const [orderList, setOrderList] = useState([]);
  const [revealed, setRevealed] = useState(0);

  const handleWheelResult = (item) => {
    const student = allStudents.find((s) => s.id === item.id);
    setWinner(student || null);
    if (prefs.fair) {
      const drawn = gsRef.current.drawn;
      if (!drawn.includes(item.id)) updateGs({ drawn: [...drawn, item.id] });
    }
  };

  const handleStartTimer = () => {
    onStartTimer?.(timerSec);
    onClose?.();
  };

  const handleMakeGroups = () => {
    setGroupResult(makeGroups(present, { mode: groupMode, value: groupValue, method: groupMethod }));
    playPop(volume);
  };

  const handleDrawOrder = () => {
    setOrderList(shuffle(present));
    setRevealed(0);
    playWinFanfare(volume);
  };

  const toggleAbsent = (id) => {
    const absent = cur.absent.includes(id) ? cur.absent.filter((x) => x !== id) : [...cur.absent, id];
    updateGs({ absent, drawn: cur.drawn.filter((x) => x !== id) });
    setWinner(null);
    setGroupResult([]);
    setOrderList([]);
  };

  const resetRound = () => {
    updateGs({ drawn: [] });
    setWinner(null);
  };

  const chipCls = (active) =>
    `px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
      active
        ? 'bg-indigo-600 text-white border-indigo-400'
        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
    }`;
  const selectCls =
    'px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500';

  const timerBar = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-400 inline-flex items-center gap-1">
        <Timer className="w-3.5 h-3.5" /> เวลาตอบ:
      </span>
      <select value={timerSec} onChange={(e) => setTimerSec(Number(e.target.value))} className={selectCls}>
        {TIMER_CHOICES.map((c) => (
          <option key={c.sec} value={c.sec}>
            {c.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleStartTimer}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
      >
        <Timer className="w-3.5 h-3.5" />
        เริ่มจับเวลา
      </button>
    </div>
  );

  const panel = (
    <div
      className="fixed inset-0 z-[120] bg-slate-950 text-white flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="เครื่องมือสุ่มและแบ่งกลุ่ม"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 py-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-fuchsia-600 flex items-center justify-center">
            <Dices className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-lg leading-tight">เครื่องมือหน้าห้องเรียน</div>
            <div className="text-[11px] text-slate-400">
              {group
                ? `ห้อง ${group} • มา ${present.length}/${allStudents.length} คน`
                : 'ยังไม่มีรายชื่อนักเรียน'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {rosterGroups.length > 0 && (
            <select
              value={group}
              onChange={(e) => {
                setPickedGroup(e.target.value);
                setWinner(null);
                setGroupResult([]);
                setOrderList([]);
              }}
              className={selectCls}
              aria-label="เลือกห้อง"
            >
              {rosterGroups.map((g) => (
                <option key={g} value={g}>
                  ห้อง {g}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 hover:text-rose-200 text-slate-200 text-xs font-semibold border border-slate-700"
          >
            <X className="w-4 h-4" />
            ปิด (ESC)
          </button>
        </div>
      </div>

      {rosterGroups.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <Users className="w-12 h-12 text-slate-600" />
          <div className="text-lg font-bold">ยังไม่มีรายชื่อนักเรียน</div>
          <p className="text-sm text-slate-400 max-w-md">
            เพิ่มรายชื่อนักเรียนของแต่ละห้องก่อน (วางจาก Excel หรืออัปโหลดไฟล์ได้) แล้วจึงใช้วงล้อสุ่มและแบ่งกลุ่มได้
          </p>
          <button
            type="button"
            onClick={() => onOpenRosterManager?.(defaultClassGroup)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold"
          >
            ไปเพิ่มรายชื่อนักเรียน
          </button>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2 px-4 sm:px-8 py-3 border-b border-slate-800">
            {TABS.map((t) => (
              <button key={t.key} type="button" onClick={() => setTab(t.key)} className={chipCls(tab === t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5">
            {/* WHEEL */}
            {tab === 'wheel' && (
              <div className="grid lg:grid-cols-2 gap-8 items-start max-w-6xl mx-auto">
                <div>
                  <SpinWheel
                    items={wheelPool.map((s) => ({ id: s.id, label: labelOf(s) }))}
                    volume={volume}
                    onSpinStart={() => setWinner(null)}
                    onResult={handleWheelResult}
                  />
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prefs.fair}
                        onChange={(e) => updatePrefs({ fair: e.target.checked })}
                      />
                      ⚖️ สุ่มแบบยุติธรรม (ไม่สุ่มซ้ำจนครบรอบ)
                    </label>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                      <span>
                        {prefs.fair
                          ? `เหลือในรอบนี้ ${wheelPool.length}/${present.length} คน`
                          : `ในวงล้อ ${wheelPool.length} คน (สุ่มซ้ำได้)`}
                      </span>
                      {prefs.fair && (
                        <button
                          type="button"
                          onClick={resetRound}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                        >
                          <RotateCcw className="w-3 h-3" />
                          เริ่มรอบใหม่
                        </button>
                      )}
                    </div>
                    {prefs.fair && present.length > 0 && wheelPool.length === 0 && (
                      <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-sm">
                        🎉 สุ่มครบทุกคนแล้ว กด &quot;เริ่มรอบใหม่&quot; เพื่อสุ่มต่อ
                      </div>
                    )}
                  </div>

                  {winner && (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-fuchsia-600/30 border border-fuchsia-500/40 text-center space-y-3 animate-in zoom-in-95 duration-300">
                      <div className="text-xs font-bold text-fuchsia-300">🎉 คนที่ได้รับเลือก</div>
                      <div className="text-4xl sm:text-5xl font-extrabold tracking-tight break-words">
                        {labelOf(winner)}
                      </div>
                      {prefs.displayMode !== 'full' && (
                        <div className="text-xs text-slate-400">
                          เลขที่ {winner.number}
                        </div>
                      )}
                      <div className="pt-1 flex justify-center">{timerBar}</div>
                    </div>
                  )}

                  {!winner && <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">{timerBar}</div>}

                  {cur.drawn.length > 0 && prefs.fair && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-500">สุ่มไปแล้วในรอบนี้ ({cur.drawn.length})</div>
                      <div className="flex flex-wrap gap-1.5">
                        {cur.drawn.map((id) => {
                          const s = allStudents.find((x) => x.id === id);
                          return s ? (
                            <span key={id} className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px]">
                              {labelOf(s)}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* GROUPS */}
            {tab === 'groups' && (
              <div className="max-w-6xl mx-auto space-y-5">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-end gap-4">
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-slate-400">แบ่งตาม</div>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => setGroupMode('count')} className={chipCls(groupMode === 'count')}>
                        จำนวนกลุ่ม
                      </button>
                      <button type="button" onClick={() => setGroupMode('size')} className={chipCls(groupMode === 'size')}>
                        จำนวนคนต่อกลุ่ม
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-slate-400">
                      {groupMode === 'count' ? 'กี่กลุ่ม' : 'กี่คนต่อกลุ่ม'}
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, present.length)}
                      value={groupValue}
                      onChange={(e) => setGroupValue(Math.max(1, Number(e.target.value) || 1))}
                      className="w-24 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-slate-400">วิธีจัด</div>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => setGroupMethod('random')} className={chipCls(groupMethod === 'random')}>
                        🎲 สุ่ม
                      </button>
                      <button type="button" onClick={() => setGroupMethod('mixed')} className={chipCls(groupMethod === 'mixed')}>
                        🔀 คละตามเลขที่
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleMakeGroups}
                    disabled={present.length === 0}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-400 hover:to-fuchsia-400 disabled:opacity-50 text-white text-sm font-extrabold"
                  >
                    <Shuffle className="w-4 h-4" />
                    {groupResult.length > 0 ? 'จัดกลุ่มใหม่' : 'แบ่งกลุ่ม'}
                  </button>
                </div>

                {groupResult.length > 0 && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {groupResult.map((members, gi) => (
                      <div key={gi} className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-extrabold text-indigo-300">กลุ่ม {gi + 1}</div>
                          <div className="text-[11px] text-slate-500">{members.length} คน</div>
                        </div>
                        <ul className="space-y-1">
                          {members.map((s) => (
                            <li key={s.id} className="text-base font-semibold text-slate-100">
                              {labelOf(s)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ORDER */}
            {tab === 'order' && (
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-slate-300">
                    จับฉลากลำดับการนำเสนอ/ตอบคำถาม จากนักเรียนที่มา {present.length} คน
                  </div>
                  <button
                    type="button"
                    onClick={handleDrawOrder}
                    disabled={present.length === 0}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-400 hover:to-fuchsia-400 disabled:opacity-50 text-white text-sm font-extrabold"
                  >
                    <Shuffle className="w-4 h-4" />
                    {orderList.length > 0 ? 'จับฉลากใหม่' : 'จับฉลากลำดับ'}
                  </button>
                </div>

                {orderList.length > 0 && (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRevealed((r) => Math.min(orderList.length, r + 1));
                          playPop(volume);
                        }}
                        disabled={revealed >= orderList.length}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        เปิดคนถัดไป ({revealed}/{orderList.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevealed(orderList.length)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                      >
                        เปิดทั้งหมด
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevealed(0)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        ซ่อนทั้งหมด
                      </button>
                      <div className="ml-auto">{timerBar}</div>
                    </div>

                    <ol className="space-y-2">
                      {orderList.map((s, i) => {
                        const shown = i < revealed;
                        return (
                          <li
                            key={s.id}
                            className={`flex items-center gap-4 px-5 py-3 rounded-2xl border transition-colors ${
                              shown
                                ? 'bg-slate-900 border-indigo-500/40'
                                : 'bg-slate-900/40 border-slate-800 text-slate-600'
                            }`}
                          >
                            <span
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 ${
                                shown ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              {i + 1}
                            </span>
                            <span className="text-xl sm:text-2xl font-bold">
                              {shown ? labelOf(s) : '• • • • •'}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  </>
                )}
              </div>
            )}

            {/* OPTIONS */}
            {tab === 'options' && (
              <div className="max-w-4xl mx-auto space-y-5">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Settings2 className="w-4 h-4 text-indigo-400" />
                    การแสดงชื่อบนจอใหญ่
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <select
                      value={prefs.displayMode}
                      onChange={(e) => updatePrefs({ displayMode: e.target.value })}
                      className={selectCls}
                    >
                      {DISPLAY_MODES.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prefs.hideSurname}
                        onChange={(e) => updatePrefs({ hideSurname: e.target.checked })}
                      />
                      ย่อนามสกุลเป็นตัวอักษรแรก (เมื่อแสดงชื่อ-นามสกุล)
                    </label>
                  </div>
                  <div className="text-[11px] text-slate-500">ตัวอย่าง: {allStudents[0] ? labelOf(allStudents[0]) : '-'}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-bold">
                      เช็กคนไม่มา (ข้ามคนเหล่านี้ในการสุ่ม/แบ่งกลุ่ม) — ไม่มา {cur.absent.length} คน
                    </div>
                    {cur.absent.length > 0 && (
                      <button
                        type="button"
                        onClick={() => updateGs({ absent: [] })}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                      >
                        ล้างรายการไม่มา
                      </button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                    {allStudents.map((s) => {
                      const isAbsent = cur.absent.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleAbsent(s.id)}
                          className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left text-sm transition-colors ${
                            isAbsent
                              ? 'bg-rose-950/50 border-rose-800 text-rose-200 line-through'
                              : 'bg-slate-800/60 border-slate-700 text-slate-100 hover:bg-slate-800'
                          }`}
                        >
                          <span className="truncate">
                            <span className="text-slate-500 mr-2 no-underline">{s.number}</span>
                            {fullDisplayName({ ...s, prefix: '' })}
                          </span>
                          <span className="text-[10px] font-bold shrink-0">{isAbsent ? 'ไม่มา' : 'มา'}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenRosterManager?.(group)}
                    className="text-xs font-semibold text-indigo-300 hover:text-indigo-200 underline"
                  >
                    แก้ไขรายชื่อนักเรียนห้องนี้
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  return createPortal(panel, document.body);
}
