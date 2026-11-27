# CampusOne agent instructions

Read [STATUS](docs/STATUS.md) and the active phase in [ROADMAP](docs/ROADMAP.md) before editing. Inspect the working tree and read the relevant specs. [PRODUCT](docs/PRODUCT.md) owns scope and acceptance, [DESIGN](docs/DESIGN.md) owns presentation and interaction, and [ARCHITECTURE](docs/ARCHITECTURE.md) owns technical contracts.

- Work only on the assigned milestone. Stop at its checkpoint and record the next assignment in STATUS.
- Preserve user changes and approved designs. Coordinate ownership before touching overlapping files. Leave destructive Git operations to explicit authorization.
- Reuse existing components and utilities. Prefer targeted edits and avoid unrelated refactors or repetition of completed work.
- Verify touched behavior after changes and run broader checks at milestone boundaries. Rerun unchanged checks only when there is a reason.
- Update STATUS with material decisions, limitations, and checks actually run. Update [ATTRIBUTION](docs/ATTRIBUTION.md) when using AI, libraries, assets, or external references.
- Label assumptions and simulations. Report research, testing, and verification only when performed. Keep handoffs concise and link to source documents.
- Store visual verification screenshots in `docs/screenshots/phase-XX/`. Keep representative mobile and desktop states in the repository and avoid duplicate captures.
