import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getFirestore,
  doc,
  getDoc,
  arrayUnion,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { publicIpv4 } from "public-ip";

const FIREBASE_APP = initializeApp({
  apiKey: "AIzaSyBACaW36r_9CeP03lrjog6-TFuhhUqMyJc",
  authDomain: "sv-log.firebaseapp.com",
  projectId: "sv-log",
  storageBucket: "sv-log.appspot.com",
  messagingSenderId: "315201647302",
  appId: "1:315201647302:web:cfbed4929ef8c624af9dc7",
  measurementId: "G-7QXEHNDBYZ",
});

const ANALYTICS = getAnalytics(FIREBASE_APP);
const FIRESTORE = getFirestore(FIREBASE_APP);

const ID = document.cookie.split("id=")[1]?.split(";")[0];
const CONTAINER = document.getElementById("container");
let href = "https://svlog.netlify.app/login";
let innerText = "로그인";

if (ID === undefined) {
  CONTAINER.innerHTML += `
    <div class="mt-10 bt-05-lightgray pt-10 w-80 h-10">
      <span>로그인한 후 사용할 수 있습니다.</span>
    </div>
  `;
} else {
  href = "https://svlog.netlify.app/rename";

  const INFO_USERS_DATA_ID = (await getDoc(doc(FIRESTORE, "info", "users"))).data()[ID];
  innerText = INFO_USERS_DATA_ID["name"];

  let innerHTML = `
    <div class="mt-10 bt-05-lightgray pt-10 w-80 h-30 fd-r">
      <div class="w-40 h-30">
        <button id="clockIn" class="br-15 w-30 h-30 bc-lightgray" type="button" disabled></button>
      </div>
      <div class="w-40 h-30">
        <button id="clockOut" class="br-15 w-30 h-30 bc-lightgray" type="button" disabled></button>
      </div>
    </div>
    <div class="mt-10 bt-05-lightgray pt-10 w-80
  `;

  const IS_ADMIN = INFO_USERS_DATA_ID["isAdmin"];

  if (IS_ADMIN) {
    innerHTML += `
      h-10">
        <a href="https://svlog.netlify.app/admin">전체 출퇴근 기록 보기</a>
      </div>
      <div class="mt-10 w-80
    `;
  }

  CONTAINER.innerHTML += `${innerHTML} jc-fs" id="table"></div>`;

  function getToday() {
    const DATE = new Date();
    let month = DATE.getMonth() + 1;

    if (month < 10) {
      month = `0${month}`;
    }

    let date = DATE.getDate();

    if (date < 10) {
      date = `0${date}`;
    }

    return `${DATE.getFullYear()}-${month}-${date}`;
  }

  const MONTH = getToday().slice(0, 7);
  const LOGS_MONTH_DOCUMENT = doc(FIRESTORE, "logs", MONTH);
  let logsMonthSnapshot = await getDoc(LOGS_MONTH_DOCUMENT);

  if (!logsMonthSnapshot.exists()) {
    await updateDoc(doc(FIRESTORE, "logs", "months"), { list: arrayUnion(MONTH) });
    let data = {};
    data[ID] = {};
    await setDoc(LOGS_MONTH_DOCUMENT, data);
    logsMonthSnapshot = await getDoc(LOGS_MONTH_DOCUMENT);
  }

  if (logsMonthSnapshot.data()[ID] === undefined) {
    let data = {};
    data[ID] = {};
    await updateDoc(LOGS_MONTH_DOCUMENT, data);
    logsMonthSnapshot = await getDoc(LOGS_MONTH_DOCUMENT);
  }

  const CLOCK_IN_BUTTON = document.getElementById("clockIn");
  const CLOCK_OUT_BUTTON = document.getElementById("clockOut");

  const BUTTONS = {
    clockIn: CLOCK_IN_BUTTON,
    clockOut: CLOCK_OUT_BUTTON,
  };

  function disableButton(BUTTON_ID) {
    if (BUTTON_ID === undefined) {
      return;
    }

    BUTTONS[BUTTON_ID].disabled = true;
    BUTTONS[BUTTON_ID].classList.replace("bc-dodgerblue", "bc-lightgray");
  }

  function enableButton(BUTTON_ID) {
    if (BUTTON_ID === undefined) {
      return;
    }

    BUTTONS[BUTTON_ID].disabled = false;
    BUTTONS[BUTTON_ID].classList.replace("bc-lightgray", "bc-dodgerblue");
  }

  const ACTIONS = { clockIn: "출근", clockOut: "퇴근" };

  Object.values(BUTTONS).forEach((BUTTON) => {
    BUTTON.addEventListener("click", async (EVENT) => {
      const BUTTON_ID = EVENT.currentTarget.id;
      disableButton(BUTTON_ID);

      const TODAY = getToday();
      let logsMonthDataIdToday = (await getDoc(LOGS_MONTH_DOCUMENT)).data()[ID][TODAY];

      if (logsMonthDataIdToday?.[BUTTON_ID] !== undefined) {
        alert(`${ACTIONS[BUTTON_ID]} 기록이 있습니다.\n페이지를 새로고침 합니다.`);
        window.location.replace("https://svlog.netlify.app");
        return;
      }

      if (!confirm(`${ACTIONS[BUTTON_ID]}할까요?`)) {
        enableButton(BUTTON_ID);
        return;
      }

      const IP = await publicIpv4();
      const INFO_IPS_DOCUMENT = doc(FIRESTORE, "info", "ips");

      if (!(await getDoc(INFO_IPS_DOCUMENT)).data().list.includes(IP)) {
        if (!IS_ADMIN) {
          alert(`${ACTIONS[BUTTON_ID]}이 허용되지 않은 IP입니다.\n${IP}`);
        } else {
          if (confirm(`${ACTIONS[BUTTON_ID]}이 허용되지 않은 IP입니다.\n${IP}\nIP를 허용할까요?`)) {
            await updateDoc(INFO_IPS_DOCUMENT, { list: arrayUnion(IP) });
            alert("IP를 허용했습니다.");
          }
        }

        enableButton(BUTTON_ID);
        return;
      }

      let data = {};
      data[`${ID}.${TODAY}.${BUTTON_ID}`] = serverTimestamp();
      await updateDoc(LOGS_MONTH_DOCUMENT, data);

      alert(`${ACTIONS[BUTTON_ID]}했습니다.`);
      window.location.replace("https://svlog.netlify.app");
    });
  });

  const LOGS_MONTH_DATA_ID = logsMonthSnapshot.data()[ID];
  const TODAY = getToday();
  const LOGS_MONTH_DATA_ID_TODAY = LOGS_MONTH_DATA_ID[TODAY];

  let buttonId = undefined;

  function toDatetime(TIMESTAMP) {
    if (TIMESTAMP === undefined) {
      return undefined;
    }

    const DATE = new Date(TIMESTAMP.seconds * 1000);
    let month = DATE.getMonth() + 1;

    if (month < 10) {
      month = `0${month}`;
    }

    let date = DATE.getDate();

    if (date < 10) {
      date = `0${date}`;
    }

    let hour = DATE.getHours();

    if (hour < 10) {
      hour = `0${hour}`;
    }

    let minute = DATE.getMinutes();

    if (minute < 10) {
      minute = `0${minute}`;
    }

    return {
      date: `${DATE.getFullYear()}-${month}-${date}`,
      time: `${hour}:${minute}`,
    };
  }

  function getClass(DATETIME, DATE) {
    return DATETIME === DATE ? "" : " class='color-firebrick'";
  }

  let clockInClass = "";
  let clockInInnerText = "출근";
  let clockOutClass = "";
  let clockOutInnerText = "퇴근";

  if (LOGS_MONTH_DATA_ID_TODAY === undefined) {
    buttonId = "clockIn";
  } else {
    const CLOCK_IN_DATETIME = toDatetime(LOGS_MONTH_DATA_ID_TODAY["clockIn"]);
    clockInClass = getClass(CLOCK_IN_DATETIME.date, TODAY);
    clockInInnerText = CLOCK_IN_DATETIME.time;
    const CLOCK_OUT_DATETIME = toDatetime(LOGS_MONTH_DATA_ID_TODAY["clockOut"]);

    if (CLOCK_OUT_DATETIME === undefined) {
      buttonId = "clockOut";
    } else {
      clockOutClass = getClass(CLOCK_OUT_DATETIME.date, TODAY);
      clockOutInnerText = CLOCK_OUT_DATETIME.time;
    }
  }

  CLOCK_IN_BUTTON.innerHTML = `<span${clockInClass}>${clockInInnerText}</span>`;
  CLOCK_OUT_BUTTON.innerHTML = `<span${clockOutClass}>${clockOutInnerText}</span>`;
  enableButton(buttonId);

  delete LOGS_MONTH_DATA_ID[TODAY];
  const LOGS_MONTH_DATA_ID_PREVIOUS = Object.entries(LOGS_MONTH_DATA_ID);

  const TABLE = document.getElementById("table");

  if (LOGS_MONTH_DATA_ID_PREVIOUS.length === 0) {
    TABLE.innerHTML = `
      <div class="w-80 h-10">
        <span>이번 달 출퇴근 기록이 없습니다.</span>
      </div>
    `;
  } else {
    TABLE.innerHTML = `
      <div class="w-80 h-10 fd-r">
        <div class="b-05-lightgray w-40 h-10">
          <span>날짜</span>
        </div>
        <div class="bt-05-lightgray br-05-lightgray bb-05-lightgray w-20 h-10">
          <span>출근</span>
        </div>
        <div class="bt-05-lightgray br-05-lightgray bb-05-lightgray w-20 h-10">
          <span>퇴근</span>
        </div>
      </div>
    `;

    Object.values(LOGS_MONTH_DATA_ID_PREVIOUS)
      .toSorted()
      .findLast(([DATE, TIMESTAMPS]) => {
        const CLOCK_IN_DATETIME = toDatetime(TIMESTAMPS["clockIn"]);
        const CLOCK_IN_CLASS = getClass(CLOCK_IN_DATETIME.date, DATE);
        const CLOCK_OUT_DATETIME = toDatetime(TIMESTAMPS["clockOut"]);
        let clockOutClass = "";
        let clockOutInnerText = "근무 중";

        if (CLOCK_OUT_DATETIME !== undefined) {
          clockOutClass = getClass(CLOCK_OUT_DATETIME.date, DATE);
          clockOutInnerText = CLOCK_OUT_DATETIME.time;
        }

        TABLE.innerHTML += `
          <div class="w-80 h-10 fd-r">
            <div class="br-05-lightgray bb-05-lightgray bl-05-lightgray  w-40 h-10">
              <span>
                ${parseInt(DATE.slice(5, 7))}월
                ${parseInt(DATE.slice(8, 10))}일
                (${["일", "월", "화", "수", "목", "금", "토"][new Date(DATE).getDay()]})
              </span>
            </div>
            <div class="br-05-lightgray bb-05-lightgray w-20 h-10">
            <span${CLOCK_IN_CLASS}>${CLOCK_IN_DATETIME.time}</span>
            </div>
            <div class="br-05-lightgray bb-05-lightgray w-20 h-10">
            <span${clockOutClass}>${clockOutInnerText}</span>
            </div>
          </div>
        `;
      });
  }
}

const LINK = document.getElementById("link");
LINK.href = href;
LINK.innerText = innerText;
