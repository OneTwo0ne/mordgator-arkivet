import type {
  CharacterRole,
  EvidenceType,
  GMNoteType,
  MaterialType,
} from '../types/caseTypes'

/** Svenska etiketter för materialtyper (visas som diskreta arkivmarkörer). */
export const materialTypeLabels: Record<MaterialType, string> = {
  document: 'Dokument',
  'police-report': 'Polisrapport',
  testimony: 'Förhörsprotokoll',
  photo: 'Fotografi',
  image: 'Bild',
  audio: 'Ljudupptagning',
  video: 'Videoupptagning',
  letter: 'Brev',
  note: 'Anteckning',
  forensic: 'Forensiskt utlåtande',
  financial: 'Ekonomiskt underlag',
}

export const evidenceTypeLabels: Record<EvidenceType, string> = {
  physical: 'Fysiskt föremål',
  document: 'Dokument',
  testimony: 'Vittnesmål',
  photo: 'Fotografi',
  forensic: 'Forensiskt',
  digital: 'Digitalt',
  financial: 'Ekonomiskt',
}

export const characterRoleLabels: Record<CharacterRole, string> = {
  victim: 'Offer',
  suspect: 'Misstänkt',
  witness: 'Vittne',
  detective: 'Utredare',
  other: 'Övrig',
}

export const gmNoteTypeLabels: Record<GMNoteType, string> = {
  instruction: 'Instruktion',
  hint: 'Ledtråd',
  atmosphere: 'Stämning',
  warning: 'Varning',
  background: 'Bakgrund',
}

export const difficultyLabels: Record<'easy' | 'medium' | 'hard', string> = {
  easy: 'Lätt',
  medium: 'Medel',
  hard: 'Svår',
}

/**
 * Materialgrupper — slår ihop de tekniska materialtyperna till färre,
 * meningsfulla kategorier för spelarvyns läslista. Ordningen är visningsordning.
 */
export interface MaterialGroup {
  key: string
  label: string
  types: MaterialType[]
}

export const materialGroups: MaterialGroup[] = [
  { key: 'forhor', label: 'Förhör', types: ['testimony'] },
  {
    key: 'rapporter',
    label: 'Rapporter',
    types: ['police-report', 'forensic', 'financial'],
  },
  {
    key: 'dokument',
    label: 'Dokument & brev',
    types: ['document', 'letter', 'note'],
  },
  { key: 'foton', label: 'Foton', types: ['photo', 'image'] },
  { key: 'media', label: 'Ljud & video', types: ['audio', 'video'] },
]
