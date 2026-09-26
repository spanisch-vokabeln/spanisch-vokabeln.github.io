import React, { useState, forwardRef } from 'react';

const ACCENTS = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¡', '¿'];

// Text field for typed answers: no autocorrect/capitalisation on phones
export const AnswerInput = forwardRef(function AnswerInput({ className = '', ...props }, ref) {
  return (
    <input ref={ref} type="text"
      autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false}
      className={className}
      {...props} />
  );
});

// Accent buttons: insert at the cursor and keep the focus (and the phone keyboard) in the field.
// ⇧ toggles capitals; Shift+click inserts a single capital.
export function AccentKeys({ inputRef, value, onChange }) {
  const [upper, setUpper] = useState(false);

  const insert = (ch, shift) => {
    const el = inputRef.current;
    const text = (upper || shift) ? ch.toUpperCase() : ch;
    const start = el?.selectionStart ?? value.length;
    const end   = el?.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + text + value.slice(end));
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
  };

  // Prevent the button from taking the focus away from the input
  const keepFocus = e => e.preventDefault();
  const keyCls = 'w-9 h-9 border rounded-lg text-sm font-bold hover:bg-amber-50 dark:hover:bg-amber-950 hover:border-amber-300 transition-all';
  const idleCls = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-200';
  const onCls   = 'bg-amber-100 dark:bg-amber-900 border-amber-400 text-amber-700 dark:text-amber-200';

  return (
    <div className="flex flex-wrap gap-1.5 justify-center">
      <button type="button" onPointerDown={keepFocus} onMouseDown={keepFocus}
        onClick={() => setUpper(u => !u)}
        aria-pressed={upper} aria-label="Großbuchstaben"
        className={`${keyCls} ${upper ? onCls : idleCls}`}>
        ⇧
      </button>
      {ACCENTS.map(c => (
        <button key={c} type="button" onPointerDown={keepFocus} onMouseDown={keepFocus}
          onClick={e => insert(c, e.shiftKey)}
          className={`${keyCls} ${idleCls}`}>
          {upper ? c.toUpperCase() : c}
        </button>
      ))}
    </div>
  );
}
