// ============================================================
// MORDGÅTOR — Core Type Definitions
// ============================================================

export type MaterialType =
  | 'document'
  | 'police-report'
  | 'testimony'
  | 'photo'
  | 'image'
  | 'audio'
  | 'video'
  | 'letter'
  | 'note'
  | 'forensic'
  | 'financial'

export type CharacterRole =
  | 'victim'
  | 'suspect'
  | 'witness'
  | 'detective'
  | 'other'

export type EvidenceType =
  | 'physical'
  | 'document'
  | 'testimony'
  | 'photo'
  | 'forensic'
  | 'digital'
  | 'financial'

export type GMNoteType =
  | 'instruction'
  | 'hint'
  | 'atmosphere'
  | 'warning'
  | 'background'

export interface Act {
  id: string
  number: number
  title: string
  description: string
  playerIntro: string
  availableMaterialIds: string[]
  gmNoteIds: string[]
}

export interface MaterialItem {
  id: string
  type: MaterialType
  title: string
  actAvailability: number[]
  playerVisible: boolean
  gmOnly: boolean
  content?: string
  assetPath?: string
  relatedCharacterIds?: string[]
  relatedEvidenceIds?: string[]
  tags?: string[]
  metadata?: Record<string, unknown>
}

export interface Character {
  id: string
  name: string
  age?: number
  occupation?: string
  role: CharacterRole
  description: string
  alibi?: string
  motive?: string
  relationship?: string
  imageAssetPath?: string
  actAvailability: number[]
  gmOnly: boolean
}

export interface Evidence {
  id: string
  title: string
  description: string
  type: EvidenceType
  actAvailability: number[]
  playerVisible: boolean
  gmOnly: boolean
  assetPath?: string
  content?: string
  relatedCharacterIds?: string[]
  tags?: string[]
  significance?: string
}

export interface Clue {
  id: string
  title: string
  hint: string
  content: string
  actAvailability: number[]
  isEmergencyOnly: boolean
  relatedCharacterIds?: string[]
  relatedEvidenceIds?: string[]
}

export interface TimelineEvent {
  time: string
  description: string
  characterIds: string[]
}

export interface Solution {
  perpetratorId: string
  motive: string
  method: string
  timeline: TimelineEvent[]
  keyEvidenceIds: string[]
  misleadingTrails: string[]
  importantDetails: string[]
  fullNarrative: string
}

export interface GMNote {
  id: string
  title: string
  content: string
  actRelevance: number[]
  type: GMNoteType
}

export interface Case {
  id: string
  title: string
  tagline: string
  description: string
  setting: string
  estimatedDuration: string
  difficulty: 'easy' | 'medium' | 'hard'
  minPlayers: number
  maxPlayers: number
  acts: Act[]
  characters: Character[]
  evidence: Evidence[]
  material: MaterialItem[]
  clues: Clue[]
  solution: Solution
  gmNotes: GMNote[]
}

export interface GameSession {
  caseId: string
  currentAct: number
  startedAt: string
}

export interface ICaseService {
  getAllCases(): Promise<Pick<Case, 'id' | 'title' | 'tagline' | 'description' | 'setting' | 'estimatedDuration' | 'difficulty' | 'minPlayers' | 'maxPlayers'>[]>
  getCase(caseId: string): Promise<Case>
  getMaterialForAct(caseId: string, actNumber: number, gmMode: boolean): Promise<MaterialItem[]>
  getCharactersForAct(caseId: string, actNumber: number, gmMode: boolean): Promise<Character[]>
  getEvidenceForAct(caseId: string, actNumber: number, gmMode: boolean): Promise<Evidence[]>
  getCluesForAct(caseId: string, actNumber: number): Promise<Clue[]>
  getSolution(caseId: string): Promise<Solution>
  getGMNotes(caseId: string, actNumber: number): Promise<GMNote[]>
  // "Hela fallet" — union över alla akter. Spelarvyn använder dessa: en
  // session, allt material tillgängligt direkt (inga nya länkar mitt i spelet).
  // Akt-systemet finns kvar i datan/GM-vyn för framtida realtidsstyrning.
  getAllMaterial(caseId: string, gmMode: boolean): Promise<MaterialItem[]>
  getAllCharacters(caseId: string, gmMode: boolean): Promise<Character[]>
  getAllEvidence(caseId: string, gmMode: boolean): Promise<Evidence[]>
  getAllClues(caseId: string): Promise<Clue[]>
}

export interface ISessionService {
  // actNumber är valfritt och utelämnas ur länken: spelarlänken är
  // akt-oberoende (en länk för hela sessionen).
  createPlayerLink(caseId: string, actNumber?: number): string
  parseSessionFromUrl(): GameSession | null
  getCurrentAct(): number
}
