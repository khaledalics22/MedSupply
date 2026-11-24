# MedSupply Initial Migration Corrections

## Applied corrections

- Name normalization converts to lowercase, collapses POSIX whitespace, and trims the result.
- Dosage normalization lowercases before unit replacement.
- Dosage whitespace is removed before unit replacement.
- NULL dosage normalizes to an empty string.
- `milligram`/`milligrams` normalize to `mg`.
- `gram`/`grams` normalize to `g`.
- `milliliter`/`milliliters` normalize to `ml`.
- Original `name` and `dosage` values remain unchanged.
- RLS is enabled on all six foundational tables with no policies.
- `citext` is installed in the Supabase `extensions` schema.
- Profile and account-decision foreign-key deletion behavior uses `RESTRICT`.

## Normalization test cases

| Input | Expected normalized dosage/name behavior |
|---|---|
| `500 mg` | `500mg` |
| `500 MG` | `500mg` |
| `500 milligram` | `500mg` |
| `500 MILLIGRAMS` | `500mg` |
| `1 gram` | `1g` |
| `1 GRAMS` | `1g` |
| `5 milliliters` | `5ml` |
| `5 MILLILITERS` | `5ml` |
| `NULL` | Empty string |
| `  Paracetamol\tTablet  ` | `paracetamol tablet` |

## Profile deletion decision

- `ON DELETE CASCADE` would allow Auth deletion to remove the profile and would make cascading account-decision removal a silent loss of administrative history.
- `ON DELETE RESTRICT` prevents an Auth user or profile from being deleted while linked decisions or profile records exist.
- The safest initial behavior is to deactivate accounts rather than physically delete users.
- A later explicit archival/delete workflow can be implemented after the history-preservation requirements are finalized.

## RLS confirmation

RLS is enabled on:

- `profiles`
- `account_decisions`
- `specialties`
- `stores`
- `manufacturers`
- `provider_products`

No RLS policies are created. Ordinary API-role access is denied by default until dedicated policies are added.

## Remaining concerns

- PostgreSQL POSIX whitespace behavior and Unicode normalization should be tested with real mixed-language values.
- The target project should confirm that Citext is available in `extensions`.
- Auth user deletion remains restricted until an explicit archival/deletion workflow is approved.
