let learning = {
  topics: {},
  style: {}
};

export function analyzeInteraction(text){
  const words = text.split(" ");
  words.forEach(w => {
    learning.topics[w] = (learning.topics[w] || 0) + 1;
  });
}

export function compressMemory(memory){
  memory.splice(0, Math.floor(memory.length / 2));
}

export function getLearningContext(){
  return learning;
}
