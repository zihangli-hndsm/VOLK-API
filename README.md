# VOLK-API

Versioned public contracts and examples for the VOLK Open Client boundary.

## Scope

- `api/` documents health, legacy LUMI HTTP v0, and the isolated Hosted Build protocols.
- `formats/` defines the Episode Package v1 format and machine-readable schemas.
- `examples/` contains an original learning package and HTTP request examples.
- `compatibility.md` records verified runtime compatibility and experimental boundaries.
- `contributing.md` describes the current package-content constraints.

The API documentation excludes account, billing, quota, administrative, and general test-harness endpoints. The Hosted Build profiles document their isolated synthetic protocols. Package-aware LUMI context remains experimental and is not implemented on Cloud `main` as of 2026-10-12.

## Start here

- [Open Client HTTP API](api/README.md)
- [Private Hosted Build v1](api/build/hosted/v1/README.md)
- [Private Hosted Build v2](api/build/hosted/v2/README.md)
- [Episode Package v1](formats/episode-package-v1.md)
- [Build Workspace v1 metadata](formats/build/v1/README.md)
- [JSON Schema notes](formats/schemas/README.md)
- [Examples](examples/README.md)
- [Compatibility](compatibility.md)
- [Contributing](contributing.md)

## License

The MIT grant is limited to the files listed in [LICENSE-SCOPE.md](LICENSE-SCOPE.md). It does not cover private application code, formal Episodes, or LUMI media.
