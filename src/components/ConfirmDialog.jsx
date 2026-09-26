import React, { useId } from 'react';
import { createPortal } from 'react-dom';
import { useDialog } from '../utils/useDialog';

// Cancel/leave confirmation. Esc, the back button and a click on the backdrop mean "stay".
export default function ConfirmDialog({ icon = '⚠️', title, text, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  const panelRef = useDialog(onCancel);
  const titleId = useId();

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div ref={panelRef} role="alertdialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center space-y-4 focus:outline-none">
        <div className="text-4xl" aria-hidden="true">{icon}</div>
        <h3 id={titleId} className="text-xl font-bold dark:text-gray-100">{title}</h3>
        {text && <p className="text-gray-500 dark:text-gray-400 text-sm">{text}</p>}
        <div className="flex gap-3 justify-center">
          <button onClick={onConfirm} className="btn bg-red-500 hover:bg-red-600 text-white">{confirmLabel}</button>
          <button onClick={onCancel} data-autofocus className="btn btn-outline">{cancelLabel}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
