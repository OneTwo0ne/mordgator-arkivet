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
  apiKey: 'AIzaSyBiHKaxgESDHMgZyB3AYF-FIZkVnXAlr4Y',
  authDomain: 'arkivet-6f003.firebaseapp.com',
  databaseURL:
    'https://arkivet-6f003-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'arkivet-6f003',
  storageBucket: 'arkivet-6f003.firebasestorage.app',
  messagingSenderId: '738097891970',
  appId: '1:738097891970:web:f9a0e53e9fdd254ce7429b',
}

export function isRealtimeConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL)
}
