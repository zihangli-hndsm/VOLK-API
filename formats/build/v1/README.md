# Build Workspace v1 · candidate

This namespace describes portable Build metadata. The [schema](workspace.schema.json) uses JSON Schema 2020-12, with the explicit discriminator `schemaVersion` on each top-level record. Validate the schema and [lifecycle and semantic vectors](lifecycle.json) before accepting a record. Fields are closed in v1. Any incompatible change needs a new version. Nothing in the namespace opens a server endpoint or changes the Episode or LUMI contracts. The [fixture](fixture.json) has synthetic metadata; its sample digest covers the two UTF-8 bytes for `{}` and demonstrates byte identity only.

Run `node formats/build/v1/check-lifecycle.mjs` from the repository root to exercise the metadata examples. The checker uses small synthetic records and does not start a runtime. The license scope remains defined by [LICENSE-SCOPE.md](../../../LICENSE-SCOPE.md).

## Identities and data

- A workspace is a UUID namespace. A resource has a UUID inside the workspace, a kind and immutable, monotonically increasing positive revisions. Its exact reference contains the workspace and resource IDs, revision and lowercase content SHA-256. Revisions are identities, not localized labels. A stored version is always resolved by its exact reference. Reject conflicts and never silently replace a missing revision with the latest.
- A resource record holds metadata and a storage `kind`. The body stays in a local byte store or behind an adapter-owned opaque locator. There is no raw file path, URL, credential or file data in a portable locator. Hash stored payload bytes directly; for portable JSON payloads encode canonical JSON per RFC 8785 as UTF-8. Independently verify records before materialization. Do not deduplicate authority: identical bytes may share storage inside a workspace without sharing file handles or grants.
- Workflow, Agent and Tool are resource kinds. Native graph v10 exports and pinned Workflow Tool binding/contracts remain separate payload identities. Their adapters must carry the native digest and target allowlist internally; recording a Build resource revision never authorizes execution. Tool effect claims, effective grants, actual target capability and resource consent are validated separately in the owning runtime.
- Preserve a native Workflow snapshot as opaque original bytes. The Resource SHA-256 hashes the exact stored body. It does not replace the native source, semantic graph, execution or package identity. A re-encoded package may yield a different Resource SHA even if its execution identity is unchanged. Resource retrieval must return the exact bytes, allowing the native Workflow validator to recover the same identities.

## Run and trace

- A run captures an immutable input snapshot, target and budget prior to start. Later edits create a new run. Elapsed time and usage are observed independently of the budget. Unknown usage is omitted. Currency, when supplied, uses a declared unit instead of relying on floating-point display labels.
- State transitions are `queued → running → succeeded | failed | cancelled`, `queued → failed | cancelled` and `running ↔ waitingApproval`. `waitingApproval` can cancel or fail. A terminal state is final. A late Worker/provider message after cancellation cannot create results or modify the terminal run. An unknown side effect is recorded as an explicit error/reconciliation outcome, never retried automatically.
- Every event must belong to a run and its workspace. Sequence is strictly increasing; event IDs are unique. A parent belongs to the same run and has an earlier sequence. A tool result points to its invocation, a model result to its request, and an approval resolution to its approval request. Resource references stay within the workspace. Treat identical event replays as idempotent. Use safe stable code identifiers for errors. Trace records references, states and measured counters; prompts, row contents, credentials, and provider thought are outside the trace model.
- Record `createdAt`, `startedAt`, `finishedAt` and event `timestamp` in UTC epoch milliseconds. Compare elapsed durations with the runtime's monotonic clock where available. A run that fails or is cancelled before starting has no `startedAt`. Its terminal timestamp remains required. Errors and outputs must be reflected by the authoritative runtime; a failure may refer to outputs committed before failure, with their provenance retained.
- The browser grants effective authority at the resource/provider/tool boundary. A serialized approval reference describes an observation. It never serves as a bearer grant after reload. Resume requires current approval for the exact pending action. Apply transition and publication atomically against the current run generation; late output and conflicting replays cannot alter state.
- Run IDs must be unique across the accepting store. Resolve event workspace through the trusted run record. Both local and hosted adapters only project registry codes, and syncing/exporting projects must use an explicit allowlist. A local display name can be private; omit or redact it before a public projection. Use only synthetic names and locators in examples.

## Environment adapters

The Phase 1 test profile is `local / browser-cpu / 1`. A target declaration and a live assessment are distinct. Unknown profiles, unknown versions and cloud targets are unavailable in the Phase 1 adapter. A local target can also be unavailable if the current environment cannot run its registered operations.

The application-facing adapters have these minimum contracts. They remain metadata-only in Phase 1 and define no HTTP endpoints.

| Operation | Input | Result |
|---|---|---|
| `assess` | Exact target, requested operation, local immutable subject and input references | `volk.build.capability.v1`; a successful assessment still requires effective execution grants |
| `syncMetadata` | Authenticated owner context, workspace ID, base revision, idempotency key, fingerprint of the permitted metadata projection | New accepted revision or typed `target_unavailable`, `workspace_mismatch`, `revision_conflict` or `idempotency_conflict` |
| `submit` | Unique run ID, exact target, immutable input snapshot and effective local or hosted grants | Stored queued run or typed error before dispatch |
| `inspect` / `cancel` | Trusted owner/workspace context and scoped run ID | Current compatible run record; cancellation cannot create an output |

Cloud `syncMetadata` and `submit` return `target_unavailable` before write, enqueue or network dispatch in Phase 1. A future hosted endpoint derives owner identity from authentication, uses a scoped compare-and-set revision, and binds idempotency to owner, workspace and payload fingerprint. Publish its wire format and conformance separately before allowing remote execution or sharing.
