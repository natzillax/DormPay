"use client"

export default function LoadingScreen({ message = "กำลังโหลด..." }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span
          className="h-9 w-9 animate-spin rounded-full border-[3px]"
          style={{
            borderColor: "var(--line)",
            borderTopColor: "var(--accent)",
          }}
          aria-hidden="true"
        />
        <p className="text-sm text-ink-soft">{message}</p>
      </div>
    </div>
  )
}