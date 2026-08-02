# Unsupported fields report

## Batch disposition

All agricultural fields in `egypt-arab-region-plants-001-safe-review` remain unavailable for import unless separately represented in the field-level source map. No missing field is filled by inference.

## Candidate fields retained as pending

| Candidate IDs | Field | State | Gap |
| --- | --- | --- | --- |
| tomato, pepper, cucumber, potato, strawberry | `payload.scientificName` | `PENDING_SOURCE_REVIEW`, `PENDING_SCIENTIFIC_REVIEW` | GBIF taxonomy provenance is recorded, but field-level approvals are incomplete. |

Strawberry additionally retains a pending hybrid-notation taxonomy review.

## Fields unavailable for every withheld candidate

- Arabic and English display names: `NOT_AVAILABLE` for import because Arabic-language review is absent.
- Aliases, crop category, growth stages, geographic suitability, cultivar scope, growing advice, and other metadata: `NOT_AVAILABLE`; no approved field-level agricultural authority is attached.
- Images and image captions: `NOT_AVAILABLE`; no file-level rights approval is recorded.
- Diseases, pests, deficiencies, diagnostics, treatments, product recommendations, and all relationships: `NOT_AVAILABLE`; no approved relationship-level authority, review, or local applicability evidence is attached.

## Preserved entity-specific gaps

- Citrus: species-level split required.
- Banana: cultivar taxonomy unresolved.
- Beans: common-name scope unresolved.
- Strawberry: hybrid notation requires taxonomy review.

No agricultural record is authorized for import or publication while these gaps remain.
