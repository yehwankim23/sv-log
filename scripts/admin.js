import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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

const INFO_USERS_DOC = doc(FIRESTORE, "info", "users");

if (ID === undefined) {
  window.location.href = "https://svlog.netlify.app/login";
} else if (!(await getDoc(INFO_USERS_DOC)).data()[ID]["isAdmin"]) {
  alert("접근 권한이 없습니다.");
  window.location.href = "https://svlog.netlify.app";
} else {
  const LOGS_MONTHS_DATA_LIST = (await getDoc(doc(FIRESTORE, "logs", "months"))).data().list;
  LOGS_MONTHS_DATA_LIST.sort();

  const SELECT = document.getElementById("select");

  LOGS_MONTHS_DATA_LIST.findLast((MONTH) => {
    SELECT.innerHTML += `
      <option id=${MONTH} value="${MONTH}">
        ${parseInt(MONTH.slice(0, 4))}년 ${parseInt(MONTH.slice(5, 7))}월
      </option>
    `;
  });

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

  async function showLogs(MONTH) {
    let users = {};

    for (const [USER_ID, USER_INFO] of Object.entries((await getDoc(INFO_USERS_DOC)).data())) {
      if (USER_INFO["hidden"]) {
        continue;
      }

      users[USER_ID] = USER_INFO["name"];
    }

    let dates = new Set();
    let logs = new Map();

    for (const [ID, LOGS_MONTH_DATA_ID] of Object.entries(
      (await getDoc(doc(FIRESTORE, "logs", MONTH))).data()
    )) {
      if (users[ID] === undefined) {
        continue;
      }

      let logsId = new Map();

      for (const [DATE, TIMESTAMPS] of Object.entries(LOGS_MONTH_DATA_ID)) {
        dates.add(DATE);
        logsId.set(DATE, { clockIn: TIMESTAMPS["clockIn"], clockOut: TIMESTAMPS["clockOut"] });
      }

      if (logsId.size !== 0) {
        logs.set(ID, logsId);
      }
    }

    const TABLE = document.getElementById("table");

    if (logs.size === 0) {
      TABLE.innerHTML = `
        <div class="w-80 h-10">
          <span>이번 달 출퇴근 기록이 없습니다.</span>
        </div>
      `;

      return;
    }

    TABLE.innerHTML = `
      <div id="names" class="bt-05-lightgray br-05-lightgray bl-05-lightgray w-20">
        <div class="bb-05-lightgray w-20 h-10">
          <span>이름</span>
        </div>
      </div>
    `;

    const SORTED_IDS = [...logs.keys()].toSorted();

    for (const ID of SORTED_IDS) {
      document.getElementById("names").innerHTML += `
        <div class="bb-05-lightgray w-20 h-10">
          <span>${users[ID]}</span>
        </div>
      `;
    }

    TABLE.innerHTML += `<div id="logs" class="w-60 ox-a fd-r jc-fs"></div>`;

    [...dates.values()].toSorted().findLast((DATE) => {
      document.getElementById("logs").innerHTML += `
        <div id=${DATE} class="bt-05-lightgray br-05-lightgray">
          <div class="bb-05-lightgray w-40 h-10">
            <span>
              ${parseInt(DATE.slice(5, 7))}월
              ${parseInt(DATE.slice(8, 10))}일
              (${["일", "월", "화", "수", "목", "금", "토"][new Date(DATE).getDay()]})
            </span>
          </div>
        </div>
      `;

      for (const ID of SORTED_IDS) {
        const LOG = logs.get(ID).get(DATE);
        let innerHTML = `<div class="bb-05-lightgray w-40 h-10">`;

        if (LOG !== undefined) {
          const CLOCK_IN_DATETIME = toDatetime(LOG["clockIn"]);
          const CLOCK_IN_CLASS = getClass(CLOCK_IN_DATETIME.date, DATE);
          const CLOCK_OUT_DATETIME = toDatetime(LOG["clockOut"]);
          let clockOutClass = "";
          let clockOutInnerText = "근무 중";

          if (CLOCK_OUT_DATETIME !== undefined) {
            clockOutClass = getClass(CLOCK_OUT_DATETIME.date, DATE);
            clockOutInnerText = CLOCK_OUT_DATETIME.time;
          }

          innerHTML += `
            <span>
              <span${CLOCK_IN_CLASS}>${CLOCK_IN_DATETIME.time}</span>
              ~
              <span${clockOutClass}>${clockOutInnerText}</span>
              </span>
            </span>
          `;
        }

        innerHTML += "</div>";
        document.getElementById(DATE).innerHTML += innerHTML;
      }
    });
  }

  const SELECTED_MONTH = LOGS_MONTHS_DATA_LIST.at(-1);
  document.getElementById(SELECTED_MONTH).selected = true;
  await showLogs(SELECTED_MONTH);

  SELECT.addEventListener("change", async () => {
    await showLogs(SELECT.value);
  });
}
