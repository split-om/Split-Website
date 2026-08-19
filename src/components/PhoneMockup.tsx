type Screen = "bill" | "split" | "tip" | "pay" | "menu" | "order" | "review" | "rewards";

export function PhoneMockup({
  screen = "bill",
  className = "",
}: {
  screen?: Screen;
  className?: string;
}) {
  return (
    <div className={`relative mx-auto w-[260px] ${className}`}>
      <div className="absolute -inset-6 rounded-[3rem] bg-split/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-[2.2rem] border-[10px] border-[#1a1a1f] bg-white shadow-2xl">
        <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-[#1a1a1f]" />
        <div className="h-[520px] overflow-hidden bg-[#fafafa] pt-8">
          {screen === "bill" && <BillScreen />}
          {screen === "split" && <SplitScreen />}
          {screen === "tip" && <TipScreen />}
          {screen === "pay" && <PayScreen />}
          {screen === "menu" && <MenuScreen />}
          {screen === "order" && <OrderScreen />}
          {screen === "review" && <ReviewScreen />}
          {screen === "rewards" && <RewardsScreen />}
        </div>
      </div>
    </div>
  );
}

function Top({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="px-4 pb-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-split">Split · Oman</div>
      <div className="text-lg font-extrabold tracking-tight">{title}</div>
      <div className="text-[11px] text-muted">{sub}</div>
    </div>
  );
}

function BillScreen() {
  return (
    <div>
      <Top title="Table 12" sub="The Pearl Room · Qurum" />
      <div className="mx-3 space-y-2 rounded-2xl bg-white p-3 shadow-sm">
        {[
          ["Hammour mashwi", "8.500"],
          ["Mixed mezze", "4.200"],
          ["Mint lemonade", "1.800"],
        ].map(([n, p]) => (
          <div key={n} className="flex justify-between text-[12px]">
            <span>{n}</span>
            <span className="font-semibold">{p}</span>
          </div>
        ))}
        <div className="border-t border-line pt-2 text-[11px] text-muted">VAT 5% · 0.815</div>
        <div className="flex justify-between text-[11px] text-muted">
          <span>Split&apos;s fee</span>
          <span>0.203</span>
        </div>
        <div className="flex justify-between text-sm font-extrabold">
          <span>Total</span>
          <span>OMR 17.315</span>
        </div>
      </div>
      <button className="mx-3 mt-4 w-[calc(100%-1.5rem)] rounded-full bg-split py-2.5 text-sm font-bold text-white">
        Split the bill
      </button>
    </div>
  );
}

function SplitScreen() {
  return (
    <div>
      <Top title="Split bill" sub="Choose how to share OMR 15.225" />
      <div className="mx-3 space-y-2">
        {["Equally", "By item", "Custom amount"].map((m, i) => (
          <div
            key={m}
            className={`rounded-2xl border px-3 py-3 text-sm font-semibold ${
              i === 0 ? "border-split bg-lilac text-split" : "border-line bg-white"
            }`}
          >
            {m}
          </div>
        ))}
      </div>
      <div className="mx-3 mt-4 grid grid-cols-4 gap-2">
        {["You", "A", "B", "C"].map((p) => (
          <div key={p} className="rounded-2xl bg-white py-3 text-center shadow-sm">
            <div className="mx-auto mb-1 grid h-8 w-8 place-items-center rounded-full bg-lilac text-xs font-bold text-split">
              {p[0]}
            </div>
            <div className="text-[10px] font-semibold">3.806</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TipScreen() {
  return (
    <div>
      <Top title="Add a tip" sub="Your server: Fatima" />
      <div className="mx-3 grid grid-cols-3 gap-2">
        {["10%", "15%", "20%"].map((t, i) => (
          <div
            key={t}
            className={`rounded-2xl py-4 text-center text-sm font-bold ${
              i === 1 ? "bg-split text-white" : "bg-white shadow-sm"
            }`}
          >
            {t}
          </div>
        ))}
      </div>
      <div className="mx-3 mt-4 rounded-2xl bg-white p-4 text-center shadow-sm">
        <div className="text-xs text-muted">Tip amount</div>
        <div className="text-2xl font-extrabold">OMR 2.284</div>
      </div>
      <button className="mx-3 mt-4 w-[calc(100%-1.5rem)] rounded-full bg-ink py-2.5 text-sm font-bold text-white">
        Continue
      </button>
    </div>
  );
}

function PayScreen() {
  return (
    <div>
      <Top title="Pay" sub="Secure checkout · 10 seconds" />
      <div className="mx-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="text-xs text-muted">You pay</div>
        <div className="text-3xl font-extrabold tracking-tight">OMR 6.090</div>
      </div>
      <div className="mx-3 mt-3 space-y-2">
        {["Apple Pay", "Google Pay", "Pay in restaurant"].map((m, i) => (
          <div
            key={m}
            className={`rounded-2xl px-3 py-3 text-sm font-semibold ${
              i === 0 ? "bg-ink text-white" : "bg-white shadow-sm"
            }`}
          >
            {m}
          </div>
        ))}
      </div>
    </div>
  );
}

function MenuScreen() {
  return (
    <div>
      <Top title="Digital menu" sub="Live · The Pearl Room" />
      <div className="mx-3 space-y-2">
        {[
          ["Shuwa slider", "3.200"],
          ["Grilled hammour", "8.500"],
          ["Luqaimat", "2.100"],
        ].map(([n, p]) => (
          <div key={n} className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm">
            <div>
              <div className="text-sm font-bold">{n}</div>
              <div className="text-[10px] text-muted">OMR {p}</div>
            </div>
            <div className="rounded-full bg-lilac px-2 py-1 text-[10px] font-bold text-split">Add</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderScreen() {
  return (
    <div>
      <Top title="Your order" sub="Sent to the kitchen" />
      <div className="mx-3 rounded-2xl bg-white p-3 shadow-sm">
        <div className="mb-2 text-xs font-bold text-split">In progress</div>
        {["Mixed mezze × 1", "Shuwa slider × 2"].map((i) => (
          <div key={i} className="border-t border-line py-2 text-sm">
            {i}
          </div>
        ))}
      </div>
      <div className="mx-3 mt-3 rounded-2xl bg-lilac p-3 text-sm font-semibold text-split">
        Pay whenever you are ready — no waiting for the bill.
      </div>
    </div>
  );
}

function ReviewScreen() {
  return (
    <div>
      <Top title="How was dinner?" sub="Leave a Google review" />
      <div className="mx-3 rounded-2xl bg-white p-4 text-center shadow-sm">
        <div className="text-2xl">★★★★★</div>
        <div className="mt-2 text-sm font-semibold">Loved the shuwa</div>
        <div className="mt-1 text-xs text-muted">Posted to Google in one tap</div>
      </div>
    </div>
  );
}

function RewardsScreen() {
  return (
    <div>
      <Top title="Split+" sub="Your dining rewards" />
      <div className="mx-3 rounded-2xl bg-gradient-to-br from-split to-split-bright p-4 text-white">
        <div className="text-xs opacity-80">Available credit</div>
        <div className="text-3xl font-extrabold">OMR 4.50</div>
        <div className="mt-2 text-[11px]">Valid at 80+ restaurants in Oman</div>
      </div>
      <div className="mx-3 mt-3 rounded-2xl bg-white p-3 text-sm shadow-sm">
        20% off next visit at Qurum Coast
      </div>
    </div>
  );
}
