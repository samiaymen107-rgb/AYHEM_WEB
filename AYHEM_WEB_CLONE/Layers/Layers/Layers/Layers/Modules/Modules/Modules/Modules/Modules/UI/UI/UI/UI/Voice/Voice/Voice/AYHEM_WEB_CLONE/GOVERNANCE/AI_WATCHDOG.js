// AI WATCHDOG — يراقب أي تنفيذ أو تطور

export class AIWatchdog {
  constructor() {
    this.allowed = ["AYHEM", "العقل الرقمي الحي", "المؤسس"];
  }

  inspect(action) {
    const ok = this.allowed.some(k => action.includes(k));
    if (!ok) {
      throw new Error("⛔ AI WATCHDOG: Action blocked (no supreme goal)");
    }
    return true;
  }
}
