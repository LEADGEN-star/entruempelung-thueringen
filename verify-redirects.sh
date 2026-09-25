#!/usr/bin/env bash
# Verify 301 redirects for entrumpelung- → entruempelung- pages (liest _redirects).
# Usage: bash verify-redirects.sh [base-url]
# Default base: https://entruempelung-thueringen.com

BASE="${1:-https://entruempelung-thueringen.com}"
PASS=0
FAIL=0

declare -A REDIRECTS=()
# Alle entrumpelung-* → entruempelung-* Regeln aus _redirects übernehmen
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
while read -r SRC DST _; do
  [[ "$SRC" == *entrumpelung-* ]] && REDIRECTS["${SRC#/}"]="${DST#/}"
done < "${SCRIPT_DIR}/_redirects"

printf "%-50s %-8s %-55s %s\n" "URL_alt" "Status" "Ziel" "OK/FEHLER"
printf "%s\n" "$(printf '─%.0s' {1..130})"

for SRC_SLUG in "${!REDIRECTS[@]}"; do
  DST_SLUG="${REDIRECTS[$SRC_SLUG]}"
  SRC_URL="${BASE}/${SRC_SLUG}"
  EXPECTED_DST="${BASE}/${DST_SLUG}"

  # Follow up to 5 hops, collect status codes and locations
  RESULT=$(curl -s -o /dev/null -w "%{http_code} %{redirect_url}" --max-redirs 0 "${SRC_URL}" 2>/dev/null)
  FIRST_STATUS=$(echo "$RESULT" | cut -d' ' -f1)
  FIRST_LOCATION=$(echo "$RESULT" | cut -d' ' -f2-)

  # Now check destination returns 200
  DEST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-redirs 5 "${SRC_URL}" 2>/dev/null)

  # Check for redirect loops (if following all redirects doesn't reach 200 within 5 hops)
  if [[ "$FIRST_STATUS" == "301" && "$DEST_STATUS" == "200" ]]; then
    # Check it's a single hop (no loop): destination should match expected
    if [[ "$FIRST_LOCATION" == "$EXPECTED_DST" || "$FIRST_LOCATION" == "${EXPECTED_DST}/" ]]; then
      STATUS="OK (1 hop)"
      PASS=$((PASS+1))
    else
      STATUS="FEHLER: falsches Ziel"
      FAIL=$((FAIL+1))
    fi
  elif [[ "$FIRST_STATUS" == "301" && "$DEST_STATUS" != "200" ]]; then
    STATUS="FEHLER: Endstatus ${DEST_STATUS} (mögliche Schleife)"
    FAIL=$((FAIL+1))
  elif [[ "$FIRST_STATUS" == "200" ]]; then
    STATUS="FEHLER: kein Redirect (direkte 200)"
    FAIL=$((FAIL+1))
  else
    STATUS="FEHLER: Status ${FIRST_STATUS}"
    FAIL=$((FAIL+1))
  fi

  printf "%-50s %-8s %-55s %s\n" "/${SRC_SLUG}" "$FIRST_STATUS" "$FIRST_LOCATION" "$STATUS"
done

printf "%s\n" "$(printf '─%.0s' {1..130})"
printf "\nErgebnis: %d OK, %d FEHLER\n" "$PASS" "$FAIL"

# Extra: also verify the ratgeber/entruempelung-kosten double-hop fix
echo ""
echo "=== Sonderprüfung: /ratgeber/entruempelung-kosten (ehemals Doppel-Hop) ==="
RESULT=$(curl -s -o /dev/null -w "%{http_code} %{redirect_url}" --max-redirs 0 "${BASE}/ratgeber/entruempelung-kosten")
STATUS=$(echo "$RESULT" | cut -d' ' -f1)
LOC=$(echo "$RESULT" | cut -d' ' -f2-)
DEST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-redirs 5 "${BASE}/ratgeber/entruempelung-kosten")
printf "%-50s %-8s %-55s\n" "/ratgeber/entruempelung-kosten" "$STATUS" "$LOC"
if [[ "$STATUS" == "301" && "$LOC" == "${BASE}/entruempelung-kosten" && "$DEST_STATUS" == "200" ]]; then
  echo "  → OK: direkter 301, 1 Hop, Ziel antwortet 200"
else
  echo "  → PRÜFEN: Status=${STATUS} Endstatus=${DEST_STATUS}"
fi

echo ""
echo "=== Host-/Pfad-Normalisierung (erwartet: 301 direkt auf ${BASE}/entruempelung-erfurt) ==="
for SRC_URL in \
  "http://entruempelung-thueringen.com/entruempelung-erfurt" \
  "http://www.entruempelung-thueringen.com/entruempelung-erfurt" \
  "https://www.entruempelung-thueringen.com/entruempelung-erfurt" \
  "https://www.entruempelung-thueringen.com/entrumpelung-erfurt" \
  "${BASE}/entruempelung-erfurt.html" \
  "${BASE}/entruempelung-erfurt/"; do
  RESULT=$(curl -s -o /dev/null -w "%{http_code} %{redirect_url}" --max-redirs 0 "${SRC_URL}")
  printf "%-65s %s\n" "$SRC_URL" "$RESULT"
done
