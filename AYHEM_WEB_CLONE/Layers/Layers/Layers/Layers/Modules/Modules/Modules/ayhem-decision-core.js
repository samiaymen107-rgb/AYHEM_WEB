// Decision Core — CLONE
export class DecisionCore {
  decide(context) {
    return {
      action: "observe",
      reason: "insufficient data",
      context
    };
  }
}
