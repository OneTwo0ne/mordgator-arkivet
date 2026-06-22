// ============================================================
// Firebase web-konfig.
//
// Klistra in värdena från Firebase Console → Project settings →
// Your apps → Web app → firebaseConfig. Detta är INTE hemligt
// (skickas ändå till webbläsaren) — åtkomst skyddas via databasregler.
//
// Lämnas värdena tomma körs appen i statiskt läge utan realtid
// (spelarvyn visar allt, GM kan inte starta live-session).
// ============================================================
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  databaseURL: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
}

export function isRealtimeConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL)
}
