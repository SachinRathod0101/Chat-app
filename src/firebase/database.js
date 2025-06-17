import { getDatabase, ref, push, onValue } from "firebase/database";
import { app } from "./firebaseConfig";

export const database = getDatabase(app);


export const sendMessage = (chatId, messageObj) => {
  const chatRef = ref(database, `chats/${chatId}`);
  push(chatRef, messageObj);
};


export const listenToMessages = (chatId, callback) => {
  const chatRef = ref(database, `chats/${chatId}`);
  onValue(chatRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
};
