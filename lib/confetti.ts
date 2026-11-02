export async function celebrate(strong = true) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const confetti = (await import("canvas-confetti")).default;
  const colors = ["#7fc4ff", "#ffd66b", "#9ee493", "#6fd6c8", "#a99bff"];
  confetti({ particleCount: strong ? 120 : 50, spread: 80, origin: { y: 0.65 }, colors, disableForReducedMotion: true });
  if (strong) setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors }), 200);
  if (strong) setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors }), 350);
}
