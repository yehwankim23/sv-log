import { initializeApp } from "firebase/app";
import axios from "axios";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

const FIREBASE_APP = initializeApp(
  (
    await axios({
      method: "get",
      url: "https://tokens.yehwan.kim/tokens",
    })
  ).data
);

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
