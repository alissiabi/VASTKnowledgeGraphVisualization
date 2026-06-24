# Project Documentation

This folder contains the documentation prepared for the Visual Analytics course project based on the VAST 2025 Design Challenge and the official MC1 music knowledge graph.

The documentation is organized as a compact knowledge base for the prototype: design idea, interaction model, frontend organization, view catalogue, and final report.

## Documents

- **[design_brief.md](design_brief.md)** - project frame, target user, dataset role, visual rationale, and analytical workflow.
- **[interaction_model.md](interaction_model.md)** - shared state, filter behaviour, selection logic, and evidence flow.
- **[frontend_notes.md](frontend_notes.md)** - frontend structure, data flow, performance choices, and implementation conventions.
- **[view_catalogue.md](view_catalogue.md)** - catalogue of dashboard views and the role of each card.
- **[meeting_1_notes.md](meeting_1_notes.md)** - initial course notes used to derive the dashboard requirements.
- **[report.pdf](report.pdf)** - final submission report.

## Stack

| Area | Tech |
| --- | --- |
| Frontend | Vue 3, Vite, Vue Router, Tailwind CSS, D3 |
| Data | Official VAST 2025 MC1 knowledge graph served as frontend JSON |
| Validation | Node test runner, ESLint/Oxlint, production Vite build |

## Main Workflow

The dashboard supports a traceable overview-to-detail path:

1. inspect global graph summaries and active filters;
2. read relationship volumes in the edge overview;
3. inspect the induced node-link diagram under the current filters;
4. select an entity and analyze its ego network in the original graph context;
5. verify links, paths, temporal signals, and evidence records.
