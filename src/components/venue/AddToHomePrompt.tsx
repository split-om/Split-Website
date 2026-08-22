"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

const storageKey = (slug: string) => `split-venue-homescreen:${slug}`;

type BeforeInstall = Event & { prompt: () => Promise<void> };

function isStandalone() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function AddToHomePrompt({ slug, name }: { slug: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [ios, setIos] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstall | null>(null);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(storageKey(slug))) return;
    setIos(isIos());
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstall);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const timer = window.setTimeout(() => setOpen(true), 500);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, [slug]);

  function dismiss() {
    localStorage.setItem(storageKey(slug), "1");
    setOpen(false);
  }

  async function add() {
    if (installEvent) {
      await installEvent.prompt();
    }
    dismiss();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/45 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-[1.6rem] bg-white p-5 shadow-xl">
        <Logo />
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-split">First time here</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight">Add {name} to the home screen</h2>
        <p className="mt-2 text-sm text-muted">
          Staff open Split like an app next shift. No App Store. Guests never see this.
        </p>
        <ol className="mt-4 space-y-2 text-sm">
          {ios ? (
            <>
              <li className="rounded-2xl bg-sand px-3 py-2">
                1. Tap the <strong>Share</strong> button (square with an arrow).
              </li>
              <li className="rounded-2xl bg-sand px-3 py-2">
                2. Scroll and tap <strong>Add to Home Screen</strong>.
              </li>
              <li className="rounded-2xl bg-sand px-3 py-2">3. Tap <strong>Add</strong>. Use that icon next time.</li>
            </>
          ) : (
            <>
              <li className="rounded-2xl bg-sand px-3 py-2">
                1. Tap the <strong>⋮</strong> menu in Chrome (top right).
              </li>
              <li className="rounded-2xl bg-sand px-3 py-2">
                2. Tap <strong>Add to Home screen</strong> or <strong>Install app</strong>.
              </li>
              <li className="rounded-2xl bg-sand px-3 py-2">3. Tap <strong>Add</strong>. Use that icon next time.</li>
            </>
          )}
        </ol>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={dismiss} className="flex-1 rounded-full bg-sand py-3 text-sm font-bold">
            Not now
          </button>
          <button
            type="button"
            onClick={() => void add()}
            className="flex-1 rounded-full bg-split py-3 text-sm font-extrabold text-white"
          >
            {installEvent ? "Add to home screen" : "Got it"}
          </button>
        </div>
      </div>
    </div>
  );
}
