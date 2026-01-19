/**
 * AYHEM :: Future Binding Template
 * Purpose: Safe future linking of units
 * Author: AYHEM Core Governance
 */

export const AYHEM_LINKER = (() => {

  // registry for all future bindings
  const registry = {};

  /**
   * Register a unit with a safe wrapper
   * @param {string} name
   * @param {function} moduleFn
   */
  function register(name, moduleFn) {
    if (registry[name]) {
      console.warn(`[AYHEM_LINKER] Unit already registered: ${name}`);
      return false;
    }

    // safe execution wrapper
    registry[name] = (...args) => {
      try {
        return moduleFn(...args);
      } catch (e) {
        console.error(`[AYHEM_LINKER] Execution failed for ${name}:`, e);
        return null;
      }
    };

    console.info(`[AYHEM_LINKER] Registered unit: ${name}`);
    return true;
  }

  /**
   * Execute a unit if registered
   * @param {string} name
   * @param  {...any} args
   */
  function exec(name, ...args) {
    if (!registry[name]) {
      console.warn(`[AYHEM_LINKER] Unit not found: ${name}`);
      return null;
    }
    return registry[name](...args);
  }

  /**
   * List all registered units
   */
  function list() {
    return Object.keys(registry);
  }

  return Object.freeze({
    register,
    exec,
    list
  });

})();
