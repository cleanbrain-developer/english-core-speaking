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
print('OK', len(d), dict(counts))
print('SHA256', hashlib.sha256(p.read_bytes()).hexdigest())
