# Private Hosted Build v2

This reference describes the one-shot native Data Tool profile for private, isolated acceptance. Query the configured target for capability. The profile defaults to unavailable. No public service URL is specified.

## HTTP

All routes below are relative to `/api/v2/build/hosted`. Resource operations require the current owner's account session. The grant, deployment and run IDs carry no authority on their own.

| Method and suffix | Request and result |
| --- | --- |
| `GET /capability` | Returns `available` and `manifestVersion`. |
| `POST /deployments` | Accepts the [deployment manifest](deployment.schema.json). Returns `id`, `digest`, and `sources` for an immutable owner-scoped deployment. |
| `POST /deployments/{id}/grants` | Send `deploymentDigest` and integer `ttlSeconds` (1–900). Returns the grant ID, deployment ID and digest, expiry, revocation time, and `sources`. |
| `POST /runs` | Send `grantId` with an owner-scoped `Idempotency-Key`. One grant permits one new run. Identical retries return the existing run. Another run needs a fresh grant. |
| `GET /runs/{id}` | Returns the owner's run view with status, result, usage, source references, and trace summary. |
| `POST /runs/{id}/cancel` | Cancels work that has not settled and fences late results. Committed results remain readable. |
| `POST /grants/{id}/revoke` | Revokes future invocation and fences active work for that grant. |

The [v1 profile](../v1/README.md) has separate deployment, grant and run identities. V2 exposes no scheduling or sharing routes.

## Manifest validation

For `volk.build.hosted-deployment.v2`, the only execution profile is `data-prepare-category-dedup-fixture-v1`. Each `agent`, `tool`, and `recipe` includes a resource reference and the original bytes of its registry JSON blob as padded RFC 4648 Base64. Each decoded blob must be valid UTF-8 JSON with unique keys, at most 4096 bytes, and match the SHA-256 in its resource reference. Re-serializing a decoded object can change the original bytes and its digest.

The three decoded objects must match the supported schemas and link by exact reference from Agent to Tool to Recipe to Dataset. All four references must belong to the same source workspace and name different resources. Source references document the input provenance. Only the authenticated Cloud account owns the resulting deployment.

The allowed Tool binding is `workspace.data-prepare@1.0.0 / prepare-table.v1`. The permitted instruction is `Select categoryCode and keep the first row for each distinct category.` The recipe selects the single string column `categoryCode` and then removes duplicate values in first-seen order. A different valid local recipe, such as filtering, is outside this profile. The envelope sends only a reference and `fixtureId: "synthetic-category-codes-json-v1"` for the Dataset. The service owns the corresponding exact 85 synthetic bytes, whose SHA-256 is `8dde2f18a7000b4d0988261c5028fd8cfaf1d02cf472aa7340793392c30ce734`.

The schema checks structure. The service additionally verifies exact references, native schemas, recipe admission, decoded bytes and digests. The deployment digest is SHA-256 over ASCII JSON of the validated envelope, with recursively sorted keys and compact separators. Array order is preserved.

## Observed result

The run view carries `id`, `deploymentId`, `deploymentDigest`, `grantId`, `status`, `sources`, `result`, `usage`, and `trace`. Each source set contains `agentRef`, `toolRef`, `recipeRef`, and `datasetRef`. The trace records status, those same sources, and whether the Tool completed. Committed usage also carries those sources.

The ordered category codes `A,B,A,C` yield `A,B,C` and original zero-based row ordinals `[0,1,3]`. A committed success includes the typed `volk.build.data-table.v1` result with step audit, one Tool call, four rows read, three rows produced, measured elapsed milliseconds, and zero cost under `free_fixture`. Before commitment, result and usage are null. An unknown claim is not dispatched again automatically.
