# Public Open Client HTTP API — v0 candidate

This page documents only the Open Client health and LUMI boundary. It is not a complete inventory of Cloud account, billing, quota, administrative, or test-fixture routes. Those routes are outside this third-party teaching-package API snapshot.

Contract snapshot independently checked against Cloud `main` after the R3 delivery on 2026-10-12. The merged R3 delivery adds bounded request handling and sanitized failures. Optional package context remains experimental and is not present on `main`.

## Implemented — health v0

`GET /health` is public and does not access the database or an external service.

```json
{
  "status": "ok",
  "service": "volk-dev-backend",
  "apiVersion": "0"
}
```

The exact response shape is in `../formats/schemas/health-response-v0.schema.json`.

## Implemented — legacy LUMI v0

`POST /v0/lumi/respond` accepts structured semantic context and returns a typed proposal. It does not execute an experiment, mutate the World, or create Evidence. The request must contain `apiVersion: "0"` and an `inquiry` object. Canonical wire fields use camelCase. The server also accepts historical aliases for selected inputs: `id`, `question`, and `depth` in `inquiry`; `id`, `type`, and `kind` for event/evidence identifiers; and `id` for concept identifiers. New clients should use only canonical names. Unknown fields are rejected. Request field bounds are summarized below; the request schema describes the canonical shape, and the complete legacy response shape is in `../formats/schemas/lumi-response-v0.schema.json`.

Minimal request:

```json
{
  "apiVersion": "0",
  "inquiry": {
    "currentQuestion": "What changed after the new sample?"
  },
  "requestId": "sample-run-1"
}
```

Observed response from the current deterministic policy for the minimal request above:

```json
{
  "apiVersion": "0",
  "requestId": "sample-run-1",
  "action": "STAY_SILENT",
  "payload": {},
  "message": null,
  "requiresLearnerConfirmation": false,
  "reasonCode": "no_trigger"
}
```

### Request fields

| Field | Required | Bounds / meaning |
| --- | --- | --- |
| `apiVersion` | yes | String, 1–16 characters; only exact value `"0"` is supported. |
| `inquiry` | yes | Optional `inquiryId` / `orchestrationId` ≤128, `currentQuestion` ≤2000, `currentDepth` ≤64. Historical aliases: `id`, `question`, `depth`. |
| `prediction` | no | `expectation` 1–2000 required when present; optional `reasoning` ≤4000. |
| `experiment` | no | Optional `worldIdentity` ≤256, `baseline` ≤1000, `activeComparison` ≤1000. Descriptive context, not executable controls. |
| `recentEvents` | no | Up to 32; each event requires `eventType` 1–128 and may include `eventId` ≤128 and `summary` ≤2000. Historical aliases: `type` / `kind` for `eventType`, `id` for `eventId`. |
| `evidence` | no | Up to 32; each item requires `evidenceId` and `evidenceType` (1–128), may include `summary` ≤2000 and up to 16 `facts`. IDs refer to client-created Evidence. Historical aliases: `id` for `evidenceId`, `type` / `kind` for `evidenceType`. |
| `candidateConcepts` | no | Up to 32; each requires `conceptId` 1–128 and `label` 1–256, with optional confidence 0–1. Historical alias: `id` for `conceptId`. |
| `conceptsEncountered`, `conceptsEvidenced` | no | Up to 64 strings each; each string ≤128. |
| `recentLumiActions` | no | Up to 16 finite action names, optionally with `reasonCode` ≤128. |
| `policy` | no | Optional `autonomyLevel` ≤64 and `proactiveAllowed` (default `true`). These are hints, not execution authority. |
| `requestId` | no | ≤128; echoed when supplied, otherwise the service generates a UUID. |

Cloud `main` enforces a default total request body limit of 512 KiB (configurable from 1 KiB to 4 MiB), a body-read deadline of 10 seconds (0.1–60 seconds), and a LUMI policy deadline of 5 seconds (0.1–30 seconds). A timeout cancels the policy task; client disconnect also requests cancellation. These are bounded service behaviors, not an endpoint rate limit or a guarantee that arbitrary external work can be rolled back. In addition to the field bounds above, each Evidence `facts` string is limited to 2,000 characters and each `conceptsEncountered` / `conceptsEvidenced` string to 128 characters.

