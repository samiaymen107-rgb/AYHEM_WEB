const persistentMemory = {
  storageKey: "ayhemPersistentMemory",
  data: [],

  load: function() {
    const saved = localStorage.getItem(this.storageKey);
    this.data = saved ? JSON.parse(saved) : [];
  },

  saveEntry: function(question, answer) {
    const entry = {
      question,
      answer,
      timestamp: new Date().toISOString()
    };
    this.data.push(entry);
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  },

  searchSimilar: function(query) {
    return this.data.filter(item => item.question.includes(query));
  }
};

persistentMemory.load();
