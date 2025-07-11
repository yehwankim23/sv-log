import axios from "axios";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const FIREBASE_APP = initializeApp(
  (await axios.get("https://tokens.yehwan.kim/tokens")).data.firebase
);

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
