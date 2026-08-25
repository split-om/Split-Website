import { Logo } from "@/components/Logo";
import { GuestAuth } from "@/components/GuestAuth";

export function GuestFrame({
  children,
  venue,
  table,
}: {
  children: React.ReactNode;
  venue?: string;
  table?: string;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#f6f4f8] shadow-[0_0_80px_rgba(0,0,0,0.35)]">
      <header className="flex items-center justify-between gap-2 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <Logo className="origin-left scale-90" />
          {venue ? (
            <p className="mt-0.5 truncate text-[11px] font-semibold text-muted">
              {venue}
              {table ? ` · Table ${table}` : ""}
            </p>
          ) : null}
        </div>
        <GuestAuth compact />
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
