import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import axios from "axios";

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

const CODE = window.location.search.split("code=")[1]?.split("&")[0];
let href = "https://svlog.netlify.app";

if (document.cookie.split("id=")[1]?.split(";")[0] === undefined && CODE !== undefined) {
  await axios({
    method: "post",
    url: "https://kauth.kakao.com/oauth/token",
    headers: {
      "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    params: {
      grant_type: "authorization_code",
      client_id: "17ddf66c16c9e34d1f514939c6bf5f4b",
      redirect_uri: "https://svlog.netlify.app/oauth",
      code: CODE,
    },
  }).then(async (AXOIS_RESPONSE) => {
    await Kakao.init("3b3430da51f29e3f966fc1eb5c0662c1");
    await Kakao.Auth.setAccessToken(AXOIS_RESPONSE.data.access_token);
  });

  const KAKAO_RESPONSE = await Kakao.API.request({
    url: "/v2/user/me",
  });

  const ID = String(KAKAO_RESPONSE.id);

  document.cookie = `id=${ID}; expires=${new Date(
    new Date().getTime() + 6 * 24 * 60 * 60 * 1000
  ).toUTCString()}; path=/;`;

  const INFO_USERS_DOCUMENT = doc(FIRESTORE, "info", "users");

  if ((await getDoc(INFO_USERS_DOCUMENT)).data()[ID] === undefined) {
    const NICKNAME = KAKAO_RESPONSE.properties.nickname;

    let data = {};
    data[ID] = { name: NICKNAME, isAdmin: false, hidden: false };
    await updateDoc(INFO_USERS_DOCUMENT, data);

    const LENGTH = NICKNAME.length;
    const MATCHES = NICKNAME.match(/[가-힣]/g);

    if (LENGTH < 2 || MATCHES === null || LENGTH !== MATCHES.length) {
      href += "/rename";
    }
  }
}

window.location.href = href;
