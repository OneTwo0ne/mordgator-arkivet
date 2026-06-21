#!/usr/bin/env node
/**
 * sync-content.mjs — överför färdiga fall från innehållsmappen till appen.
 *
 * Innehållsmappen ("Mordgåtor assets") är innehållsfabriken där text, bilder
 * och ljud skapas. Appen ("Mordgåtor PWA") ska bara innehålla det som ska
 * skeppas. Detta skript kopierar ett (eller alla) fall + tillhörande media in
 * i appen, så att appen förblir självständig.
 *
 * Användning:
 *   npm run sync-content              # alla fall i innehållsmappen
 *   npm run sync-content case-demo    # bara ett specifikt fall
 *
 * Källmapp kan styras med miljövariabel CONTENT_DIR (absolut sökväg).
 * Standard är systermappen "../Mordgåtor assets".
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PWA_ROOT = path.resolve(__dirname, '..')

const CONTENT_DIR =
  process.env.CONTENT_DIR ?? path.resolve(PWA_ROOT, '..', 'Mordgåtor assets')

const SRC_CASES_DIR = path.join(CONTENT_DIR, 'src', 'data', 'cases')
const DEST_CASES_DIR = path.join(PWA_ROOT, 'src', 'data', 'cases')
const DEST_MEDIA_ROOT = path.join(PWA_ROOT, 'public')

// Kandidatmappar i innehållsmappen där media (assetPath) kan ligga.
// assetPath ser ut som "cases/case-demo/images/foo.jpg".
const MEDIA_SOURCE_ROOTS = [
  path.join(CONTENT_DIR, 'public'),
  path.join(CONTENT_DIR, 'assets'),
  path.join(CONTENT_DIR, 'src', 'assets'),
  CONTENT_DIR,
]

async function exists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

function collectAssetPaths(caseData) {
  const paths = new Set()
  const pools = [caseData.material, caseData.evidence, caseData.characters]
  for (const pool of pools) {
    if (!Array.isArray(pool)) continue
    for (const item of pool) {
      if (item.assetPath) paths.add(item.assetPath)
      if (item.imageAssetPath) paths.add(item.imageAssetPath)
    }
  }
  return [...paths]
}

async function copyMedia(assetPath) {
  for (const root of MEDIA_SOURCE_ROOTS) {
    const candidate = path.join(root, assetPath)
    if (await exists(candidate)) {
      const dest = path.join(DEST_MEDIA_ROOT, assetPath)
      await fs.mkdir(path.dirname(dest), { recursive: true })
      await fs.copyFile(candidate, dest)
      return true
    }
  }
  return false
}

async function syncCase(caseId) {
  const srcFile = path.join(SRC_CASES_DIR, `${caseId}.json`)
  if (!(await exists(srcFile))) {
    console.error(`  ✗ Hittade inte ${srcFile}`)
    return false
  }

  const raw = await fs.readFile(srcFile, 'utf8')
  let caseData
  try {
    caseData = JSON.parse(raw)
  } catch (err) {
    console.error(`  ✗ Ogiltig JSON i ${caseId}.json: ${err.message}`)
    return false
  }

  await fs.mkdir(DEST_CASES_DIR, { recursive: true })
  await fs.writeFile(path.join(DEST_CASES_DIR, `${caseId}.json`), raw)
  console.log(`  ✓ ${caseId}.json`)

  const assetPaths = collectAssetPaths(caseData)
  let copied = 0
  const missing = []
  for (const assetPath of assetPaths) {
    if (await copyMedia(assetPath)) copied++
    else missing.push(assetPath)
  }

  console.log(
    `    media: ${copied}/${assetPaths.length} kopierade` +
      (missing.length
        ? ` — saknas (platshållare visas): ${missing.length}`
        : ''),
  )
  for (const m of missing) console.log(`      · ${m}`)
  return true
}

async function main() {
  console.log(`Innehållskälla: ${CONTENT_DIR}`)
  if (!(await exists(SRC_CASES_DIR))) {
    console.error(`✗ Hittade ingen casemapp: ${SRC_CASES_DIR}`)
    process.exit(1)
  }

  const requested = process.argv.slice(2)
  let caseIds = requested
  if (caseIds.length === 0) {
    const files = await fs.readdir(SRC_CASES_DIR)
    caseIds = files
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''))
  }

  if (caseIds.length === 0) {
    console.log('Inga fall att synka.')
    return
  }

  console.log(`Synkar ${caseIds.length} fall:`)
  let ok = 0
  for (const id of caseIds) {
    if (await syncCase(id)) ok++
  }
  console.log(`Klart: ${ok}/${caseIds.length} fall synkade.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
