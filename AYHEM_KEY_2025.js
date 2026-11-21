/**
 * DEPRECATED — this file never implemented cryptographic key management.
 * Do not use it for authentication, encryption, or authorization.
 * Real secrets must be stored in the server-side secret manager.
 */
export const AYHEM_KEY_2025 = Object.freeze({
  deprecated: true,
  getKey() { return null; },
  validate() { return false; },
});
