"use client"

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react"

/* ---------------------------------------------------------------
   ระบบแจ้งเตือนแทน alert()/confirm() ของเบราว์เซอร์
   - useToast()   -> toast.success(msg) / toast.error(msg) / toast.info(msg)
   - useConfirm() -> const ok = await confirm({ title, message, tone })
   สไตล์ยึดโทเค็นจาก globals.css (accent = สำเร็จ/ปุ่มหลัก, danger = ผิดพลาด/อันตราย, warning = รอตรวจสอบ)
--------------------------------------------------------------- */

type ToastTone = "success" | "error" | "info"

type Toast = {
  id: number
  tone: ToastTone
  message: string
}

type ConfirmOptions = {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: "default" | "danger"
}

type ConfirmState = ConfirmOptions & {
  resolve: (value: boolean) => void
}

type ToastContextValue = {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)
const ConfirmContext = createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(null)

const TOAST_DURATION_MS = 4200

const toneStyles: Record<ToastTone, { border: string; bg: string; fg: string; icon: ReactNode }> = {
  success: {
    border: "var(--success)",
    bg: "var(--success-tint)",
    fg: "var(--success)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M4 10.5l3.5 3.5L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  error: {
    border: "var(--danger)",
    bg: "var(--danger-tint)",
    fg: "var(--danger)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  info: {
    border: "var(--accent)",
    bg: "var(--accent-tint)",
    fg: "var(--accent)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10 9v4.2M10 6.8v.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (tone: ToastTone, message: string) => {
      const id = ++idRef.current
      setToasts((prev) => [...prev, { id, tone, message }])
      window.setTimeout(() => dismiss(id), TOAST_DURATION_MS)
    },
    [dismiss]
  )

  const toastApi = useRef<ToastContextValue>({
    success: (message) => push("success", message),
    error: (message) => push("error", message),
    info: (message) => push("info", message),
  }).current

  const confirmApi = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...opts, resolve })
    })
  }, [])

  const resolveConfirm = (value: boolean) => {
    confirmState?.resolve(value)
    setConfirmState(null)
  }

  return (
    <ToastContext.Provider value={toastApi}>
      <ConfirmContext.Provider value={confirmApi}>
        {children}

        {/* ---- toast stack ---- */}
        <div
          aria-live="polite"
          className="fixed bottom-5 right-5 z-[100] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-2"
        >
          {toasts.map((t) => {
            const style = toneStyles[t.tone]
            return (
              <div
                key={t.id}
                role="status"
                className="card animate-toast-in flex items-start gap-2.5 border-l-4 p-3.5 pr-3"
                style={{ borderLeftColor: style.border }}
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ background: style.bg, color: style.fg }}
                >
                  {style.icon}
                </span>
                <p className="flex-1 text-sm leading-snug" style={{ color: "var(--ink)" }}>
                  {t.message}
                </p>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="ปิดการแจ้งเตือน"
                  className="shrink-0 rounded p-0.5 text-lg leading-none opacity-40 transition hover:opacity-80"
                  style={{ color: "var(--ink)" }}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>

        {/* ---- confirm modal ---- */}
        {confirmState && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-4 backdrop-blur-[2px]"
            onClick={() => resolveConfirm(false)}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              onClick={(e) => e.stopPropagation()}
              className="card-elevated w-full max-w-sm animate-modal-in p-5"
            >
              <h2 id="confirm-title" className="text-lg font-semibold" style={{ color: "var(--ink)" }}>
                {confirmState.title}
              </h2>
              {confirmState.message && (
                <p className="mt-1.5 text-sm" style={{ color: "var(--ink-soft)" }}>
                  {confirmState.message}
                </p>
              )}
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => resolveConfirm(false)}
                  className="rounded-[var(--radius-control)] px-3.5 py-2 text-sm font-medium transition hover:bg-[var(--line-soft)]"
                  style={{ color: "var(--ink-soft)" }}
                >
                  {confirmState.cancelLabel ?? "ยกเลิก"}
                </button>
                <button
                  onClick={() => resolveConfirm(true)}
                  className="rounded-[var(--radius-control)] px-3.5 py-2 text-sm font-semibold text-white transition"
                  style={{
                    background: confirmState.tone === "danger" ? "var(--danger)" : "var(--accent)",
                  }}
                >
                  {confirmState.confirmLabel ?? "ยืนยัน"}
                </button>
              </div>
            </div>
          </div>
        )}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast ต้องถูกใช้ภายใน <NotificationProvider>")
  return ctx
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error("useConfirm ต้องถูกใช้ภายใน <NotificationProvider>")
  return ctx
}