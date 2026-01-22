import { HumanExperienceMap } from "../Layers/human-experience-map.js";

export function predictDecision(context) {
  if (context.includes("ظلم")) {
    return "رفض + بناء بديل";
  }
  if (context.includes("فرصة")) {
    return "استثمار حذر";
  }
  return "مراقبة";
}
