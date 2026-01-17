import { talkToAyhem } from "./ayhem-bridge-safe.js";

sendButton.onclick = async () => {
  const userInput = inputField.value;

  displayUser(userInput);

  const response = await talkToAyhem(userInput);

  displayAyhem(response.output);
};
