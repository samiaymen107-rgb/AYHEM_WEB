document.addEventListener("focusin", () => {
  document.body.classList.add("kb");
});
document.addEventListener("focusout", () => {
  document.body.classList.remove("kb");
});