### Response and errors

Responses include `apiVersion`, `requestId`, `action`, typed `payload`, nullable `message` (≤3000), `requiresLearnerConfirmation`, and nullable `reasonCode` (≤128). The action vocabulary is finite: `ASK`, `SUGGEST_EXPERIMENT`, `PROPOSE_HYPOTHESIS`, `PROPOSE_COUNTEREXAMPLE`, `HIGHLIGHT_EVIDENCE`, `OFFER_COMPARISON`, `OFFER_DEPTH`, `NAME_CONNECTION`, `REFLECT_PATH`, and `STAY_SILENT`. Experiment/hypothesis/counterexample proposals require learner confirmation; other actions do not. A proposal never executes itself.

| HTTP | Code | Meaning |
| --- | --- | --- |
| 200 | — | Typed response. Invalid policy output or action safety failure returns `STAY_SILENT` with `reasonCode: "policy_invalid_fallback"`. |
| 400 | `unsupported_api_version` | Request version is not exactly `"0"`. |
| 422 | `invalid_request` | Invalid shape/value or an unknown field; body contains a safe static message and request ID. |
| 408 | `request_timeout` | Request body was not received before its configured read deadline. |
| 413 | `request_too_large` | Request body exceeds the configured byte limit. |
| 500 | `internal_error` | Unexpected request failure; fixed safe message, with sanitized server logging. |
| 503 | `policy_failure` | Policy raised an error; body contains a fixed safe message and request ID, not exception text. |
| 504 | `policy_timeout` | LUMI policy exceeded its configured deadline; policy task cancellation is requested. |

The error envelope is `{"error":{"code":"...","message":"...","requestId":"..."}}`. A CORS preflight from an origin outside the configured allowlist can receive middleware HTTP 400; that is not a LUMI JSON error. Current defaults allow the two local development origins `http://localhost:5173` and `http://127.0.0.1:5173`; deployment may configure exact allowed origins. CORS is not authentication. These two routes have no authentication dependency.

Cloud consumes only structured context supplied by the client. The client remains authoritative for World, Experiment, and Evidence truth. Cloud does not execute proposals. Current policy is stateless and deterministic; an LLM/provider-backed policy is future work. The response validator checks evidence references against supplied IDs, but clients must not treat arbitrary `facts` text as canonical detector output.

## Experimental — package-aware LUMI context (not on current main)

The experimental extension adds optional `learningContext` to the same request: package `id`, `contentVersion`, lowercase SHA-256 `fingerprint`, current node `id`/`kind`, and 1–8 unique typed `allowedCandidates`. JSON `null` is not equivalent to omission. The current experimental schema fragment is `../formats/schemas/cloud-learning-context.schema.json`; its runtime validator also enforces unique candidate IDs. This extension is not on current Cloud `main`.

For a contextual non-silent response, the experimental contract requires `candidateId` and exact action, payload, and confirmation equality with one submitted candidate. A contextual `STAY_SILENT` has no candidate ID, and contextual `message` is serialized as null. Candidate Evidence IDs are checked against request Evidence IDs. Candidate text remains client-provided context, not new truth. The complete contextual response shape is `../formats/schemas/lumi-response-v0-contextual.schema.json`.

The experimental service validates fingerprint syntax only. It has no current package registry and cannot check whether the client still has the same package/node/request active. VOLK-ML owns stale-response checks against the in-flight request, current fingerprint/node, and session generation before projection. Current Cloud `main` rejects the unknown `learningContext` field with 422; the client uses its bounded local fallback and must not retry after dropping candidate constraints.

## Security and operational boundary

Requests are unauthenticated on these two endpoints. The Cloud service owns private secrets; they do not belong in the public client or package. Configure CORS to the exact browser origins required by the deployment, but do not treat CORS as access control. Health is dependency-free. LUMI currently uses a deterministic policy and has no external provider, endpoint rate limit, or learner-state persistence. Request bounds, deadlines, safe error envelopes, and sanitized exception handling are part of the checked R3 Cloud main snapshot. The local exploration client must continue working when Cloud is absent, offline, slow, or returns an error.

Operational limitation: these routes have no authentication or endpoint rate limiting. Do not expose them as a production public service without a separate security and deployment review.
