#!/usr/bin/env python3
"""
Entrümpelung Seiten-Generator
Verwendung:
  python3 generator/generate.py                        # Alle Tier-1 und Tier-2 Städte
  python3 generator/generate.py --tier 1               # Nur Tier-1
  python3 generator/generate.py --tier 2               # Nur Tier-2
  python3 generator/generate.py --stadt Eisenach       # Einzelne Stadt
  python3 generator/generate.py --domain https://entruempelung-deutschland.com --outdir /workspace/entruempelung-deutschland
"""

import json
import re
import sys
import os
from urllib.parse import quote

def load_data():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(script_dir, 'cities.json'), encoding='utf-8') as f:
        data = json.load(f)
    with open(os.path.join(script_dir, 'template.html'), encoding='utf-8') as f:
        template = f.read()
    return data, template

def process_conditionals(html, variables):
    """Handle {{IF_X}}...{{/IF_X}} and {{UNLESS_X}}...{{/UNLESS_X}} blocks."""
    # IF blocks
    def replace_if(m):
        key = m.group(1)
        content = m.group(2)
        return content if variables.get(key) else ''
    html = re.sub(r'\{\{IF_(\w+)\}\}(.*?)\{\{/IF_\1\}\}', replace_if, html, flags=re.DOTALL)
    # UNLESS blocks
    def replace_unless(m):
        key = m.group(1)
        content = m.group(2)
        return content if not variables.get(key) else ''
    html = re.sub(r'\{\{UNLESS_(\w+)\}\}(.*?)\{\{/UNLESS_\1\}\}', replace_unless, html, flags=re.DOTALL)
    return html

def build_page(city, template, domain):
    stadtteile = city.get('stadtteile', [])
    stadtteile_liste = ', '.join(stadtteile)
    stadtteile_kurz = ', '.join(stadtteile[:3])  # first 3 for meta
    stadtteile_options = '\n'.join(
        f'            <option value="{s}">{s}</option>' for s in stadtteile
    )
    stadtteile_tags = '\n      '.join(
        f'<span class="ort-tag">{s}</span>' for s in stadtteile
    )
    areaserved = [city['stadt']] + stadtteile
    areaserved_json = json.dumps(areaserved, ensure_ascii=False)

    slug_encoded = quote(city['stadt'].encode('utf-8'))

    tier = city.get('tier', 1)
    hook = city.get('hook', '')
    tier2_absatz = city.get('tier2_absatz', '')

    variables = {
        'HOOK': bool(hook),
        'TIER2': tier == 2,
    }

    replacements = {
        '{{stadt}}':             city['stadt'],
        '{{slug}}':              city['slug'],
        '{{slug_encoded}}':      slug_encoded,
        '{{region}}':            city.get('region', ''),
        '{{landkreis}}':         city.get('landkreis', city.get('region', '')),
        '{{hook}}':              hook,
        '{{preis_keller}}':      city.get('preis_keller', '120'),
        '{{preis_wohnung}}':     city.get('preis_wohnung', '280'),
        '{{tier2_absatz}}':      tier2_absatz,
        '{{stadtteile_liste}}':  stadtteile_liste,
        '{{stadtteile_kurz}}':   stadtteile_kurz,
        '{{stadtteile_options}}': stadtteile_options,
        '{{stadtteile_tags}}':   stadtteile_tags,
        '{{areaserved_json}}':   areaserved_json,
        '{{domain}}':            domain,
    }

    html = template
    html = process_conditionals(html, variables)
    for placeholder, value in replacements.items():
        html = html.replace(placeholder, value)

    return html

def main():
    args = sys.argv[1:]

    # Parse args
    filter_tier = None
    filter_stadt = None
    domain = None
    outdir = None

    i = 0
    while i < len(args):
        if args[i] == '--tier' and i + 1 < len(args):
            filter_tier = int(args[i+1]); i += 2
        elif args[i] == '--stadt' and i + 1 < len(args):
            filter_stadt = args[i+1]; i += 2
        elif args[i] == '--domain' and i + 1 < len(args):
            domain = args[i+1]; i += 2
        elif args[i] == '--outdir' and i + 1 < len(args):
            outdir = args[i+1]; i += 2
        else:
            i += 1

    data, template = load_data()
    if domain is None:
        domain = data['meta']['domain']
    if outdir is None:
        # Default: repo root (one level up from generator/)
        outdir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    cities = data['cities']

    # Filter
    if filter_stadt:
        cities = [c for c in cities if c['stadt'].lower() == filter_stadt.lower()]
    elif filter_tier:
        cities = [c for c in cities if c.get('tier') == filter_tier]
    else:
        # Skip tier 3 — those are manual rewrites
        cities = [c for c in cities if c.get('tier', 1) <= 2]

    generated = 0
    skipped = 0
    for city in cities:
        tier = city.get('tier', 1)
        if tier == 3 and not filter_stadt:
            print(f"  SKIP  {city['stadt']} (Tier 3 – manueller Rewrite)")
            skipped += 1
            continue

        html = build_page(city, template, domain)
        filename = f"entrumpelung-{city['slug']}.html"
        filepath = os.path.join(outdir, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"  ✓  {city['stadt']} (Tier {tier}) → {filename}")
        generated += 1

    print(f"\nFertig: {generated} Seiten generiert, {skipped} übersprungen.")
    if skipped:
        print("Tier-3-Städte (manueller Rewrite): Erfurt, Nordhausen, Ilmenau")

if __name__ == '__main__':
    main()
