export const SandboxLog = [];

export function logSandbox(exp) {
  SandboxLog.push({
    exp,
    time: Date.now()
  });
}
