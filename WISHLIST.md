# Önskelista — framtida funktioner

Idéer som är beslutade på sikt men medvetet utelämnade i nuläget (oftast för att
de kräver backend/realtid och därmed kostar pengar att driva).

## ✅ Realtidsstyrd material-reveal (GM styr över samma länk) — IMPLEMENTERAD

Byggd med Firebase Realtime Database. GM startar en live-session i GM-vyn, delar
en `/play/<sessionId>`-länk, och slår på/av varje sak (material, personer, bevis,
ledtrådar, lösning) i realtid — ändringar syns direkt hos alla anslutna spelare.
Akt 1:s material är påslaget vid start. Kräver Firebase-konfig i
`src/config/firebase.ts`; utan konfig kör appen i statiskt läge (allt synligt).

Kvarvarande idéer på sikt: per-akt-snabbknappar ("öppna hela akt 2"), närvaro
(se hur många spelare som är anslutna), och säkrare databasregler.

---

### Ursprunglig beskrivning (för historik)

**Vad:** Spelarna använder *en* sessionslänk hela spelomgången. GM kan i realtid
öppna upp nytt material (nästa akt) utan att spelarna byter länk eller laddar om.

**Varför:** Att skicka ut en ny länk mellan akter bryter inlevelsen — som att
pausa en film på bio eller be alla byta salong mitt i. En enda obruten session
håller stämningen.

**Nuläge (tills detta byggs):** Akterna är sammanflätade i spelarvyn — spelarna
ser allt material direkt vid start via sin sessionslänk. Akt-systemet finns kvar
i datan och i GM-vyn (för författande och förhandsgranskning) och blir grunden
för den här funktionen.

**Vad som krävs:** En lättviktig realtidskanal (t.ex. Firebase Realtime
Database / Firestore, Supabase realtime, eller WebSocket-tjänst) där GM:s val av
"aktuell akt/synligt material" pushas till spelarnas öppna session. Service-lagret
(`caseService`/`sessionService`) är redan byggt för att kunna byta lokal JSON mot
en sådan källa utan att röra UI:t. De akt-specifika metoderna (`getMaterialForAct`
m.fl.) finns kvar och kan återanvändas för gatingen.
