#!/usr/bin/env python3
import json, collections, hashlib, pathlib, sys
p=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'data/speaking_core_1350_seed_v2.json')
d=json.loads(p.read_text(encoding='utf-8'))
counts=collections.Counter(x['category'] for x in d)
expected={'Conversation Chunk':300,'Phrasal Verb':150,'Core Word':700,'Work English':200}
assert len(d)==1350, len(d)
assert counts==expected, counts
for cat in expected:
    vals=[x['english'].strip().lower() for x in d if x['category']==cat]
    assert len(vals)==len(set(vals)), f'duplicate in {cat}'
assert not [x for x in d if x['category']=='Core Word' and x['korean'].strip().lower()==x['english'].strip().lower()]

import re
def normalize(s):
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]', ' ', s.lower())).strip()

trivial=[x for x in d if normalize(x['example'])==normalize(x['english'])]
assert not trivial, f'{len(trivial)} rows have example == english (no added context): ids {[x["id"] for x in trivial][:10]}'

example_counts=collections.Counter(x['example'] for x in d)
dup_examples=[ex for ex, n in example_counts.items() if n>1]
assert not dup_examples, f'{len(dup_examples)} duplicate example strings: {dup_examples[:5]}'

print('OK', len(d), dict(counts))
print('SHA256', hashlib.sha256(p.read_bytes()).hexdigest())
