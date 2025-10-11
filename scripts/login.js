import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const FIREBASE_APP = initializeApp({
  apiKey: "AIzaSyDRs0mk5KDP_QEvwx_ZSKOTlnlhUZF3pIg",
  authDomain: "sv-log.firebaseapp.com",
  projectId: "sv-log",
  storageBucket: "sv-log.firebasestorage.app",
  messagingSenderId: "315201647302",
  appId: "1:315201647302:web:0e1bb10c93df77d7af9dc7",
  measurementId: "G-E6G8SJ2418",
});

const ANALYTICS = getAnalytics(FIREBASE_APP);

if (document.cookie.split("id=")[1]?.split(";")[0] !== undefined) {
  window.location.href = "https://svlog.netlify.app";
} else {
  await Kakao.init("3b3430da51f29e3f966fc1eb5c0662c1");

  await Kakao.Auth.authorize({
    redirectUri: "https://svlog.netlify.app/oauth",
    prompt: "select_account",
  });
}
