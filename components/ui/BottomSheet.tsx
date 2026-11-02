"use client";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Drag-to-dismiss bottom sheet. Drag starts from the handle/header so inner content can scroll. */
export function BottomSheet({ open, onClose, title, children, footer }: Props) {
  const controls = useDragControls();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={ref}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-[2rem] bg-card shadow-2xl outline-none"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_, info) => (info.offset.y > 120 || info.velocity.y > 500) && onClose()}
          >
            <div
              className="flex shrink-0 cursor-grab touch-none flex-col items-center px-5 pb-2 pt-2.5"
              onPointerDown={(e) => controls.start(e)}
            >
              <div className="mb-2 h-1.5 w-11 rounded-full bg-line" />
              <div className="flex w-full items-center justify-between">
                <h2 className="text-lg font-extrabold">{title}</h2>
                <button className="chip !min-w-11 !px-0" aria-label="Close" onClick={onClose} onPointerDown={(e) => e.stopPropagation()}>
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto overscroll-contain px-5 pb-4 pt-1">{children}</div>
            {footer && <div className="pb-safe shrink-0 border-t border-line px-5 pb-4 pt-3">{footer}</div>}
            {!footer && <div className="pb-safe" />}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
