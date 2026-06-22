import { initializeApp } from 'firebase/app'
import {
  getDatabase,
  ref,
  push,
  set,
  update,
  onValue,
  serverTimestamp,
  type Database,
} from 'firebase/database'
import { firebaseConfig, isRealtimeConfigured } from '../config/firebase'

/**
 * realtimeService — synkar GM:s val av synligt material till spelarnas
 * öppna session i realtid (Firebase Realtime Database).
 *
 * Sessionstillståndet i databasen:
 *   sessions/{id} = {
 *     caseId, createdAt,
 *     visible: { material:{id:true}, evidence:{}, characters:{}, clues:{} },
 *     solutionRevealed: boolean
 *   }
 *
 * Saknas Firebase-konfig är realtid inte tillgängligt och appen kör i
 * statiskt läge (se isRealtimeAvailable).
 */

export type VisibleKind = 'material' | 'evidence' | 'characters' | 'clues'

export interface SessionState {
  caseId: string
  createdAt?: number
  visible?: Partial<Record<VisibleKind, Record<string, boolean>>>
  solutionRevealed?: boolean
}

export type VisibleInit = Record<VisibleKind, Record<string, boolean>>

let db: Database | null = null

function getDb(): Database {
  if (!isRealtimeConfigured()) {
    throw new Error('Realtid är inte konfigurerad (saknar Firebase-konfig).')
  }
  if (!db) {
    db = getDatabase(initializeApp(firebaseConfig))
  }
  return db
}

export function isRealtimeAvailable(): boolean {
  return isRealtimeConfigured()
}

/** Skapar en ny session och returnerar dess id. */
export async function createSession(
  caseId: string,
  visible: VisibleInit,
): Promise<string> {
  const node = push(ref(getDb(), 'sessions'))
  await set(node, {
    caseId,
    createdAt: serverTimestamp(),
    visible,
    solutionRevealed: false,
  })
  if (!node.key) throw new Error('Kunde inte skapa session.')
  return node.key
}

/** Prenumererar på en sessions tillstånd. Returnerar en avregistreringsfunktion. */
export function subscribeSession(
  sessionId: string,
  callback: (state: SessionState | null) => void,
): () => void {
  const node = ref(getDb(), `sessions/${sessionId}`)
  return onValue(node, (snapshot) => {
    callback(snapshot.exists() ? (snapshot.val() as SessionState) : null)
  })
}

/** Slår på/av synlighet för en enskild sak. */
export async function setVisibility(
  sessionId: string,
  kind: VisibleKind,
  itemId: string,
  visible: boolean,
): Promise<void> {
  await update(ref(getDb(), `sessions/${sessionId}/visible/${kind}`), {
    [itemId]: visible ? true : null,
  })
}

/** Sätter synlighet för flera saker av en typ på en gång. */
export async function setManyVisibility(
  sessionId: string,
  kind: VisibleKind,
  updates: Record<string, boolean>,
): Promise<void> {
  const payload: Record<string, true | null> = {}
  for (const [id, v] of Object.entries(updates)) payload[id] = v ? true : null
  await update(ref(getDb(), `sessions/${sessionId}/visible/${kind}`), payload)
}

export async function setSolutionRevealed(
  sessionId: string,
  revealed: boolean,
): Promise<void> {
  await set(ref(getDb(), `sessions/${sessionId}/solutionRevealed`), revealed)
}

/** Nollställer en session: ersätter synligt material och stänger lösningen. */
export async function resetSession(
  sessionId: string,
  visible: VisibleInit,
): Promise<void> {
  await update(ref(getDb(), `sessions/${sessionId}`), {
    visible,
    solutionRevealed: false,
  })
}
