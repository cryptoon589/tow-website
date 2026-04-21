export type TowState =
  | "idle"
  | "preAction"
  | "tap"
  | "win"
  | "lose"
  | "tired"
  | "rekt"
  | "glitch";

export const TOW_STATE_IMAGES: Record<TowState, string> = {
  idle: "/tow/state-idle.png",
  preAction: "/tow/state-pre-action.png",
  tap: "/tow/state-tap.png",
  win: "/tow/state-win.png",
  lose: "/tow/state-lose.png",
  tired: "/tow/state-tired.png",
  rekt: "/tow/state-rekt.png",
  glitch: "/tow/state-glitch.png",
};