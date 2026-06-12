import React, { useState } from 'react';
import { createPortal } from 'react-dom';

const EMAIL = 'ericwinderlich@gmail.com';

export default function FeedbackModal({ subject, body, onClose }) {
  const [copied, setCopied] = useState(false);

  const mailtoHref = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const copyEmail = () => {
    navigator.clipboard.writeText(EMAIL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm space-y-4 p-6 animate-slide-up">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-gray-800 dark:text-gray-100 text-lg">Fehler melden</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none">×</button>
        </div>

        {/* Email address */}
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">
          <span className="text-sm text-gray-500 dark:text-gray-400 flex-1 select-all font-mono">{EMAIL}</span>
          <button
            onClick={copyEmail}
            className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all ${
              copied ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {copied ? '✓ Kopiert' : 'Kopieren'}
          </button>
        </div>

        {/* Pre-filled message preview */}
        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
            Vorbereitete Nachricht
          </label>
          <textarea
            readOnly
            rows={5}
            className="w-full text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 resize-none focus:outline-none select-all"
            defaultValue={`Betreff: ${subject}\n\n${body}`}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <a
            href={mailtoHref}
            className="flex-1 btn btn-primary text-sm text-center"
            onClick={onClose}
          >
            📧 Mail-App öffnen
          </a>
          <button onClick={onClose} className="btn btn-outline text-sm px-4">
            Schließen
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
