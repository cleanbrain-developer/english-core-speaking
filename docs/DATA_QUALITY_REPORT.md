# Data Quality Report - Seed v2.0

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
