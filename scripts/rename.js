import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

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
const FIRESTORE = getFirestore(FIREBASE_APP);

const ID = document.cookie.split("id=")[1]?.split(";")[0];

if (ID === undefined) {
  window.location.href = "https://svlog.netlify.app/login";
} else {
  const INFO_USERS_DOCUMENT = doc(FIRESTORE, "info", "users");
  const OLD_NAME = (await getDoc(INFO_USERS_DOCUMENT)).data()[ID]["name"];

  const INPUT = document.getElementById("input");
  INPUT.placeholder = OLD_NAME;
  INPUT.value = OLD_NAME;

  document.getElementById("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const NEW_NAME = INPUT.value;

    if (NEW_NAME !== OLD_NAME) {
      const LENGTH = NEW_NAME.length;
      const MATCHES = NEW_NAME.match(/[가-힣]/g);

      if (LENGTH < 2 || MATCHES === null || LENGTH !== MATCHES.length) {
        alert("한글 이름을 띄어쓰기 없이 입력하세요.");
        return;
      }

      let data = {};
      data[`${ID}.name`] = NEW_NAME;
      await updateDoc(INFO_USERS_DOCUMENT, data);
    }

    window.location.href = "https://svlog.netlify.app";
  });
}
