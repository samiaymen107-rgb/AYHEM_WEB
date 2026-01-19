// TEMPLATE_COMMANDS.js
// طبقة أوامر (Commands Layer)
// تنفيذ الأوامر وربطها بالتحليلات والمنطق المتقدم

export const CommandsLayer = (() => {
  const commandsStore = [];

  function register(commandName, handler) {
    const record = {
      id: commandsStore.length + 1,
      commandName,
      handler,
      timestamp: Date.now()
    };
    commandsStore.push(record);
    return record.id;
  }

  function execute(commandName, ...args) {
    const cmd = commandsStore.find(c => c.commandName === commandName);
    if (cmd && typeof cmd.handler === "function") {
      return cmd.handler(...args);
    }
    return null;
  }

  function listCommands() {
    return commandsStore.map(c => c.commandName);
  }

  function stats() {
    return {
      type: "commands",
      totalCommands: commandsStore.length
    };
  }

  return {
    register,
    execute,
    listCommands,
    stats
  };
})();
