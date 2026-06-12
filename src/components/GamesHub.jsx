import React, { useState, useEffect, useRef } from 'react';
import { buildWordPool } from '../data/vocab';
import { bilderquizThemes } from '../data/bilderquiz';
import FloatingBack from './FloatingBack';

// ─── Games Hub Menu ──────────────────────────────────────────────────────────
export default function GamesHub({ selectedGrades, onBack }) {
  const [game, setGame] = useState(null);
  const [scores, setScores] = useState(() => ({
    survival:  Number(localStorage.getItem('gm_survival')  || 0),
    timeattack: Number(localStorage.getItem('gm_timeattack') || 0),
    streak:    Number(localStorage.getItem('gm_streak')    || 0),
    bilderquiz: Number(localStorage.getItem('gm_bilderquiz') || 0),
  }));

  const saveScore = (type, val) => {
    setScores(s => ({ ...s, [type]: val }));
    localStorage.setItem(`gm_${type}`, val);
  };

  const wordPool = buildWordPool(selectedGrades.length ? selectedGrades : []);

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
        <div className="text-xs text-center text-violet-500 font-medium">Alle Vokabeln (keine Klasse ausgewählt) · Wähle auf der Startseite Klassen für gezielteres Training</div>
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
          desc="Unbegrenzte Zeit · Längste Treffserie"
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
function ArcadeGame({ type, wordPool, highscore, onSave, onBack }) {
  const [score, setScore]     = useState(0);
  const [lives, setLives]     = useState(3);
  const [timeLeft, setTimeLeft]     = useState(10000);
  const [timeLeftSec, setTimeLeftSec] = useState(60);
  const [question, setQuestion]  = useState(null);
  const [gameOver, setGameOver]  = useState(false);
  const [feedback, setFeedback]  = useState(null);
  const [fbShow, setFbShow]      = useState(false);
  const [newRecord, setNewRecord] = useState(false);
  const [showExit, setShowExit]  = useState(false);
  const speedRef = useRef(10000);

  const genQuestion = () => {
    if (!wordPool.length) return;
    const item = wordPool[Math.floor(Math.random() * wordPool.length)];
    const isEsToDe = Math.random() > 0.5;
    const correct  = isEsToDe ? item.de : item.es;
    const pool     = [...new Set(wordPool.filter(w => w.es !== item.es).map(w => isEsToDe ? w.de : w.es))];
    const dist = pool.sort(() => Math.random() - 0.5).slice(0, 3);
    const opts = [correct, ...dist].sort(() => Math.random() - 0.5);
    setQuestion({ id: `${item.es}-${Date.now()}`, text: isEsToDe ? `¿Qué significa '${item.es}'?` : `Was bedeutet '${item.de}'?`, opts, correct, cat: item.cat });
    setFeedback(null); setFbShow(false);
    if (type === 'survival') setTimeLeft(speedRef.current);
  };

  useEffect(() => {
    setScore(0); setLives(3); setGameOver(false); setNewRecord(false);
    setFeedback(null); setFbShow(false);
    speedRef.current = 10000;
    if (type === 'timeattack') setTimeLeftSec(60);
    else setTimeLeft(10000);
    genQuestion();
  }, [type]);

  // Survival timer
  useEffect(() => {
    if (gameOver || type !== 'survival' || fbShow) return;
    const iv = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 50) { clearInterval(iv); timeout(); return 0; }
        return t - 50;
      });
    }, 50);
    return () => clearInterval(iv);
  }, [question?.id, gameOver, fbShow, type]);

  // Time attack clock
  useEffect(() => {
    if (gameOver || type !== 'timeattack') return;
    const iv = setInterval(() => {
      setTimeLeftSec(t => {
        if (t <= 1) { clearInterval(iv); endGame(score); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [gameOver, type, score]);

  const timeout = () => {
    setFeedback({ isCorrect: false, picked: null }); setFbShow(true);
    const nl = lives - 1; setLives(nl);
    setTimeout(() => { if (nl <= 0) endGame(score); else genQuestion(); }, 1200);
  };

  const pick = (opt) => {
    if (fbShow || gameOver) return;
    const isCorrect = opt === question.correct;
    setFeedback({ isCorrect, picked: opt }); setFbShow(true);
    const ns = isCorrect ? score + 1 : score;
    if (isCorrect) {
      setScore(ns);
      if (type === 'timeattack') setTimeLeftSec(t => t + 2);
      else if (type === 'survival') speedRef.current = Math.max(2500, 10000 - ns * 150);
      else if (type === 'streak' && ns > highscore) onSave(ns);
      setTimeout(() => genQuestion(), 400);
    } else {
      if (type === 'timeattack') { setTimeLeftSec(t => Math.max(0, t - 1)); setTimeout(() => genQuestion(), 600); }
      else if (type === 'survival') { const nl = lives - 1; setLives(nl); setTimeout(() => { if (nl <= 0) endGame(score); else genQuestion(); }, 1200); }
      else if (type === 'streak') { setTimeout(() => { setScore(0); genQuestion(); }, 1200); }
    }
  };

  const endGame = (final) => {
    setGameOver(true);
    if (final > highscore) { setNewRecord(true); onSave(final); }
  };

  const restart = () => {
    setScore(0); setLives(3); setGameOver(false); setNewRecord(false);
    setFeedback(null); setFbShow(false);
    speedRef.current = 10000;
    if (type === 'timeattack') setTimeLeftSec(60);
    else setTimeLeft(10000);
    genQuestion();
  };

  const pct = type === 'survival' ? (timeLeft / speedRef.current) * 100 : (timeLeftSec / 60) * 100;
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
          <div className="w-full bg-gray-100 h-2.5 rounded-full mb-6 overflow-hidden">
            <div className="h-full transition-all duration-75 rounded-full" style={{ width: `${pct}%`, background: barColor }} />
          </div>
        )}

        {question && !gameOver && (
          <div>
            <div className="mb-5 p-4 sm:p-5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
              {question.cat && <span className="text-xs font-bold text-indigo-500 uppercase tracking-wide block mb-1">{question.cat}</span>}
              <p className="text-base sm:text-xl font-bold dark:text-gray-100">{question.text}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {question.opts.map((opt, i) => {
                let cls = 'btn-outline';
                if (fbShow) {
                  if (opt === question.correct) cls = 'bg-green-100 border-green-500 text-green-800';
                  else if (opt === feedback?.picked) cls = 'bg-red-100 border-red-500 text-red-800 animate-shake';
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
        <span className="text-sky-600 dark:text-sky-400 font-bold text-sm">Rekord: {Number(localStorage.getItem('bq_mezcla') || 0)}</span>
      </button>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {bilderquizThemes.map(t => {
          const best = Number(localStorage.getItem(`bq_${t.id}`) || 0);
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
  const [best, setBest]       = useState(() => Number(localStorage.getItem(bestKey) || 0));
  const [locked, setLocked]   = useState(false);
  const [picked, setPicked]   = useState(null);
  const [mode, setMode]       = useState('img2word');

  const next = (prev) => {
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
      if (ns > best) { setBest(ns); localStorage.setItem(bestKey, ns); if (ns > highscore) onSave(ns); }
      speak(current.es);
    } else setStreak(0);
    const cur = current;
    setTimeout(() => next(cur), ok ? 850 : 1400);
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
            <span className="text-3xl font-extrabold text-indigo-600 bq-pop">{current.es}</span>
          </div>
          <div className="text-center mb-3 h-6">
            {!locked && <p className="text-gray-400 dark:text-gray-500 text-sm">¿Qué imagen corresponde?</p>}
            {locked && picked?.es === current.es && <p className="text-emerald-600 font-bold">¡Correcto! ({current.de})</p>}
            {locked && picked?.es !== current.es && <p className="text-red-500 font-bold">({current.de})</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {opts.map(opt => {
              let ring = 'border-gray-100 hover:border-sky-300';
              if (locked && opt.es === current.es) ring = 'border-emerald-500 bg-emerald-50';
              else if (locked && picked?.es === opt.es) ring = 'border-red-500 bg-red-50 animate-shake';
              return (
                <button key={opt.es} disabled={locked} onClick={() => pick(opt)}
                  className={`rounded-2xl border-2 bg-white dark:bg-gray-800 flex items-center justify-center transition-all ${ring}`} style={{ height: 110 }}>
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
