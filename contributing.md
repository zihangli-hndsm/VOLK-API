# Contributing

Third-party Episodes should be strict JSON packages using a supported `volk.episode-package.v1` schema. Include package-scoped English and Chinese text, stay within the package root for every resource, and reference only registered capabilities and actions. Do not embed JavaScript, Python, dynamic module paths, DOM selectors, provider commands, or secrets.

The package may provide pedagogical content and presentation declarations. It cannot author Evidence, declare learner mastery, alter execution authority, or bypass learner confirmation. The runtime validates the package and remains responsible for execution and deterministic Evidence.

Packages are currently discovered from build inputs; runtime hot installation and user uploads are not supported by the documented contract.

## Submit a contribution

Use an issue in [VOLK-API](https://github.com/zihangli-hndsm/VOLK-API/issues) to propose a documentation correction or teaching package. For package proposals, include the package ID/content version, required public capabilities, learning goals, the six JSON files following the example layout, and an authorship/third-party-source statement. Do not include learner data, credentials, private course material, or assets you cannot authorize for distribution.

Documentation and example changes can be submitted as pull requests to this repository. Publication and inclusion in the application are separate decisions: maintainers review a package and validate it against the private application runtime before deciding whether to include it in a future build. Contributors do not need access to the application source. Opening an issue or merging a documentation PR does not install an Episode in the running website.

The published schemas check only the documented static structure. Passing schema validation is not complete runtime acceptance, especially for nested Director operations and visualization primitives. Use the working example as a starting point; request maintainer review for unsupported or undocumented capabilities rather than assuming arbitrary operations are supported.
