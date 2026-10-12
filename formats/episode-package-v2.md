# Episode Package v2 — proposed multilingual content contract

**Runtime status: pending VOLK-ML implementation and independent acceptance.** This page describes the proposed additive v2 package contract. It does not claim that the current public VOLK-ML runtime loads v2 packages. Until that implementation passes VOLK-Dev acceptance, Episode Package v1 remains the only accepted runtime format.

## Compatibility with v1

Episode Package v1 remains unchanged: its strict English/Chinese locale shape, loader behavior, and package fingerprint are preserved. A v1 package cannot add French to its existing locale object and still be treated as compatible. A package that uses the v2 locale map declares `schemaVersion: "volk.episode-package.v2"`.

The learning, agent, director, and visualization subfile formats keep their currently supported versions. The v2 manifest does not upgrade execution semantics or grant new runtime capabilities.

## Manifest and locale map

A v2 manifest adds `defaultLocale: "en"`. `files.locales` maps each declared locale tag to a package-relative JSON file:

```json
{
  "schemaVersion": "volk.episode-package.v2",
  "defaultLocale": "en",
  "files": {
    "learning": "learning.json",
    "agent": "agent.json",
    "director": "director.json",
    "locales": {
      "en": "locales/en.json",
      "fr": "locales/fr.json"
    }
  }
}
```

English is required and complete. Other registered locale files may be partial. Locale codes are resolved against the runtime locale registry; package paths remain normalized, relative, unique, and contained within the package. Undeclared files are ignored. The JSON Schemas describe static shape; the runtime loader remains responsible for registry membership, referenced message keys, package path safety, size limits, placeholder compatibility, and Director operation semantics.

See [the v2 manifest schema](schemas/manifest-v2.schema.json) and [locale map schema](schemas/locale-v2.schema.json).

## Package identity

The v2 fingerprint covers the manifest, learning, agent, director, and every locale file declared in `files.locales`. The runtime canonicalizes JSON object keys and sorts declared normalized paths before hashing. Undeclared locale files do not affect package identity. A change to any declared translation changes the content fingerprint and should increment `contentVersion`; a display-language change does not.

## One language per lesson

The interface may keep its existing primary/secondary parallel display. Each lesson session selects exactly one `lessonLocale` from the user's primary language and the package's complete locale set. If the selected language is incomplete, the runtime warns before entry and uses the package's `defaultLocale` for the entire lesson. It does not mix partial French and English lesson turns.

Changing the outer interface language does not change the lesson language, submit an Ask draft, reset learner progress, or alter World, Data, model state, or Evidence. An explicit lesson-language switch preserves that semantic state and invalidates pending guidance from the previous language. Late responses cannot appear in the new lesson language. Cloud remains optional; the package locale directory is not sent as context, and this contract adds no locale field to the existing Cloud v0 API.

## Original en/fr example

[Same World, Two Samples](../examples/episode/same-world-two-draws/manifest.json) is a new six-file package example with English and French locales and no Chinese locale. It demonstrates a learner-approved resample branch, local fallback copy, Ask prompt copy, and single-language Director narration. It contains no executable code, formal course content, or runtime implementation.

This example documents the proposed data format only. Its presence does not mean an application build accepts or installs Episode Package v2.
