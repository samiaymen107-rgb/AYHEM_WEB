export function logHistory(file, purpose) {
  return {
    file,
    purpose,
    time: new Date().toISOString()
  };
}
