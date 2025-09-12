// Import the functions you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your config
const firebaseConfig = {
  apiKey: "AIzaSyAauQapFIwlICqzJtdxPygWOdrZ17MrZ3Y",
  authDomain: "sihh-56d5b.firebaseapp.com",
  projectId: "sihh-56d5b",
  storageBucket: "sihh-56d5b.firebasestorage.app",
  messagingSenderId: "100332084816",
  appId: "1:100332084816:web:da6293ca1cbfe32922bb55",
  measurementId: "G-CM0SK8FHSQ"
};

// Initialize app (only once)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Analytics only works in the browser
let analytics;
if (typeof window !== "undefined") {
  isSupported().then((yes) => {
    if (yes) analytics = getAnalytics(app);
  });
}

export { app, analytics };
