# Field-level provenance policy

## Scope

This policy governs the Sprint 15B-4 evidence package and any later agricultural knowledge import. It does not authorize an import, publication, relationship creation, treatment guidance, or image use.

## Required provenance unit

Every non-empty agricultural claim is independently traceable by entity ID, field path or claim key, source ID, citation, license, review states, geographic applicability, and batch ID. A record may combine authorities, but no field inherits approval from another field or record.

## Field states

- `APPROVED`: source, license, and required reviews are recorded for that field.
- `PENDING_SOURCE_REVIEW`: source selection or source review is incomplete.
- `PENDING_SCIENTIFIC_REVIEW`: scientific validation is incomplete.
- `PENDING_LANGUAGE_REVIEW`: Arabic-language validation is incomplete.
- `NOT_AVAILABLE`: the field is intentionally empty because no supported value is available.

Unsupported optional fields must remain pending or unavailable; they must not be inferred from a related field, a common name, a photograph, or an unsourced generalization.

## Gates

An agricultural record is importable only when each populated required field has compatible reuse evidence and the required source, scientific, and Arabic-language approvals. Publication is blocked if any required diagnostic, relationship, treatment, or product-recommendation claim lacks approved authority. Images require separate file-level rights approval. Geographic applicability and local label or regulatory requirements must be explicit; otherwise they remain unavailable.

For `egypt-arab-region-plants-001-safe-review`, these gates are not met. Its records and relationships artifacts therefore remain empty by design.
