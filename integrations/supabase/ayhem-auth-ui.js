import "./public-config.js";
import { getAyhemSupabaseClient, signInAyhem, signOutAyhem, getAyhemSession } from "./ayhem-supabase-auth.js";

const byId = id => document.getElementById(id);
const status = byId("authStatus");
const form = byId("authForm");
const signOut = byId("authSignOut");
const recoveryForm = byId("authRecoveryForm");
const forgotButton = byId("authForgotPassword");
let recoveryMode = false;

function showStatus(message) {
  if (status) status.textContent = message;
}

function renderSession(session) {
  const signedIn = Boolean(session?.user);
  if (form) form.hidden = signedIn || recoveryMode;
  if (recoveryForm) recoveryForm.hidden = !recoveryMode;
  if (signOut) signOut.hidden = !signedIn || recoveryMode;
  if (!recoveryMode) showStatus(signedIn
    ? "متصل بحساب AYHEM: " + (session.user.email || "مستخدم موثّق")
    : "يرجى تسجيل الدخول بحسابك الحالي.");
}

async function initializeAuth() {
  try {
    const client = getAyhemSupabaseClient();
    client.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        recoveryMode = true;
        if (form) form.hidden = true;
        if (recoveryForm) recoveryForm.hidden = false;
        if (signOut) signOut.hidden = true;
        showStatus("تم التحقق من رابط الاستعادة. أدخل كلمة مرور جديدة.");
        return;
      }
      renderSession(session);
    });
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

forgotButton?.addEventListener("click", async () => {
  const email = byId("authEmail")?.value?.trim() || "";
  if (!email) {
    showStatus("أدخل بريدك الإلكتروني أولاً، ثم اضغط نسيت كلمة المرور.");
    byId("authEmail")?.focus();
    return;
  }
  forgotButton.disabled = true;
  showStatus("جارٍ إرسال طلب استعادة كلمة المرور...");
  try {
    const client = getAyhemSupabaseClient();
    const redirectTo = window.location.href.split(/[?#]/)[0];
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    showStatus("إذا كان البريد مرتبطاً بحساب في AYHEM، فستصلك رسالة استعادة. تحقق من الوارد والرسائل غير المرغوب فيها.");
  } catch (error) {
    showStatus("تعذر إرسال طلب الاستعادة: " + (error?.message || "خطأ غير معروف"));
  } finally {
    forgotButton.disabled = false;
  }
});

recoveryForm?.addEventListener("submit", async event => {
  event.preventDefault();
  const password = byId("authNewPassword")?.value || "";
  const confirmation = byId("authConfirmPassword")?.value || "";
  const submit = byId("authRecoverySubmit");
  if (password.length < 8) {
    showStatus("كلمة المرور الجديدة يجب أن تتكون من 8 أحرف على الأقل.");
    return;
  }
  if (password !== confirmation) {
    showStatus("تأكيد كلمة المرور غير مطابق.");
    return;
  }
  if (submit) submit.disabled = true;
  showStatus("جارٍ تحديث كلمة المرور...");
  try {
    const client = getAyhemSupabaseClient();
    const { error } = await client.auth.updateUser({ password });
    if (error) throw error;
    recoveryMode = false;
    await signOutAyhem();
    recoveryForm.reset();
    if (form) form.hidden = false;
    if (recoveryForm) recoveryForm.hidden = true;
    if (signOut) signOut.hidden = true;
    showStatus("تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.");
  } catch (error) {
    showStatus("تعذر تحديث كلمة المرور: " + (error?.message || "قد يكون رابط الاستعادة منتهياً أو غير صالح."));
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
