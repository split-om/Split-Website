import { Logo } from "@/components/Logo";

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
      <header className="flex items-center justify-between px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Logo className="scale-90 origin-left" />
        {venue ? (
          <div className="text-right">
            <div className="text-xs font-extrabold leading-tight">{venue}</div>
            {table ? <div className="text-[11px] text-muted">Table {table}</div> : null}
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-muted">🇴🇲 Oman</span>
        )}
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
