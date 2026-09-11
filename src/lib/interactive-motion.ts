export type InteractiveMotionState = "idle" | "selected" | "correct" | "incorrect" | "success";

export const INTERACTIVE_MOTION_CLASSES: Record<InteractiveMotionState, string> = {
  idle: "fv-motion-idle",
  selected: "fv-motion-selected",
  correct: "fv-motion-correct",
  incorrect: "fv-motion-incorrect",
  success: "fv-motion-success",
};

export const interactiveMotionCss = `
.fv-motion-idle { transition: transform 180ms ease, box-shadow 180ms ease; }
.fv-motion-idle:hover { transform: translateY(-2px); }
.fv-motion-selected { animation: fv-motion-select 220ms ease both; }
.fv-motion-correct { animation: fv-motion-correct 520ms cubic-bezier(.2,.8,.2,1) both; }
.fv-motion-incorrect { animation: fv-motion-incorrect 360ms ease both; }
.fv-motion-success { animation: fv-motion-success 680ms cubic-bezier(.2,.8,.2,1) both; }
@keyframes fv-motion-select { 0% { transform: scale(1); } 55% { transform: scale(1.025); } 100% { transform: scale(1); } }
@keyframes fv-motion-correct { 0% { transform: scale(1); } 35% { transform: scale(1.035) rotate(-1deg); } 65% { transform: scale(1.02) rotate(1deg); } 100% { transform: scale(1); } }
@keyframes fv-motion-incorrect { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-7px); } 50% { transform: translateX(7px); } 75% { transform: translateX(-4px); } }
@keyframes fv-motion-success { 0% { opacity: .7; transform: translateY(6px) scale(.94); } 45% { opacity: 1; transform: translateY(-4px) scale(1.06); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
@media (prefers-reduced-motion: reduce) {
  .fv-motion-idle, .fv-motion-selected, .fv-motion-correct, .fv-motion-incorrect, .fv-motion-success { animation: none !important; transition: none !important; }
}
`;

export function motionClass(state: InteractiveMotionState = "idle"): string {
  return INTERACTIVE_MOTION_CLASSES[state];
}
