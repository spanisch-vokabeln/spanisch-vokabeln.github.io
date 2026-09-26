import React, { useState, useEffect, useRef, useMemo } from 'react';
import { buildWordPool, vocabByGrade } from '../data/vocab';
import { bilderquizThemes } from '../data/bilderquiz';
import FloatingBack from './FloatingBack';
import { storageGet, storageSet } from '../utils/storage';

// ─── Games Hub Menu ──────────────────────────────────────────────────────────
export default function GamesHub({ selectedGrades, onBack }) {
  const [game, setGame] = useState(null);
  const [scores, setScores] = useState(() => ({
    survival:  Number(storageGet('gm_survival')  || 0),
    timeattack: Number(storageGet('gm_timeattack') || 0),
    streak:    Number(storageGet('gm_streak')    || 0),
    bilderquiz: Number(storageGet('gm_bilderquiz') || 0),
  }));

  const saveScore = (type, val) => {
    setScores(s => ({ ...s, [type]: val }));
    storageSet(`gm_${type}`, val);
  };

  // No grade selected → play with all grades. Deduplicate identical es/de pairs.
  const wordPool = useMemo(() => {
    const grades = selectedGrades.length ? selectedGrades : Object.keys(vocabByGrade);
    const seen = new Set();
    return buildWordPool(grades).filter(w => {
      const k = `${w.es}|${w.de}`;
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
  }, [selectedGrades]);

  if (game === 'survival')   return <ArcadeGame key="survival"   type="survival"   wordPool={wordPool} highscore={scores.survival}   onSave={v => saveScore('survival',v)}   onBack={() => setGame(null)} />;
  if (game === 'timeattack') return <ArcadeGame key="timeattack" type="timeattack" wordPool={wordPool} highscore={scores.timeattack} onSave={v => saveScore('timeattack',v)} onBack={() => setGame(null)} />;
  if (game === 'streak')     return <ArcadeGame key="streak"     type="streak"     wordPool={wordPool} highscore={scores.streak}    onSave={v => saveScore('streak',v)}    onBack={() => setGame(null)} />;
  if (game === 'bilderquiz') return <BilderquizView highscore={scores.bilderquiz} onSave={v => saveScore('bilderquiz',v)} onBack={() => setGame(null)} />;

  return (
    <>
    <FloatingBack onClick={onBack} />
    <div className="animate-slide-up space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="px-4 py-2.5 bg-rose-100 dark:bg-rose-950 hover:bg-rose-200 dark:hover:bg-rose-900 active:scale-95 text-rose-700 dark:text-rose-300 font-semibold text-sm rounded-xl transition-all">← Zurück</button>
        <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">Juegos de práctica</h2>
      </div>

      {selectedGrades.length > 0 && (
        <div className="text-xs text-center text-gray-400">{wordPool.length} Wörter aus {selectedGrades.length} Klasse(n) · Klassenübergreifend spielen</div>
      )}
      {selectedGrades.length === 0 && (
        <div className="text-xs text-center text-violet-500 font-medium">{wordPool.length} Wörter aus allen Klassen (keine Klasse ausgewählt) · Wähle auf der Startseite Klassen für gezielteres Training</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <GameCard
          icon="❤️" bg="var(--game-bg-red)" color="#dc2626"
          title="Modo Supervivencia"
          desc="3 Leben · Timer beschleunigt mit jedem Treffer"
          badge={`Rekord: ${scores.survival} Pkt.`}
          btnLabel="Jugar ❤️"
          btnColor="#dc2626"
          disabled={!wordPool.length}
          onClick={() => setGame('survival')}
        />
        <GameCard
          icon="⏱️" bg="var(--game-bg-green)" color="#16a34a"
          title="Modo Contrarreloj"
          desc="60 Sekunden · Richtig +2s, Falsch −1s"
          badge={`Rekord: ${scores.timeattack} Pkt.`}
          btnLabel="Jugar ⏱️"
          btnColor="#16a34a"
          disabled={!wordPool.length}
          onClick={() => setGame('timeattack')}
        />
        <GameCard
          icon="🔥" bg="var(--game-bg-amber)" color="#d97706"
          title="Racha de Vocabulario"
          desc="Unbegrenzte Zeit · Ein Fehler beendet die Serie"
          badge={`Rekord: ${scores.streak} Treffer`}
          btnLabel="Jugar 🔥"
          btnColor="#d97706"
          disabled={!wordPool.length}
          onClick={() => setGame('streak')}
        />
        <GameCard
          icon="🖼️" bg="var(--game-bg-blue)" color="#0284c7"
          title="Quiz de Imágenes"
          desc="Bild → Wort oder Wort → Bild"
          badge={`Rekord: ${scores.bilderquiz} Treffer`}
          btnLabel="Jugar 🖼️"
          btnColor="#0284c7"
          onClick={() => setGame('bilderquiz')}
        />
      </div>
    </div>
    </>
  );
}

function GameCard({ icon, bg, color, title, desc, badge, btnLabel, btnColor, onClick, disabled }) {
  return (
    <div className={`card flex flex-col justify-between transition-all ${disabled ? 'opacity-50' : 'hover:shadow-xl'}`} style={{ background: bg }}>
      <div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3" style={{ background: `${color}22` }}>
          {icon}
        </div>
        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-xs mb-3">{desc}</p>
        <div className="text-xs font-bold" style={{ color }}>{badge}</div>
      </div>
      <button onClick={disabled ? undefined : onClick} disabled={disabled} className="btn mt-4 text-white text-sm font-bold" style={{ background: disabled ? '#9ca3af' : btnColor }}>
        {disabled ? 'Klasse wählen ↩' : btnLabel}
      </button>
    </div>
  );
}

// ─── Arcade Game (Survival / Time Attack / Streak) ───────────────────────────
const TIME_ATTACK_MS = 60000;
const SURVIVAL_START_MS = 10000;

const shuffled = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Picks up to `count` distractor texts. A candidate is skipped if its answer text
// equals the correct one or if its prompt text is the same as the question's
// (e.g. "gut" → bien / bueno: both would be correct).
function pickDistractors(pool, item, isEsToDe, count = 3) {
  const promptOf = w => (isEsToDe ? w.es : w.de);
  const answerOf = w => (isEsToDe ? w.de : w.es);
  const seen = new Set([answerOf(item)]);
  const out = [];
  const tryAdd = (w) => {
    const text = answerOf(w);
    if (seen.has(text) || promptOf(w) === promptOf(item)) return;
    seen.add(text); out.push(text);
  };
  for (let tries = 0; tries < 60 && out.length < count; tries++) {
    tryAdd(pool[Math.floor(Math.random() * pool.length)]);
  }
  // Small pools: scan everything from a random offset
  const offset = Math.floor(Math.random() * pool.length);
  for (let k = 0; k < pool.length && out.length < count; k++) {
    tryAdd(pool[(offset + k) % pool.length]);
  }
  return out;
}

function ArcadeGame({ type, wordPool, highscore, onSave, onBack }) {
  const [score, setScore]     = useState(0);
  const [lives, setLives]     = useState(3);
  const [timeLeft, setTimeLeft]     = useState(SURVIVAL_START_MS);
  const [timeLeftSec, setTimeLeftSec] = useState(TIME_ATTACK_MS / 1000);
  const [question, setQuestion]  = useState(null);
  const [gameOver, setGameOver]  = useState(false);
  const [feedback, setFeedback]  = useState(null);
  const [fbShow, setFbShow]      = useState(false);
  const [newRecord, setNewRecord] = useState(false);
  const [showExit, setShowExit]  = useState(false);

  // Refs hold the live game values so timers never read stale state
  const speedRef   = useRef(SURVIVAL_START_MS);
  const scoreRef   = useRef(0);
  const livesRef   = useRef(3);
  const overRef    = useRef(false);
  const highRef    = useRef(highscore);
  const timersRef  = useRef([]);
  // Survival: remaining ms of the current question while its timer is paused
  const survivalRemRef = useRef({ qid: null, ms: SURVIVAL_START_MS });
  // Time attack: deadline while running, remaining ms while paused
  const deadlineRef = useRef(0);
  const taRemRef    = useRef(TIME_ATTACK_MS);

  const later = (fn, ms) => { timersRef.current.push(setTimeout(fn, ms)); };
  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
  useEffect(() => clearTimers, []);

  const updateScore = (v) => { scoreRef.current = v; setScore(v); };
  const updateLives = (v) => { livesRef.current = v; setLives(v); };

  const genQuestion = () => {
    if (!wordPool.length || overRef.current) return;
    const item = wordPool[Math.floor(Math.random() * wordPool.length)];
    const isEsToDe = Math.random() > 0.5;
    const correct  = isEsToDe ? item.de : item.es;
    const opts = shuffled([correct, ...pickDistractors(wordPool, item, isEsToDe)]);
    setQuestion({ id: `${item.es}-${Date.now()}-${Math.random()}`, text: isEsToDe ? `¿Qué significa '${item.es}'?` : `Was bedeutet '${item.de}'?`, opts, correct, topic: item.topic });
    setFeedback(null); setFbShow(false);
    if (type === 'survival') setTimeLeft(speedRef.current);
  };

  const endGame = () => {
    if (overRef.current) return;
    overRef.current = true;
    clearTimers();
    setGameOver(true);
    const final = scoreRef.current;
    if (final > highRef.current) { setNewRecord(true); onSave(final); }
  };

  const loseLife = () => {
    const nl = livesRef.current - 1;
    updateLives(nl);
    later(() => { if (nl <= 0) endGame(); else genQuestion(); }, 1200);
  };

  const startGame = () => {
    clearTimers();
    overRef.current = false;
    highRef.current = highscore;
    updateScore(0); updateLives(3);
    setGameOver(false); setNewRecord(false);
    setFeedback(null); setFbShow(false);
    speedRef.current = SURVIVAL_START_MS;
    taRemRef.current = TIME_ATTACK_MS;
    setTimeLeft(SURVIVAL_START_MS);
    setTimeLeftSec(TIME_ATTACK_MS / 1000);
    genQuestion();
  };

  useEffect(() => { startGame(); }, [type]);

  // Survival timer (paused during feedback and the exit dialog)
  useEffect(() => {
    if (gameOver || type !== 'survival' || fbShow || showExit || !question) return;
    const qid = question.id;
    const rem = survivalRemRef.current;
    const deadline = Date.now() + (rem.qid === qid ? rem.ms : speedRef.current);
    const iv = setInterval(() => {
      const left = Math.max(0, deadline - Date.now());
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(iv);
        setFeedback({ isCorrect: false, picked: null }); setFbShow(true);
        loseLife();
      }
    }, 50);
    return () => {
      clearInterval(iv);
      survivalRemRef.current = { qid, ms: Math.max(0, deadline - Date.now()) };
    };
  }, [question?.id, gameOver, fbShow, showExit, type]);

  // Time attack clock (deadline-based, paused during the exit dialog)
  useEffect(() => {
    if (gameOver || type !== 'timeattack' || showExit) return;
    deadlineRef.current = Date.now() + taRemRef.current;
    const tick = () => {
      const left = deadlineRef.current - Date.now();
      setTimeLeftSec(Math.max(0, Math.ceil(left / 1000)));
      if (left <= 0) { clearInterval(iv); endGame(); }
    };
    const iv = setInterval(tick, 200);
    tick();
    return () => {
      clearInterval(iv);
      taRemRef.current = Math.max(0, deadlineRef.current - Date.now());
    };
  }, [gameOver, type, showExit]);

  const adjustClock = (ms) => {
    deadlineRef.current += ms;
    setTimeLeftSec(Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)));
  };

  const pick = (opt) => {
    if (fbShow || gameOver) return;
    const isCorrect = opt === question.correct;
    setFeedback({ isCorrect, picked: opt }); setFbShow(true);
    if (isCorrect) {
      const ns = scoreRef.current + 1;
      updateScore(ns);
      if (type === 'timeattack') adjustClock(2000);
      else if (type === 'survival') speedRef.current = Math.max(2500, SURVIVAL_START_MS - ns * 150);
      later(genQuestion, 400);
    } else if (type === 'timeattack') {
      adjustClock(-1000);
      later(genQuestion, 600);
    } else if (type === 'survival') {
      loseLife();
    } else {
      // Streak: the first mistake ends the run
      later(endGame, 1200);
    }
  };

  const restart = startGame;

  const pct = type === 'survival' ? (timeLeft / speedRef.current) * 100 : Math.min(100, (timeLeftSec / 60) * 100);
  const barColor = type === 'survival'
    ? (pct > 50 ? '#6366f1' : pct > 25 ? '#f59e0b' : '#dc2626')
    : (timeLeftSec > 20 ? '#16a34a' : timeLeftSec > 8 ? '#f59e0b' : '#dc2626');

  const typeConfig = {
    survival:   { label: '❤️ Supervivencia', scoreLabel: 'Punkte' },
    timeattack: { label: '⏱️ Contrarreloj',  scoreLabel: 'Punkte' },
    streak:     { label: '🔥 Racha',          scoreLabel: 'Treffer' },
  };
  const cfg = typeConfig[type];

  return (
    <div className="relative">
      <div className="card animate-slide-up">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setShowExit(true)} className="text-gray-400 hover:text-red-500 font-semibold text-sm">← Salir</button>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{cfg.scoreLabel}: <span className="text-gray-900 dark:text-gray-100">{score}</span></span>
            {type === 'survival'   && <span>{[1,2,3].map(h => <span key={h}>{h <= lives ? '❤️' : '🖤'}</span>)}</span>}
            {type === 'timeattack' && <span className="font-bold text-emerald-600">⏱️ {timeLeftSec}s</span>}
            {type === 'streak'     && <span className="font-bold text-amber-500">🏆 {highscore}</span>}
          </div>
        </div>

        {!gameOver && type !== 'streak' && (
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full mb-6 overflow-hidden">
            <div className="h-full transition-all duration-75 rounded-full" style={{ width: `${pct}%`, background: barColor }} />
          </div>
        )}

        {question && !gameOver && (
          <div>
            <div className="mb-5 p-4 sm:p-5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
              {question.topic && <span className="text-xs font-bold text-indigo-500 uppercase tracking-wide block mb-1">{question.topic}</span>}
              <p className="text-base sm:text-xl font-bold dark:text-gray-100">{question.text}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {question.opts.map((opt, i) => {
                let cls = 'btn-outline';
                if (fbShow) {
                  if (opt === question.correct) cls = 'border-2 bg-green-100 dark:bg-green-950 border-green-500 text-green-800 dark:text-green-200';
                  else if (opt === feedback?.picked) cls = 'border-2 bg-red-100 dark:bg-red-950 border-red-500 text-red-800 dark:text-red-200 animate-shake';
                  else cls = 'btn-outline opacity-40';
                }
                return (
                  <button key={i} onClick={() => pick(opt)} disabled={fbShow}
                    className={`btn text-left py-3 text-sm ${cls}`}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {gameOver && (
          <div className="text-center py-4 space-y-4 animate-slide-up">
            <div className="text-5xl">{newRecord ? '🏆' : '🎮'}</div>
            <h3 className="text-2xl font-extrabold">¡Fin de la partida!</h3>
            {newRecord && <p className="text-emerald-600 font-bold animate-bounce">¡NUEVO RÉCORD! 🎉</p>}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 max-w-xs mx-auto">
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Puntuación:</span>
                <span className="font-bold dark:text-gray-100">{score}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500 dark:text-gray-400">Récord:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{highscore}</span>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={restart} className="btn btn-primary">Jugar de nuevo</button>
              <button onClick={onBack} className="btn btn-outline">Menú</button>
            </div>
          </div>
        )}
      </div>

      {showExit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <h3 className="text-xl font-bold dark:text-gray-100">¿Abandonar el juego?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Aktuelle Punkte gehen verloren. Rekorde bleiben gespeichert.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={onBack} className="btn bg-red-500 hover:bg-red-600 text-white">Sí, salir</button>
              <button onClick={() => setShowExit(false)} className="btn btn-outline">Weiterspielen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bilderquiz ───────────────────────────────────────────────────────────────
function BilderquizView({ highscore, onSave, onBack }) {
  const [theme, setTheme] = useState(null);
  const [tick, setTick]   = useState(0);

  if (theme) {
    return (
      <BilderquizGame
        key={theme.id + '-' + tick}
        theme={theme}
        highscore={highscore}
        onSave={onSave}
        onExit={() => { setTheme(null); setTick(t => t + 1); }}
      />
    );
  }

  const mezcla = { id: 'mezcla', title: 'Mix (alle Themen)', emoji: '🎲', words: bilderquizThemes.flatMap(t => t.words) };

  return (
    <div className="card animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="px-4 py-2.5 bg-rose-100 dark:bg-rose-950 hover:bg-rose-200 dark:hover:bg-rose-900 active:scale-95 text-rose-700 dark:text-rose-300 font-semibold text-sm rounded-xl transition-all">← Zurück</button>
        <span>🖼️</span>
      </div>
      <h2 className="text-2xl font-extrabold text-center mb-2 dark:text-gray-100">Quiz de Imágenes</h2>
      <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">Thema wählen und Bild-Vokabeln lernen</p>

      <button onClick={() => setTheme(mezcla)}
        className="w-full mb-4 p-4 rounded-2xl border-2 border-sky-200 dark:border-sky-800 bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950 dark:to-indigo-950 hover:shadow-lg transition-all flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎲</span>
          <div className="text-left">
            <div className="font-bold dark:text-gray-100">Mix (alle Themen)</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{mezcla.words.length} Wörter gemischt</div>
          </div>
        </div>
        <span className="text-sky-600 dark:text-sky-400 font-bold text-sm">Rekord: {Number(storageGet('bq_mezcla') || 0)}</span>
      </button>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {bilderquizThemes.map(t => {
          const best = Number(storageGet(`bq_${t.id}`) || 0);
          return (
            <button key={t.id} onClick={() => setTheme(t)}
              className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-sky-300 hover:shadow-lg bg-white dark:bg-gray-800 transition-all flex flex-col items-center text-center">
              <span className="text-4xl mb-1">{t.emoji}</span>
              <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{t.title}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{t.words.length} Wörter</span>
              {best > 0 && <span className="text-xs font-bold text-sky-600 mt-1">⭐ {best}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BilderquizGame({ theme, highscore, onSave, onExit }) {
  const bestKey = `bq_${theme.id}`;
  const shuffle = (arr) => [...arr].map(v => ({ v, s: Math.random() })).sort((a, b) => a.s - b.s).map(({ v }) => v);

  const [current, setCurrent] = useState(null);
  const [opts, setOpts]       = useState([]);
  const [round, setRound]     = useState(0);
  const [score, setScore]     = useState(0);
  const [streak, setStreak]   = useState(0);
  const [best, setBest]       = useState(() => Number(storageGet(bestKey) || 0));
  const [locked, setLocked]   = useState(false);
  const [picked, setPicked]   = useState(null);
  const [mode, setMode]       = useState('img2word');
  const timerRef = useRef(null);

  const clearTimer = () => { clearTimeout(timerRef.current); timerRef.current = null; };
  useEffect(() => clearTimer, []);

  const next = (prev) => {
    clearTimer();
    const pool = prev ? theme.words.filter(w => w.es !== prev.es) : theme.words;
    const word = pool[Math.floor(Math.random() * pool.length)];
    const dist = shuffle(theme.words.filter(w => w.es !== word.es)).slice(0, 3);
    setOpts(shuffle([word, ...dist]));
    setCurrent(word); setRound(r => r + 1);
    setLocked(false); setPicked(null);
  };

  useEffect(() => { next(null); }, [theme.id]);

  const switchMode = (m) => { if (m === mode) return; setMode(m); next(null); };

  const speak = (text) => {
    try {
      const u = new SpeechSynthesisUtterance(text.replace(/^(el|la|los|las) /, ''));
      u.lang = 'es-ES';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (_) {}
  };

  const pick = (opt) => {
    if (locked || !current) return;
    setLocked(true); setPicked(opt);
    const ok = opt.es === current.es;
    if (ok) {
      setScore(s => s + 1);
      const ns = streak + 1; setStreak(ns);
      if (ns > best) { setBest(ns); storageSet(bestKey, ns); if (ns > highscore) onSave(ns); }
      speak(current.es);
    } else setStreak(0);
    const cur = current;
    timerRef.current = setTimeout(() => next(cur), ok ? 850 : 1400);
  };

  if (!current) return null;

  const renderVisual = (word, size) => word.art
    ? <div style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: word.art }} />
    : <div style={{ fontSize: Math.round(size * 0.58), lineHeight: 1 }} className="bq-pop">{word.emoji}</div>;

  return (
    <div className="card animate-slide-up max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-3">
        <button onClick={onExit} className="px-4 py-2.5 bg-rose-100 dark:bg-rose-950 hover:bg-rose-200 dark:hover:bg-rose-900 active:scale-95 text-rose-700 dark:text-rose-300 font-semibold text-sm rounded-xl transition-all">← Salir</button>
        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{theme.emoji} {theme.title}</span>
        <span className="text-sm font-bold text-amber-500">🏆 {best}</span>
      </div>

      <div className="flex justify-center gap-6 mb-3 text-sm">
        <span className="font-bold text-orange-500">🔥 {streak}</span>
        <span className="font-bold text-emerald-600">✓ {score}</span>
      </div>

      <div className="flex justify-center mb-4">
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
          {[['img2word','🖼️→🔤'],['word2img','🔤→🖼️']].map(([m,l]) => (
            <button key={m} onClick={() => switchMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === m ? 'bg-white dark:bg-gray-700 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {mode === 'img2word' ? (
        <>
          <div key={round} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-center mb-4 shadow-inner" style={{ height: 200 }}>
            {renderVisual(current, 170)}
          </div>
          <div className="text-center mb-3 h-6">
            {!locked && <p className="text-gray-400 dark:text-gray-500 text-sm">¿Qué palabra corresponde?</p>}
            {locked && picked?.es === current.es && <p className="text-emerald-600 font-bold">¡Correcto! ({current.de})</p>}
            {locked && picked?.es !== current.es && <p className="text-red-500 font-bold">La respuesta es «{current.es}» ({current.de})</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {opts.map(opt => {
              let cls = 'btn-outline';
              if (locked && opt.es === current.es) cls = 'bg-emerald-500 text-white border-emerald-500';
              else if (locked && picked?.es === opt.es) cls = 'bg-red-500 text-white border-red-500 animate-shake';
              return <button key={opt.es} disabled={locked} onClick={() => pick(opt)} className={`btn py-4 text-base font-bold ${cls}`}>{opt.es}</button>;
            })}
          </div>
        </>
      ) : (
        <>
          <div key={round} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-center mb-4 shadow-inner" style={{ height: 100 }}>
            <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-300 bq-pop">{current.es}</span>
          </div>
          <div className="text-center mb-3 h-6">
            {!locked && <p className="text-gray-400 dark:text-gray-500 text-sm">¿Qué imagen corresponde?</p>}
            {locked && picked?.es === current.es && <p className="text-emerald-600 font-bold">¡Correcto! ({current.de})</p>}
            {locked && picked?.es !== current.es && <p className="text-red-500 font-bold">({current.de})</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {opts.map(opt => {
              let ring = 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-sky-300';
              if (locked && opt.es === current.es) ring = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950';
              else if (locked && picked?.es === opt.es) ring = 'border-red-500 bg-red-50 dark:bg-red-950 animate-shake';
              return (
                <button key={opt.es} disabled={locked} onClick={() => pick(opt)}
                  className={`rounded-2xl border-2 flex items-center justify-center transition-all ${ring}`} style={{ height: 110 }}>
                  {renderVisual(opt, 88)}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
