const LABEL_WIDTH_MM = 100;
const LABEL_HEIGHT_MM = 150;
const LABEL_WIDTH_PX = 378;
const LABEL_HEIGHT_PX = 567;
const CAPTURE_SCALE = 2;

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(images.map(async (image) => {
    if (!image.complete) {
      await new Promise<void>((resolve) => {
        const done = () => resolve();
        image.addEventListener("load", done, { once: true });
        image.addEventListener("error", done, { once: true });
      });
    }
    if (typeof image.decode === "function") {
      try { await image.decode(); } catch { /* the capture library has its own fallback */ }
    }
  }));
}

async function captureLabel(source: HTMLElement): Promise<HTMLCanvasElement> {
  const clone = source.cloneNode(true) as HTMLElement;
  const host = document.createElement("div");
  host.dataset.shippingLabelCapture = "true";
  Object.assign(host.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: `${LABEL_WIDTH_PX}px`,
    height: `${LABEL_HEIGHT_PX}px`,
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: "-2147483647",
    background: "#ffffff",
  });
  Object.assign(clone.style, {
    width: `${LABEL_WIDTH_PX}px`,
    height: `${LABEL_HEIGHT_PX}px`,
    margin: "0",
    border: "0",
    transform: "none",
  });
  clone.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
    const src = image.getAttribute("src");
    if (src && !src.startsWith("data:") && !src.startsWith("blob:")) image.src = new URL(src, window.location.origin).href;
  });
  host.appendChild(clone);
  document.body.appendChild(host);
  try {
    await waitForImages(clone);
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const { snapdom } = await import("@zumer/snapdom");
    return await snapdom.toCanvas(clone, {
      scale: CAPTURE_SCALE,
      dpr: 1,
      fast: true,
      embedFonts: false,
      compress: true,
      cache: "soft",
      backgroundColor: "#ffffff",
      outerTransforms: false,
      outerShadows: false,
    });
  } finally {
    host.remove();
  }
}

export async function downloadShippingLabelsPdf(sources: HTMLElement[], filename: string): Promise<void> {
  if (!sources.length) throw new Error("Tidak ada label yang siap diunduh.");
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: [LABEL_WIDTH_MM, LABEL_HEIGHT_MM], orientation: "portrait", compress: true });
  for (let index = 0; index < sources.length; index += 1) {
    const source = sources[index];
    if (!source) continue;
    const canvas = await captureLabel(source);
    if (index > 0) pdf.addPage([LABEL_WIDTH_MM, LABEL_HEIGHT_MM], "portrait");
    pdf.addImage(canvas, "PNG", 0, 0, LABEL_WIDTH_MM, LABEL_HEIGHT_MM, undefined, "FAST");
  }
  pdf.save(filename);
}
