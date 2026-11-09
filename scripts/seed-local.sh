#!/usr/bin/env bash
# Puts the Figma scenario ("Kadrolu pozisyon", phase 1, this week's three steps, four ideas, the K8s decision,
# the manager's feedback, an evidence chain) into the local stack for the local user, through the gateway, so the
# app has something to show in live mode. The app has no screens yet for planning (strategy, week, actions),
# deciding or recording evidence; this stands in for them.
#
# Needs the local stack (lifeos-infra/local) and the gateway, Strategy and Coach running. Safe to run again: it
# does nothing once the scenario's goal has a strategy, picks up a goal left by a run that stopped early, and
# refuses a user with other goals. Dates are those of the scenario (November 2026).
#
#   scripts/seed-local.sh            # user onurcan / lifeos
#   USERNAME=… PASSWORD=… scripts/seed-local.sh
set -euo pipefail

API=${API:-http://localhost:8080}
AUTH=${AUTH:-http://localhost:8180/realms/lifeos}
USERNAME=${USERNAME:-onurcan}
PASSWORD=${PASSWORD:-lifeos}

# Password grant: enabled on the local realm only (lifeos-infra/local/README.md).
TOKEN=$(curl -sf -X POST "$AUTH/protocol/openid-connect/token" \
  -d grant_type=password -d client_id=lifeos-mobile -d "username=$USERNAME" -d "password=$PASSWORD" |
  jq -r .access_token)

call() { # METHOD PATH [JSON]
  local response status
  response=$(curl -s -w '\n%{http_code}' -X "$1" "$API$2" -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' ${3:+-d "$3"})
  status=${response##*$'\n'}
  if [[ $status -ge 300 ]]; then
    echo "✗ $1 $2 → $status: ${response%$'\n'*}" >&2
    exit 1
  fi
  printf '%s' "${response%$'\n'*}"
}

status_of() { # PATH → HTTP status only
  curl -s -o /dev/null -w '%{http_code}' "$API$1" -H "Authorization: Bearer $TOKEN"
}

# The goal's window is the whole period of work: every phase lies inside it.
WINDOW='"windowStart":"2026-11-01","windowEnd":"2027-11-30"'
GOALS=$(call GET /api/strategy/goals)
GOAL=$(jq -r 'map(select(.title == "Kadrolu pozisyon"))[0].id // empty' <<<"$GOALS")
if [[ -n $GOAL && $(status_of "/api/strategy/goals/$GOAL/strategy-versions/current") == 200 ]]; then
  echo "$USERNAME is already seeded; nothing to do." >&2
  exit 0
elif [[ -z $GOAL && $(jq length <<<"$GOALS") -gt 0 ]]; then
  echo "$USERNAME has other goals; seed a fresh user instead." >&2
  exit 1
fi

echo "→ profile"
call PATCH /api/strategy/me '{"displayName":"Onurcan","timezone":"Europe/Istanbul","locale":"tr-TR",
  "defaultWeeklyMinutes":240,"onboardingCompleted":true}' >/dev/null

echo "→ goal and strategy"
if [[ -n $GOAL ]]; then
  # Left by a run that stopped after the goal: put it right and go on.
  VERSION=$(jq -r --arg g "$GOAL" 'map(select(.id == $g))[0].version' <<<"$GOALS")
  call PATCH "/api/strategy/goals/$GOAL" "{\"version\":$VERSION,$WINDOW}" >/dev/null
else
  GOAL=$(call POST /api/strategy/goals '{"title":"Kadrolu pozisyon","domain":"CAREER",
    "whyItMatters":"Outsource'"'"'tan in-house yazılım geliştiriciliğe geçmek",
    "successDefinition":"Ekipte kadrolu yazılım geliştirici olarak imzalanmış bir teklif",'"$WINDOW"'}' | jq -r .id)
fi
call POST "/api/strategy/goals/$GOAL/strategy-versions" '{
  "summary":"Önce ekipte güvenilirlik, sonra görünür etki; geçişi 2027 içinde masaya getirmek.",
  "changeReason":"İlk strateji.",
  "phases":[
    {"title":"Adaptasyon","startsOn":"2026-11-01","endsOn":"2026-12-15","status":"ACTIVE",
     "exitCriteria":"Kredi API akışını yardımsız açıklamak; ilk 2 görevi büyük revizyonsuz kapatmak"},
    {"title":"Bağımsız üretkenlik","startsOn":"2026-12-16","endsOn":"2027-02-15","status":"UPCOMING",
     "exitCriteria":"Orta boy bir görevi destek almadan bitirmek; 1 yazılı yönetici geri bildirimi"},
    {"title":"Görünür etki","startsOn":"2027-02-16","endsOn":"2027-05-15","status":"UPCOMING",
     "exitCriteria":"Ekibin gerçekten kullandığı, sahiplendiğin bir iyileştirme"},
    {"title":"Fırsat değerlendirme","startsOn":"2027-05-16","endsOn":"2027-11-30","status":"UPCOMING",
     "exitCriteria":"Geçiş kanalı netleşmiş; değerlendirmeye hazırlığı ya da dış alternatif listesi"}],
  "effortAllocation":{"TECHNICAL":70,"DOMAIN":20,"OTHER":10}}' >/dev/null
PHASE=$(call GET "/api/strategy/goals/$GOAL/strategy-versions/current" | jq -r '.phases[0].phaseKey')

echo "→ knowledge"
knowledge() { # STATEMENT KIND STATUS EXTERNAL
  call POST "/api/strategy/goals/$GOAL/knowledge-items" "$(jq -n --arg s "$1" --arg k "$2" --arg st "$3" \
    --argjson e "$4" '{statement:$s, kind:$k, status:$st, external:$e}')" | jq -r .id
}
knowledge 'Kadro açma politikası ve zamanlama' UNKNOWN UNVERIFIED true >/dev/null
knowledge 'Sözleşmede geçişi kısıtlayan madde var mı?' UNKNOWN UNVERIFIED true >/dev/null
knowledge 'Yöneticinin "iyi performans" tanımı' UNKNOWN UNVERIFIED true >/dev/null
A1=$(knowledge 'Ekibin işi şu an K8s gerektirmiyor' ASSUMPTION UNVERIFIED false)
A2=$(knowledge 'OAuth 2.0 günlük işte kullanılıyor' ASSUMPTION PARTIAL false)
A3=$(knowledge 'Direktörün yorumu somut gereksinim değil' ASSUMPTION UNVERIFIED false)

echo "→ this week"
WEEK=$(date +%G-W%V)
call POST /api/strategy/weekly-plans "$(jq -n --arg w "$WEEK" --arg g "$GOAL" '{isoWeek:$w, capacityMinutes:240,
  headline:"İşine odaklan, beklentiyi netleştir, dinlen.", allocations:[{goalId:$g, allocatedMinutes:230}]}')" >/dev/null
action() { # TITLE WHY EXPECTED KIND MINUTES
  call POST "/api/strategy/weekly-plans/$WEEK/actions" "$(jq -n --arg t "$1" --arg w "$2" --arg e "$3" --arg k "$4" \
    --argjson m "$5" --arg g "$GOAL" --arg p "$PHASE" '{title:$t, why:$w, expectedEvidence:$e, kind:$k,
    estimateMinutes:$m, goalIds:[$g], phaseKey:$p}')" >/dev/null
}
action 'Kredi akışını çiz, doğrulat' 'telemetri üretir' 'Ekibin onayladığı akış diyagramı' EVIDENCE 180
action 'Yöneticine beklentiyi sor' 'bir manevra bu veriyi bekliyor' \
  'Yöneticinin "iyi performans" tanımı, kendi cümleleriyle' INFO_GATHERING 30
