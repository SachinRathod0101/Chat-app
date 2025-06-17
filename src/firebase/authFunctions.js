import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { toast } from "react-toastify";
import { app } from "./firebaseConfig";

const auth = getAuth(app);
const db = getFirestore(app);

// Signup Function
const signup = async (username, email, password) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.docs.length > 0) {
      toast.error("Username already taken");
      return 0;
    }

    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;

    await setDoc(doc(db, "users", user.uid), {
      id: user.uid,
      username: username.toLowerCase(),
      email,
      name: "",
      avatar: "",
      bio: "Hey, There I am using chat app",
      lastSeen: Date.now()
    });

    await setDoc(doc(db, "chats", user.uid), {
      chatsData: []
    });

    toast.success("Signup successful!");
  } catch (error) {
    console.error(error);
    toast.error(error.code.split("/")[1].split("-").join(" "));
  }
};

// Login Function
const login = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error(error);
    toast.error(error.code.split("/")[1].split("-").join(" "));
  }
};

// Logout Function
const logout = () => {
  signOut(auth);
};

// Reset Password
const resetPass = async (email) => {
  if (!email) {
    toast.error("Enter your email");
    return null;
  }
  try {
    const userRef = collection(db, "users");
    const q = query(userRef, where("email", "==", email));
    const querySnap = await getDocs(q);

    if (!querySnap.empty) {
      await sendPasswordResetEmail(auth, email);
      toast.success("Reset Email Sent");
    } else {
      toast.error("Email doesn't exist");
    }
  } catch (error) {
    console.error(error);
    toast.error(error.message);
  }
};

export { auth, db, signup, login, logout, resetPass };
