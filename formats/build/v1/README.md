# Build Workspace v1 · candidate

This namespace describes portable Build metadata. The [schema](workspace.schema.json) uses JSON Schema 2020-12, with the explicit discriminator `schemaVersion` on each top-level record. Validate the schema and semantic invariants before accepting a record. Fields are closed in v1. Any incompatible change needs a new version. Nothing in the namespace opens a server endpoint or changes the Episode or LUMI contracts.

## Identities and data

- A workspace is a UUID namespace. A resource has a UUID inside the workspace, a kind and immutable, monotonically increasing positive revisions. Its exact reference contains the workspace and resource IDs, revision and lowercase content SHA-256. Revisions are identities, not localized labels. A stored version is always resolved by its exact reference. Reject conflicts and never silently replace a missing revision with the latest.
- A resource record holds metadata and a storage `kind`. The body stays in a local byte store or behind an adapter-owned opaque locator. There is no raw file path, URL, credential or file data in a portable locator. Hash stored payload bytes directly; for portable JSON payloads encode canonical JSON per RFC 8785 as UTF-8. Independently verify records before materialization. Do not deduplicate authority: identical bytes may share storage inside a workspace without sharing file handles or grants.
- Workflow, Agent and Tool are resource kinds. Native graph v10 exports and pinned Workflow Tool binding/contracts remain separate payload identities. Their adapters must carry the native digest and target allowlist internally; recording a Build resource revision never authorizes execution. Tool effect claims, effective grants, actual target capability and resource consent are validated separately in the owning runtime.

## Run and trace

- A run captures an immutable input snapshot, target and budget prior to start. Later edits create a new run. Elapsed time and usage are observed independently of the budget. Unknown usage is omitted. Currency, when supplied, uses a declared unit instead of relying on floating-point display labels.
- State transitions are `queued → running → succeeded | failed | cancelled`, `queued → failed | cancelled` and `running ↔ waitingApproval`. `waitingApproval` can cancel or fail. A terminal state is final. A late Worker/provider message after cancellation cannot create results or modify the terminal run. An unknown side effect is recorded as an explicit error/reconciliation outcome, never retried automatically.
- Every event must belong to a run and its workspace. Sequence is strictly increasing, event IDs are unique, parent events precede children, and resource references stay within the workspace. Treat a replayed delivery with identical identity and content as idempotent. Use safe stable code identifiers for error details. By default, trace records references, states and measured counters; prompts, row contents, credentials, and provider thought are outside the trace model.
- The browser grants effective authority at the resource/provider/tool boundary. A serialized approval or grant reference describes an observation or dependency. It never serves as a bearer grant after reload.

## Environment adapters

The first implementation uses local browser capabilities. A target profile and its current status are distinct, and unknown targets are unavailable. A cloud sync adapter will need an authenticated owner/workspace and a verified base revision for conditional, idempotent metadata writes; an execute adapter needs current runtime capability, immutable accepted snapshot and effective authorization. Build v1 local operation does not perform cloud synchronization or synthesize a hosted success result.