action 'PR öğrenimini telemetriye yaz' 'ilk dış sinyal' 'Bir PR yorumundan çıkan ders' EVIDENCE 20
call POST "/api/strategy/weekly-plans/$WEEK/activate" >/dev/null

echo "→ feedback and evidence"
call POST /api/strategy/feedback '{"sourceKind":"MANAGER","sourceLabel":"Yönetici","reliability":"HIGH",
  "content":"Teknik olarak iyisin ama domain bilgini güçlendirmelisin.","receivedOn":"2026-11-08"}' >/dev/null
ACTIVITY=$(call POST /api/strategy/evidence "$(jq -n --arg g "$GOAL" --arg p "$PHASE" '{title:"Rıza akışı okuması · 3 sa",
  level:"ACTIVITY", strength:"SELF_REPORT", occurredOn:"2026-11-05",
  note:"Ekibin OAuth rıza akışını uçtan uca okudum.", goalIds:[$g], phaseKeys:[$p]}')" | jq -r .id)
call POST /api/strategy/evidence "$(jq -n --arg g "$GOAL" --arg p "$PHASE" --arg a "$ACTIVITY" '{
  title:"Alışveriş kredisi akış diyagramı", level:"OUTPUT", strength:"WORK_OUTPUT", occurredOn:"2026-11-09",
  parentEvidenceId:$a, goalIds:[$g], phaseKeys:[$p]}')" >/dev/null

