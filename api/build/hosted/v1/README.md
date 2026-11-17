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
