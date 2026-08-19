"use client";

import { useEffect, useRef, useState } from "react";
import { findBill, normalizeCode } from "@/lib/bills";

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

export function Scanner({ onCode }: { onCode: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const [active, setActive] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    let stopped = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera is not available on this device. Enter a table code instead.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (!videoRef.current || stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setActive(true);

        const Detector = (window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike }).BarcodeDetector;
        if (!Detector) {
          setError("This browser cannot read QR codes in-page. Use the table tents below, or scan with your phone camera.");
          return;
        }
        const detector = new Detector({ formats: ["qr_code"] });
        const tick = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const raw = codes[0]?.rawValue;
            if (raw) {
              const code = extractCode(raw);
              if (code && findBill(code)) {
                onCode(code);
                return;
              }
            }
          } catch {
            /* keep scanning */
          }
          timer = window.setTimeout(tick, 280);
        };
        tick();
      } catch {
        setError("Camera permission was denied. Enter a table code or pick a demo table.");
      }
    }

    start();
    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onCode]);

  return (
    <div className="relative overflow-hidden rounded-[1.6rem] bg-ink">
      <video ref={videoRef} className="aspect-[4/3] w-full object-cover" playsInline muted />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-8 rounded-3xl border-2 border-white/80" />
        {active ? <div className="scan-line absolute inset-x-12 h-0.5 bg-white/90 shadow-[0_0_12px_white]" /> : null}
      </div>
      {error ? (
        <p className="absolute inset-x-0 bottom-0 bg-ink/70 px-4 py-3 text-center text-[11px] text-white">{error}</p>
      ) : (
        <p className="absolute inset-x-0 bottom-0 bg-ink/55 px-4 py-2 text-center text-[11px] text-white">
          Point your camera at the table QR
        </p>
      )}
    </div>
  );
}

function extractCode(raw: string): string {
  try {
    const url = new URL(raw);
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.lastIndexOf("pay");
    if (idx >= 0 && parts[idx + 1]) return normalizeCode(parts[idx + 1]);
  } catch {
    /* not a url */
  }
  return normalizeCode(raw);
}
