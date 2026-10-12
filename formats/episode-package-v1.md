# Episode Package v1

Preset behavior and package loading have been confirmed by the ML owner and independently rechecked by VOLK-Dev.

## Identity and discovery

A package declares `schemaVersion: "volk.episode-package.v1"`, a stable `id`, semantic `contentVersion`, ordering, localized title/summary keys, playground/adapter references, required capability versions, and package-relative paths to learning, agent, director, and locale JSON. Its semantic identity includes `id`, `contentVersion`, and a deterministic content fingerprint.

The current contract describes build-time recursive discovery of `manifest.json`. It does not promise runtime scanning of a learner's disk or hot installation. A new package is available after it is included in the source tree and the application is rebuilt, unless ML confirms another supported path.

Package paths are normalized relative JSON paths. Absolute paths, URL schemes, query/fragment suffixes, empty segments, and `.`/`..` traversal are rejected. English and Chinese package-scoped locales are required. Invalid packages should be isolated with a useful diagnostic; they must not silently replace another package.

## Learning graph and truth boundary

Learning content is finite JSON: a registered initial scenario, start node, bounded limits, typed nodes, registered actions, explicit-priority transitions, learner choices, and local fallbacks. Conditions may use only the registered fact predicates; package-provided code or arbitrary expressions are not part of the format. Loops require finite budgets. Ambiguous transitions and missing references are validation failures.

An action that changes World, Data, Experiment, model state, or execution requires the prescribed learner confirmation. Dispatch alone does not complete a learning step; the authoritative success fact must be observed in the current session/context. Evidence comes from the deterministic runtime detector. Narration, Agent output, clicks, and Director timing are not evidence and do not establish understanding or mastery.

### Public scenario preset capability

Episode Package v1 publicly supports exactly one scenario preset identifier in this candidate: `sampling-variability-world`, source version `1`. The package wire shape remains `initialScenario: { kind: "preset", id: "sampling-variability-world", seed: <integer> }`; the source version is a registry contract version and does not add a `version` property to package JSON. The same generic experiment starting point may be used by a formal episode and an original third-party package. This does not expose formal episode content or implementation internals.

This contract was verified against the VOLK-ML main build accepted on 2026-10-12. Its package metadata reports `0.1.0`, but that value does not uniquely identify compatible builds and must not be used as a minimum supported release. There is no released application semver floor or runtime version gate. A compatible successor must preserve the published contract. This build initializes `data-lab` with the `linear-regression` adapter and a generated linear World (`y = 1.5x + 0.5`, additive Gaussian noise amount `0.8`), with 12 train and 12 test samples drawn from uniform input `[-2, 2]` and zero outliers. The initial Data comes from that generated World, not an external dataset. Model state starts with weight `0`, bias equal to mean training `y`, learning rate `0.05`, 20 training steps, residual/best-fit display off, and no fit has run. The sample package seed is `8201`; package-authored seeds are integers in `[0, 4294967295]` and replace the preset's `seedSource: "entrance"` seed at initial World regeneration. The identifier's published model, generation process, and initialization meaning are compatibility commitments; incompatible changes require a new explicit contract/identifier and migration guidance, and existing packages must not be silently reinterpreted. No unverified cross-backend bitwise numeric equality is promised.

The R2 package validator rejects private registered preset IDs from third-party learning and Director scenarios. The internal Director preset remains usable by the source-scoped first-party Episode 1 package only.

This package format does not accept arbitrary initial-scenario recipes. A third-party package can create different learning content by composing the currently documented public capabilities; a new model, generator, operation, detector, or preset is a runtime feature requiring a separate design and acceptance.

## Agent guidance and optional Cloud context

Agent guidance is structured package content: prompts, allowed context selectors, bounded candidate IDs, hint budget/cooldown, fallback, and silence behavior. It does not carry private Cloud policy or secrets. Cloud remains optional; local fallback stays available.

The candidate schemas under `schemas/` describe the complete legacy LUMI v0 request/response, health response, error envelope, and the experimental additive `learningContext` / `candidateId` mode. The contextual mode is experimental and is not on current Cloud `main`. For contextual responses, the ML client must independently reject stale package/node/request results before projection; Cloud validates fingerprint syntax but cannot infer that the client's package state is still current.

## Director scripts

Director content is finite JSON that references the existing Visualization Script format and registered primitives/actions. The production loader and validator remain authoritative. A Director demo uses an isolated demonstration session and explicit replay/simulation provenance; it cannot mutate a learner's learning session or create Evidence. The example package does not embed executable JavaScript or Python.

## Schemas

The accompanying JSON Schemas describe static structure for package manifests, graph content, guidance, locales, Director declarations, registries, and the optional experimental Cloud context/response fields. They are not a complete validator for nested Visualization Script operations, runtime capability availability, or execution semantics. The application loader performs those checks; a schema-valid package is not automatically accepted or installed.
