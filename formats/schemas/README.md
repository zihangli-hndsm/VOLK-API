# Episode Package v1 contract notes

These schemas are a draft machine-readable description of Episode Package v1. They validate static JSON shape; the VOLK-ML package loader remains authoritative for current registry membership, graph reachability, predicate ambiguity, cycles, action dispatch, and the existing Visualization Script validator.

## Identity and discovery

- A package is identified by `id` plus semantic `contentVersion` plus a deterministic SHA-256 content fingerprint.
- The fingerprint input is the UTF-8 canonical JSON representation of each declared package file, with object keys sorted recursively, files sorted by normalized package-relative path, and paths encoded alongside their canonical content. Include the manifest and every referenced learning, agent, director, and locale file. Do not include build outputs, runtime state, timestamps, or absolute paths.
- Discovery is build-time recursive discovery of `manifest.json`; runtime filesystem scanning and hot installation are not implied.
- Catalog order is ascending numeric `order`, then ascending stable `id` using ordinal comparison. Duplicate IDs are fatal to the build catalog; a runtime-invalid package is isolated and cannot hide another package or crash the catalog.
- Package paths are forward-slash, relative `.json` paths. Absolute paths, drive prefixes, URL schemes, query/fragment suffixes, empty segments, and any `.` or `..` segment are invalid.

## Predicate and action authority

`learning.schema.json` permits only the finite fact predicate IDs in `registries.json`; the registry defines exact value types and authoritative sources. Predicates are JSON data using only `all`, `any`, `not`, or a registered `fact` plus a literal `equals`. No property traversal, executable expression, implicit string shorthand, or package-defined predicate is accepted. A fact is a runtime observation, not a mastery claim. Neither narration, agent output, director time, nor a button click may satisfy a learning predicate.

Every graph transition has an explicit integer priority. For one state snapshot, the runtime evaluates priorities deterministically; two matching transitions at the same priority are an error and must leave the cursor unchanged. Cycles require finite `maxTraversals` on each back edge and are also bounded by global transition/node-visit budgets. Static validation must reject missing targets, unreachable nodes, unbounded cycles, and flows without a reachable `end` or explicit learner exit.

An action names a currently registered capability and operation. Any action that changes World, Data, Experiment, model/training/evaluation configuration, or execution requires the prescribed learner confirmation. Successful dispatch alone is not completion: the registered success fact must be observed before advancing. Failure retains the current node and semantic state.

Facts must be fresh for the current package/session/context and correlated with the action request that is expected to produce them. A previously true fact, stale provider/runtime response, or result from another node/session cannot advance the current cursor. Reset, package replacement, and context switch invalidate in-flight results. Every cycle is explicitly bounded by a finite edge/choice traversal budget and by the global limits.

## Optional Cloud context

`cloud-learning-context.schema.json` defines the experimental optional `learningContext` request field on `/v0/lumi/respond`; it is an extension fragment, not the complete request schema. `lumi-request-v0.schema.json` describes the legacy request on Cloud `main`. The context sends package identity, current node identity, and up to eight typed semantic candidates; it does not send course source, the full graph, raw learner data, or arbitrary local operation names. Existing requests without this field keep their v0 behavior. Since older strict servers may reject unknown fields, the client must use its existing local fallback after that rejection and must not retry without the constraints.

The context schema validates each candidate's shape, but JSON Schema `uniqueItems` cannot reject duplicate `candidateId` values when the remaining object fields differ. The experimental Cloud runtime performs this additional uniqueness check. The ML client still owns current package/node/request freshness checks.

`lumi-response-v0.schema.json` is the complete legacy response shape; `lumi-response-v0-contextual.schema.json` is the complete experimental response shape, and `lumi-error-response-v0.schema.json` describes its JSON error envelope. The response `candidateId` binds a contextual answer to one candidate from that exact request. For contextual requests, non-silent responses must match that candidate's action, payload, and confirmation semantics exactly; candidate membership is checked by Cloud and the ML client independently checks current package fingerprint, node identity, and request freshness before projection. Cloud does not grant execution authority. Operations not safely expressible by an existing finite LUMI action/payload—especially direct RUN, RESAMPLE_WORLD, and SET_COMPARE—remain local-only; do not invent a command or reinterpret a suggestion as execution.

## Director boundary

`director.schema.json` carries the existing Visualization Script v1 declaration inside a package-owned director envelope. Package loading must run the production `validateScript()` and adapter registry rather than treating this mirror schema as execution authorization. The director scheduler may sequence/wait on registered semantic facts, but scripts remain finite JSON; no JS, Python, DOM selector, provider command, or arbitrary event completion is allowed. Demonstrations use a distinct session and explicit replay/simulation provenance; learning sessions are never their target.

## Locales

Locale files are package-scoped message-key maps. Each package must provide both `zh` and `en`. The package validator resolves every referenced title, body, prompt, fallback, choice, narration, and manifest key in both maps and rejects missing or blank entries. New packages must not require additions to the global locale module.

## Episode Package v2 proposal

- [Manifest v2](manifest-v2.schema.json)
- [Locale map v2](locale-v2.schema.json)

The v2 schema is a proposed additive contract; runtime support is pending VOLK-ML implementation and VOLK-Dev acceptance.
