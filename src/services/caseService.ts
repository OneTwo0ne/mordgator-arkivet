import type {
  Case,
  Character,
  Clue,
  Evidence,
  GMNote,
  ICaseService,
  MaterialItem,
  Solution,
} from '../types/caseTypes'

/**
 * caseService — implementerar ICaseService.
 *
 * I MVP läses fallen från lokala JSON-filer i `src/data/cases/`. UI-komponenter
 * får ALDRIG importera JSON direkt — all data går via detta lager, så att den
 * lokala källan senare kan bytas mot ett API utan att röra UI-koden.
 *
 * Fallen syncas in hit från innehållsmappen via `scripts/sync-content.mjs`.
 */

// Bundlar alla fall vid build. Nyckeln är filsökvägen; vi mappar om till case-id.
const caseModules = import.meta.glob<{ default: Case }>('../data/cases/*.json', {
  eager: true,
})

const casesById: Record<string, Case> = {}
for (const module of Object.values(caseModules)) {
  const data = module.default
  if (data && typeof data.id === 'string') {
    casesById[data.id] = data
  }
}

type CaseSummary = Pick<
  Case,
  | 'id'
  | 'title'
  | 'tagline'
  | 'description'
  | 'setting'
  | 'estimatedDuration'
  | 'difficulty'
  | 'minPlayers'
  | 'maxPlayers'
>

function requireCase(caseId: string): Case {
  const found = casesById[caseId]
  if (!found) {
    throw new Error(`Fallet "${caseId}" hittades inte.`)
  }
  return found
}

function availableInAct(actAvailability: number[], actNumber: number): boolean {
  return actAvailability.includes(actNumber)
}

class CaseService implements ICaseService {
  async getAllCases(): Promise<CaseSummary[]> {
    return Object.values(casesById).map((c) => ({
      id: c.id,
      title: c.title,
      tagline: c.tagline,
      description: c.description,
      setting: c.setting,
      estimatedDuration: c.estimatedDuration,
      difficulty: c.difficulty,
      minPlayers: c.minPlayers,
      maxPlayers: c.maxPlayers,
    }))
  }

  async getCase(caseId: string): Promise<Case> {
    return requireCase(caseId)
  }

  async getMaterialForAct(
    caseId: string,
    actNumber: number,
    gmMode: boolean,
  ): Promise<MaterialItem[]> {
    const c = requireCase(caseId)
    return c.material.filter((item) => {
      if (!availableInAct(item.actAvailability, actNumber)) return false
      if (!gmMode && item.gmOnly) return false
      if (!gmMode && !item.playerVisible) return false
      return true
    })
  }

  async getCharactersForAct(
    caseId: string,
    actNumber: number,
    gmMode: boolean,
  ): Promise<Character[]> {
    const c = requireCase(caseId)
    return c.characters
      .filter((ch) => {
        if (!availableInAct(ch.actAvailability, actNumber)) return false
        if (!gmMode && ch.gmOnly) return false
        return true
      })
      .map((ch) => {
        // I spelarvyn döljs GM-känsliga fält (motiv).
        if (gmMode) return ch
        const playerSafe: Character = { ...ch }
        delete playerSafe.motive
        return playerSafe
      })
  }

  async getEvidenceForAct(
    caseId: string,
    actNumber: number,
    gmMode: boolean,
  ): Promise<Evidence[]> {
    const c = requireCase(caseId)
    return c.evidence.filter((ev) => {
      if (!availableInAct(ev.actAvailability, actNumber)) return false
      if (!gmMode && ev.gmOnly) return false
      if (!gmMode && !ev.playerVisible) return false
      return true
    })
  }

  async getCluesForAct(caseId: string, actNumber: number): Promise<Clue[]> {
    const c = requireCase(caseId)
    return c.clues.filter((clue) =>
      availableInAct(clue.actAvailability, actNumber),
    )
  }

  async getSolution(caseId: string): Promise<Solution> {
    return requireCase(caseId).solution
  }

  async getGMNotes(caseId: string, actNumber: number): Promise<GMNote[]> {
    const c = requireCase(caseId)
    return c.gmNotes.filter((note) =>
      availableInAct(note.actRelevance, actNumber),
    )
  }
}

export const caseService: ICaseService = new CaseService()
