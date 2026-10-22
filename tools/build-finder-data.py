# Regenerate data/terratwin-real.js from the Excel file:
#   python tools/build-finder-data.py "final data.xlsx" data/terratwin-real.js
# (needs: pip install openpyxl)
import openpyxl, json, sys
src, out = sys.argv[1], sys.argv[2]
wb = openpyxl.load_workbook(src, data_only=True)
rows = list(wb['All_Sites'].iter_rows(values_only=True)); H = rows[0]
R = [dict(zip(H, r)) for r in rows[1:]]

# target descriptions from the similarity sheets (6 curated targets per body)
desc = {}
for sheet, body in [('Similarity_to_Mars', 'Mars'), ('Similarity_to_Moon', 'Moon')]:
    order = []
    for r in list(wb[sheet].iter_rows(values_only=True))[1:]:
        if r[0] not in desc:
            desc[(body, r[0])] = r[1]; order.append(r[0])
    desc[body + '_order'] = order

def r2(x, n=3): return None if x is None else round(float(x), n)

def feat(r):
    return {
        'slope': r2(r['slope_percentile'] / 100, 4),
        'roughness': r2(r['roughness_percentile'] / 100, 4),
        'albedo': r2(r['albedo_norm'], 4),
        'thermal': r2(r['temp_swing_norm'], 4),
    }

earth, rejected, targets = [], [], {'mars': [], 'moon': []}
for r in R:
    base = {
        'id': f"{r['type'].lower()}-{r['source_id']}",
        'name': r['location_name'],
        'region': r['real_place_name'] or '',
        'lat': r2(r['lat'], 5), 'lon': r2(r['lon'], 5),
        'terrain': r['terrain_type'],
        'elevation_m': r2(r['elevation_m'], 1),
        'slope_deg': r2(r['slope_deg'], 2),
        'roughness_m': r2(r['roughness_m'], 2),
        'albedo': r2(r['albedo'], 3),
        'temp_max_C': r2(r['temp_max_C'], 1), 'temp_min_C': r2(r['temp_min_C'], 1),
        'temp_swing_C': r2(r['temp_swing_C'], 1),
        'slope_class': r['slope_class'],
        'subtype': r['analog_subtype'],
        'environment': r['analog_environment_type'],
        'ndvi': r2(r['ndvi'], 3),
        'f': feat(r),
    }
    if r['type'] == 'Earth':
        base['is_official'] = bool(r['is_official_analog'])
        passed = (r['ndvi'] or 0) <= 0.20 and not str(r['analog_subtype']).startswith('negative_control')
        (earth if passed else rejected).append(base)
    else:
        body = r['type'].lower()
        key = (r['type'], r['location_name'])
        if key in desc:
            base['description'] = desc[key]
            base['order'] = desc[r['type'] + '_order'].index(r['location_name'])
            targets[body].append(base)
for b in targets: targets[b].sort(key=lambda t: t['order'])

data = {'earth': earth, 'rejected': rejected, 'targets': targets,
        'meta': {'source': 'final data.xlsx', 'ndvi_gate': 0.20,
                 'method': 'TASI = 100 * (1 - weighted RMS of feature differences). Mars: slope, roughness, albedo, thermal. Moon: slope, roughness, albedo.'}}
with open(out, 'w', encoding='utf-8') as fh:
    fh.write('/* TerraTwin real dataset — generated from "final data.xlsx" (All_Sites sheet).\n'
             ' * earth   : Earth analog sites that passed the NDVI gate (<= 0.20), negative controls removed\n'
             ' * rejected: sites removed by the NDVI gate (kept for reference)\n'
             ' * targets : the 6 curated Mars and 6 Moon reference sites\n'
             ' * f       : normalised features used by TASI (slope/roughness percentile, albedo_norm, temp_swing_norm)\n */\n')
    fh.write('window.TERRATWIN_REAL = ' + json.dumps(data, ensure_ascii=False, indent=1) + ';\n')
print(len(earth), 'earth', len(rejected), 'rejected', {k: [t['name'] for t in v] for k, v in targets.items()})
print(sum(e['is_official'] for e in earth), 'official')
from collections import Counter; print(Counter(e['terrain'] for e in earth)); print([x['name'] for x in rejected])
