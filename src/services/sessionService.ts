import type { GameSession, ISessionService } from '../types/caseTypes'

/**
 * sessionService — implementerar ISessionService.
 *
 * I MVP finns inget serverläge: spelets tillstånd (vilket fall, vilken akt)
 * bärs helt av URL:en. GM kopierar en spelarlänk och skickar den manuellt.
 * Senare kan samma interface peka mot en server-session.
 */

const PLAYER_PATH = /^\/case\/([^/]+)\/player$/

function parseHash(): { path: string; query: URLSearchParams } {
  // Hash-routing: location.hash ser ut som "#/case/case-demo/player?act=2".
  const raw = window.location.hash.replace(/^#/, '') || '/'
  const [path, queryString = ''] = raw.split('?')
  return { path, query: new URLSearchParams(queryString) }
}

function readActFromQuery(query: URLSearchParams): number {
  const raw = query.get('act')
  const parsed = raw ? Number.parseInt(raw, 10) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

class SessionService implements ISessionService {
  createPlayerLink(caseId: string, actNumber: number): string {
    // Absolut länk som GM kan kopiera och dela. Inkluderar base-pathen
    // (location.pathname) så att länken funkar på GitHub Pages-projektsajten.
    const origin = window.location.origin
    const basePath = window.location.pathname
    return `${origin}${basePath}#/case/${caseId}/player?act=${actNumber}`
  }

  parseSessionFromUrl(): GameSession | null {
    const { path, query } = parseHash()
    const match = PLAYER_PATH.exec(path)
    if (!match) return null
    return {
      caseId: match[1],
      currentAct: readActFromQuery(query),
      startedAt: new Date().toISOString(),
    }
  }

  getCurrentAct(): number {
    return readActFromQuery(parseHash().query)
  }
}

export const sessionService: ISessionService = new SessionService()
