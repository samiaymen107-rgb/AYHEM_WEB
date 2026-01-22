// Sandbox — أي تجربة لا تؤثر على النواة

export function sandboxTest(experiment) {
  return {
    experiment,
    status: "SANDBOX_ONLY",
    persisted: false
  };
}
