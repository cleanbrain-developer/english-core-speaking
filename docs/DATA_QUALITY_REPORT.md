# Data Quality Report - Seed v2.1

## Changes from v2.0 (2026-09-14, ahead of public multi-user launch)
An automated audit of `example` quality (does it add context beyond the
`english` field it's meant to demonstrate?) found two issues, both fixed
in this revision:
- 166 rows (143 of the 200 Work English rows, 20 of 300 Conversation
  Chunk, 3 of 150 Phrasal Verb) had `example` exactly equal to `english`
  -- i.e. no additional usage context at all. Rewrote each into a short,
  natural continuation or lead-in sentence that still contains the target
  phrase, matching the style already used elsewhere in the dataset (e.g.
  id 1 `"I think so."` -> `"I think so. That should work."`).
- 9 pairs of rows (typically a Core Word alongside a Chunk/Phrasal Verb,
  or two Core Words used together naturally, e.g. `near`/`hotel`) shared
  the exact same `example` string. Rewrote one side of each pair so every
  row's example is unique across the dataset.
- Regenerated `speaking_core_1350_seed_v2.csv` from the JSON with correct
  RFC4180 field quoting. The previous CSV export never quoted fields
  containing a literal comma, so any row whose text had one (many
  Work English examples do) produced a line with extra unquoted columns
  when parsed -- a pre-existing export bug, not something introduced by
  this revision. No code reads this CSV (only the JSON is loaded at
  runtime), so it had no production impact, but it's now valid CSV.
- No changes to `korean`, `rank`, `id`, or category counts. Automated
  validation (below) still passes.

## Changes from v1
- Removed duplicate English entries inside Core Word while preserving the 700-item count.
- Replaced duplicate slots with additional useful spoken/general vocabulary.
- Replaced untranslated Core Word Korean glosses.
- Removed generated placeholder examples such as `This is a common word: ...`.
- Added stable per-category `rank`, `datasetVersion`, and `sourceType`.

## Automated validation
- Total rows: 1,350
- Conversation Chunk: 300
- Phrasal Verb: 150
- Core Word: 700
- Work English: 200
- Within-category duplicate English strings: 0
- Core Word gloss where Korean equals English: 0
- Known placeholder example patterns: 0
- Rows where `example` equals `english` (no added context): 0
- Duplicate `example` strings across the dataset: 0

## Important limitation
The current ordering is a curated speaking-priority curriculum. It should not be described as an exact universal frequency ranking. A later v3 can add independently sourced corpus-frequency metadata while preserving stable IDs.

## Content provenance (recorded 2026-09-14, ahead of public multi-user launch)
All 1,350 rows carry `sourceType: "curated-speaking-core"`. This content was
AI-generated (no specific textbook, word list, or corpus was used as an
input); the original author does not have a record of any single external
source it was drawn from. No row cites or is known to reproduce a specific
copyrighted textbook, workbook, or proprietary word list.

Assessed risk: low. The dataset is overwhelmingly short, common
conversational phrases and single words ("I think so.", "go on", "get")
that are not independently copyrightable expressions, and no distinctive,
book-length, or otherwise creatively unique passages are present. This is
not a legal opinion -- if the dataset is redistributed at meaningful scale
or a specific overlap is ever flagged, re-review at that time.
