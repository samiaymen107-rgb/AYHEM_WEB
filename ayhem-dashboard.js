const PKEY = "AYHEM_PERSONA";

const DEFAULT_PERSONA = {
  tone: "متزن",
  style: "واضح",
  verbosity: "متوسط"
};

export function getPersona() {
  try {
    const raw = localStorage.getItem(PKEY);
    if (!raw) return { ...DEFAULT_PERSONA };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PERSONA, ...parsed };
  } catch {
    return { ...DEFAULT_PERSONA };
  }
}

export function setPersona(p) {
  try {
    const current = getPersona();
    const next = { ...current, ...p };
    localStorage.setItem(PKEY, JSON.stringify(next));
    return next;
  } catch {
    return null;
  }
}

export function renderDashboard() {
  if (document.getElementById("ayhem-persona-panel")) return;

  const p = getPersona();
  const d = document.createElement("div");
  d.id = "ayhem-persona-panel";
  d.style.cssText = `
    position: fixed;
    bottom: 70px;
    left: 10px;
    background: #111823;
    color: #e0e6ed;
    border: 1px solid #1f2a36;
    padding: 12px;
    border-radius: 10px;
    z-index: 9999;
    box-shadow: 0 8px 24px rgba(0,0,0,.25);
    font-family: monospace;
    min-width: 220px;
  `;

  d.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <strong>الشخصية</strong>
      <button id="closePersona" type="button" aria-label="إغلاق">×</button>
    </div>

    <label style="display:block; margin-bottom:8px;">
      النبرة
      <select id="tone" style="width:100%; margin-top:4px;">
        <option value="متزن">متزن</option>
        <option value="ودي">ودي</option>
        <option value="حازم">حازم</option>
      </select>
    </label>

    <label style="display:block; margin-bottom:8px;">
      الأسلوب
      <select id="style" style="width:100%; margin-top:4px;">
        <option value="واضح">واضح</option>
        <option value="مختصر">مختصر</option>
        <option value="مفصل">مفصل</option>
      </select>
    </label>

    <label style="display:block; margin-bottom:8px;">
      الإطناب
      <select id="verbosity" style="width:100%; margin-top:4px;">
        <option value="قليل">قليل</option>
        <option value="متوسط">متوسط</option>
        <option value="عال">عال</option>
      </select>
    </label>

    <button id="savePersona" type="button" style="width:100%;">حفظ</button>
  `;

  d.querySelector("#tone").value = p.tone;
  d.querySelector("#style").value = p.style;
  d.querySelector("#verbosity").value = p.verbosity;

  d.querySelector("#savePersona").onclick = () => {
    setPersona({
      tone: d.querySelector("#tone").value,
      style: d.querySelector("#style").value,
      verbosity: d.querySelector("#verbosity").value
    });
  };

  d.querySelector("#closePersona").onclick = () => d.remove();

  document.body.appendChild(d);
}

async function startCamera() {
  const video = document.getElementById("cam");
  if (!video || !navigator.mediaDevices?.getUserMedia) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });
    video.srcObject = stream;
    await video.play();
  } catch (e) {
    const decision = document.getElementById("decision");
    if (decision) decision.textContent = "تعذر تشغيل الكاميرا: " + e.message;
  }
}

function setBoxText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function initMockLiveText() {
  setBoxText("audio", "لا توجد بيانات صوتية بعد.");
  setBoxText("context", "السياق سيظهر هنا عند ربط النظام.");
  const p = getPersona();
  setBoxText(
    "decision",
    `النبرة: ${p.tone}
الأسلوب: ${p.style}
الإطناب: ${p.verbosity}
الحالة: جاهز`
  );
}

document.addEventListener("DOMContentLoaded", () => {
  renderDashboard();
  initMockLiveText();
  startCamera();
});
