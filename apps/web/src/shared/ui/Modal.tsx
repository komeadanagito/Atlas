import { useEffect, useRef, type ReactNode } from "react";

// Native modal dialogs provide focus containment and return focus without a JS focus trap.
export const Modal = ({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);
  return <dialog ref={ref} aria-label={title} onCancel={(event) => { event.preventDefault(); onClose(); }} className="fixed inset-0 m-auto max-h-full w-full max-w-md overflow-y-auto rounded-3xl border-0 bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-900/40 sm:p-8">
    <div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-xl font-semibold text-balance">{title}</h2><button type="button" aria-label="关闭弹窗" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100">关闭</button></div>
    {open ? children : null}
  </dialog>;
};