import type { VenueBill } from "@/lib/bills";
import type { TableSession } from "@/lib/pay-session";
import { receiptHtml, receiptText } from "@/lib/receipt";

type Bridge = {
  printerInit?: () => unknown;
  printString?: (text: string) => unknown;
  printOriginalText?: (text: string) => unknown;
  printText?: (text: string) => unknown;
  sendRAWData?: (base64: string) => unknown;
  lineWrap?: (n: number) => unknown;
  cutPaper?: () => unknown;
  setAlignment?: (n: number) => unknown;
};

function win() {
  return window as Window & {
    sunmiInnerPrinter?: Bridge;
    SunmiInnerPrinter?: Bridge;
    innerPrinter?: Bridge;
    Printer?: Bridge;
  };
}

function bridge(): Bridge | null {
  if (typeof window === "undefined") return null;
  const w = win();
  return w.sunmiInnerPrinter || w.SunmiInnerPrinter || w.innerPrinter || w.Printer || null;
}

async function invoke(fn: ((...args: never[]) => unknown) | undefined, ...args: unknown[]) {
  if (typeof fn !== "function") return;
  try {
    const out = (fn as (...a: unknown[]) => unknown)(...args);
    if (out && typeof (out as Promise<unknown>).then === "function") await out;
  } catch {
    /* device may not implement every method */
  }
}

function printViaIframe(html: string) {
  return new Promise<void>((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    const frameWin = iframe.contentWindow;
    if (!doc || !frameWin) {
      iframe.remove();
      reject(new Error("Could not open printer sheet."));
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();
    const run = () => {
      try {
        frameWin.focus();
        frameWin.print();
        window.setTimeout(() => iframe.remove(), 1500);
        resolve();
      } catch (error) {
        iframe.remove();
        reject(error);
      }
    };
    if (doc.readyState === "complete") run();
    else iframe.onload = run;
  });
}

/** Prints a table bill on a Sunmi inner printer, or the device print sheet. */
export async function printTableReceipt(bill: VenueBill, session?: TableSession | null) {
  const text = receiptText(bill, session);
  const html = receiptHtml(bill, session);
  const printer = bridge();
  if (printer) {
    await invoke(printer.printerInit);
    await invoke(printer.setAlignment, 1);
    const print =
      printer.printOriginalText || printer.printString || printer.printText;
    await invoke(print, text);
    await invoke(printer.lineWrap, 3);
    await invoke(printer.cutPaper);
    return { mode: "sunmi" as const };
  }
  await printViaIframe(html);
  return { mode: "sheet" as const };
}
