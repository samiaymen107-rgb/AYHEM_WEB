import "./public-config.js";
import { getAyhemSupabaseClient, signInAyhem, signOutAyhem, getAyhemSession } from "./ayhem-supabase-auth.js";

const byId = id => document.getElementById(id);
const status = byId("authStatus");
const form = byId("authForm");
const signOut = byId("authSignOut");

function showStatus(message) {
  if (status) status.textContent = message;
}

function renderSession(session) {
  const signedIn = Boolean(session?.user);
  if (form) form.hidden = signedIn;
  if (signOut) signOut.hidden = !signedIn;
  showStatus(signedIn
    ? "متصل بحساب AYHEM: " + (session.user.email || "مستخدم موثّق")
    : "يرجى تسجيل الدخول بحسابك الحالي.");
}

async function initializeAuth() {
  try {
    const client = getAyhemSupabaseClient();
    client.auth.onAuthStateChange((_event, session) => renderSession(session));
    renderSession(await getAyhemSession());
  } catch (error) {
    showStatus("تعذر تهيئة تسجيل الدخول: " + (error?.message || "خطأ غير معروف"));
  }
}

form?.addEventListener("submit", async event => {
  event.preventDefault();
  const email = byId("authEmail")?.value || "";
  const password = byId("authPassword")?.value || "";
  const submit = byId("authSubmit");
  if (submit) submit.disabled = true;
  showStatus("جارٍ التحقق من بيانات الدخول...");
  try {
    await signInAyhem(email, password);
    if (byId("authPassword")) byId("authPassword").value = "";
  } catch (error) {
    showStatus("فشل تسجيل الدخول: " + (error?.message || "تحقق من البريد وكلمة المرور"));
  } finally {
    if (submit) submit.disabled = false;
  }
});

signOut?.addEventListener("click", async () => {
  signOut.disabled = true;
  try {
    await signOutAyhem();
  } catch (error) {
    showStatus("تعذر تسجيل الخروج: " + (error?.message || "خطأ غير معروف"));
  } finally {
    signOut.disabled = false;
  }
});

initializeAuth();