echo "→ ideas"
idea() { # TITLE NOTE
  call POST /api/strategy/ideas "$(jq -n --arg t "$1" --arg n "$2" --arg g "$GOAL" '{title:$t, note:$n, goalId:$g}')" |
    jq -r .id
}
evaluate() { # ID FIT POTENTIAL ENERGY MINUTES VERDICT NOTE
  call POST "/api/strategy/ideas/$1/evaluations" "$(jq -n --argjson f "$2" --argjson p "$3" --argjson e "$4" \
    --argjson m "$5" --arg v "$6" --arg n "$7" '{goalFit:$f, evidencePotential:$p, energy:$e, weeklyMinutes:$m,
    verdict:$v, note:$n}')" >/dev/null
}
AI=$(idea 'AI Engineering' 'Direktörün sözlü yorumu; somut gereksinim değil (henüz).')
evaluate "$AI" 3 3 2 120 PURSUE 'Rotaya alınmaz. Tek bir soruya cevap aranır: ekipte AI hangi somut problem için konuşuluyor, sahibi kim? Sonra yer kontrolünde yeniden bakılır.'
idea 'Yük testi AI triage pilotu' 'Aşama 3 ile uyumlu · ihtiyaç doğrulanmadı' >/dev/null
K8S=$(idea 'Kubernetes' 'İş ihtiyacı doğrulanmadı · 29 Kas')
evaluate "$K8S" 2 2 4 180 PARK 'Ekibin işi şu an K8s gerektirmiyor; 29 Kasım değerlendirmesine kadar park.'
call POST "/api/strategy/ideas/$K8S/shelve" >/dev/null
KAFKA=$(idea 'Kafka Streams' 'Hedefe bağı zayıf')
evaluate "$KAFKA" 1 2 3 120 PARK 'Hedefe bağı zayıf; yer kontrolünde yeniden bakılmaz.'
call POST "/api/strategy/ideas/$KAFKA/shelve" >/dev/null

echo "→ decision"
seed_decision() { # GOAL A1 A2 A3 (assumption IDs)
  local draft id version
  draft=$(call POST /api/strategy/decisions "$(cat <<JSON
{"goalId":"$1","title":"Kubernetes'i park et, OAuth 2.0'a odaklan",
 "context":"Direktör AI'ın önemli olduğunu söyledi; K8s'e ayrılan akşamlar aşama 1'in kanıtına katkı vermiyor.",
 "alternatives":[
   {"description":"K8s'e devam","rejectionReason":"Elendi · ihtiyaç doğrulanmadı"},
   {"description":"Tamamen AI'a geç","rejectionReason":"Elendi · sinyal somut değil"},
   {"description":"OAuth 2.0 / ÖHVPS"},
   {"description":"AI keşfi · 2 sa","rejectionReason":"C'ye eklendi"}],
 "assumptionIds":["$2","$3","$4"],
 "reopenTriggers":[{"kind":"DATE","description":"İlk kontrol","firesOn":"2026-11-15"},
                   {"kind":"DATE","description":"İkinci kontrol","firesOn":"2026-11-22"}]}
JSON
)")
  id=$(jq -r .id <<<"$draft")
  version=$(jq -r .version <<<"$draft")
  call POST "/api/strategy/decisions/$id/decide" "$(cat <<JSON
{"version":$version,"chosenLabel":"C","reviewOn":"2026-11-29",
 "expectedOutcome":"29 Kasım'a kadar rıza akışını kendi kodumuzda bulup açıklayabilmek ve bir PR'da güvenlikle ilgili gerekçeli yorum yapmak."}
JSON
)" >/dev/null
}
seed_decision "$GOAL" "$A1" "$A2" "$A3"

echo "✓ $USERNAME: goal $GOAL, week $WEEK"
