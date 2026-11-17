# Private Hosted Build HTTP v1

This contract describes the bounded, opt-in Hosted Build profile. The client must ask the configured service for capability before offering it. No public service URL is specified here. Providers, pricing, and cloud availability depend on the service configuration. This profile performs one deterministic, read-only category count and has no provider charge.

The path prefix is `/api/v1/build/hosted`. Resource operations require a current account session. The deployment ID, grant ID and idempotency key do not act as credentials. All resources are scoped to the authenticated owner.

| Method and suffix | Request and result |
| --- | --- |
| `GET /capability` | Returns `available` and `manifestVersion`. Without this profile configured, `available` is false. |
| `POST /deployments` | Accepts the [hosted manifest](deployment.schema.json) and returns `id` and `digest`. Stores an immutable owned deployment without running it. |
| `POST /deployments/{id}/grants` | Requires `deploymentDigest` and integer `ttlSeconds` from 1 to 900. Returns a short-lived invocation grant for that exact version. |
| `POST /runs` | Accepts `grantId` with an owner-scoped `Idempotency-Key`. Returns an existing run for the same request replay. A different request under that key fails with a conflict. |
| `GET /runs/{id}` | Returns the owner's state, result and usage. Result and usage are null until committed. |
| `POST /runs/{id}/cancel` | Cancels active work and fences a late output. Already committed terminal results remain inspectable. |
| `POST /grants/{id}/revoke` | Revokes future invocation and active work for that grant. It does not change other grants. |

Run states are `queued`, `running`, `succeeded`, `cancelled`, `revoked`, `expired` and `unknown`. Unknown work is not automatically re-executed. Successful usage contains `toolCalls`, `rowsRead`, `elapsedMs`, `costMicros` and `costBasis`. The fixture returns `costBasis: "free_fixture"` with zero provider cost. A result uses `distinctCategoryCount`.

The manifest accepts one Tool and 1–256 explicitly selected category rows. Validate with the included schema. Source identifiers are provenance and are not proof of ownership or an invocation grant. The server computes a SHA-256 over validated ASCII JSON with recursively sorted object keys and compact separators. Arrays retain order. The manifest is distinct from an inert local Workspace package.

The [synthetic manifest](count-deployment.json) contains four rows and produces three distinct categories. Its compact-JSON SHA-256 is `ce9f9e816015675cfda136d4a490b19ec2343c7bf557e07c18a397a677a6454f`. It contains no account details, credentials or grants.

## Schedules

All calls use the same authenticated account and Hosted capability.

| Method and suffix | Request and result |
| --- | --- |
| `POST /schedules` | Send the closed policy below with an owner-scoped `Idempotency-Key`. Returns the schedule view. An identical replay returns the existing schedule. Changing the policy under the same key returns 409. |
| `GET /schedules/{id}` | Returns the owner's schedule view. |
| `POST /schedules/{id}/cancel` | Cancels future occurrences and active runs from this schedule. Committed results and recorded usage remain readable. |

The policy requires `grantId` and `deploymentId` (UUIDs), `deploymentDigest` (the published SHA-256), and integer `startsInSeconds` (0–899), `intervalSeconds` (1–899), `maxOccurrences` (1–16), `windowSeconds` (1–900) and `costLimitMicros` (0). The last occurrence must be strictly before the end of the window, and the entire window must fit within the current grant. Each owner can have at most two active schedules. A schedule never extends an invocation grant.

The view includes `id`, `policy`, `status`, `endsAt`, `nextAt`, `last`, and `usage`. Possible schedule states are `active`, `exhausted`, `cancelled`, `revoked`, and `expired`. `last` is null before any occurrence. Otherwise it contains `scheduledFor`, `runId`, `status`, and `usage`. Use the run read endpoint for the recorded result. Schedule usage contains `recordedOccurrences`, `toolCalls`, `rowsRead`, `elapsedMs`, `costMicros`, and `costBasis`. `costMicros` is null before usage is recorded and zero for committed `free_fixture` results. Each due slot creates at most one run. An unknown outcome is never replayed automatically.

## Directed fixture sharing

The sender supplies a known recipient account UUID. The profile provides neither account discovery nor public links. The only eligible Tool is the exact synthetic count fixture with rows A, B, A, C in that order.

| Method and suffix | Request and result |
| --- | --- |
| `POST /deployments/{id}/shares` | Send `recipientAccountId`, `deploymentDigest`, `scope: "review_and_import_fixture"`, integer `ttlSeconds` (1–900), and `acknowledgeRecipientKeepsCopy: true` with an owner-scoped `Idempotency-Key`. Returns the share view. |
| `GET /shares/{id}` | Returns the share view to the sender or the active share to the named recipient. Foreign, expired, or revoked shares return 404 for recipients. |
| `POST /shares/{id}/import` | The named recipient sends the reviewed `toolDigest` with `workspaceId`, `workspaceRevision`, and `agentId` for the destination manifest. Returns a new independent private deployment ID and digest. An identical import while the share remains active returns the same deployment. |
| `POST /shares/{id}/revoke` | The sender stops future review and import. An already imported deployment remains owned by its recipient. |

The view contains `id`, `recipientAccountId`, `scope`, `revocationPolicy` (`future_review_and_import_only`), `toolDigest`, `tool`, `status`, `expiresAt`, and `revokedAt`. It contains the Tool payload only while active. The Tool digest uses the same canonical encoding as the manifest. The share carries no invocation grant. The recipient must create a fresh grant to execute their private deployment, whose runs and usage are private to their own account.
