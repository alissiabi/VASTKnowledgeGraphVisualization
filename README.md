# VAST Knowledge Graph Visualization

Course project developed for **Visual Analytics** in response to the **VAST Challenge 2025 - Design Challenge**.

> Challenge page: https://vast-challenge.github.io/2025/DC.html

## Overview

This repository is intended to host the research, design material, prototypes, and documentation produced for the 2025 VAST Design Challenge. The challenge asks participants to conceive a **visual analytics design for knowledge graphs** that helps non-expert users:

- discover new information or relationships,
- identify anomalies or inconsistencies, and/or
- infer missing information from context.

Knowledge graphs combine graph structure with rich, heterogeneous node and edge attributes. This creates important visualization challenges related to scale, uncertainty, incomplete information, and interpretability. Our project explores how visual analytics can support these tasks through an accessible and well-justified design.

## Project Goals

The main goals of this project are to:

1. study the VAST 2025 Design Challenge requirements;
2. investigate visual encodings and interaction techniques for knowledge-graph exploration;
3. design a visual analytics solution that supports the challenge tasks;
4. document the design rationale, limitations, and intended user workflow;
5. prepare a coherent final prototype and documentation package.

## Challenge Context

According to the challenge brief, the final submission should focus on a **design**, not necessarily a fully working prototype. However, within the class we will explore factual implementations using Vue.js and D3.js to have a final tool that can be used to demonstrate the design.

Any suitable knowledge-graph-like dataset may be used to motivate or illustrate the design. The emphasis is on visual analytics thinking and design interactivity capable of supporting multiple domain scenarios.

## Repository Status

The repository now contains a working Vue/D3 prototype, project documentation, and design rationale. The implemented dashboard uses the official VAST 2025 MC1 knowledge graph as the concrete case study for the Design Challenge.


## Working Approach

The project workflow is:

1. **Interpret the challenge**
   - identify the analytical tasks the project should support;
   - define the target user and usage scenario.

2. **Explore design alternatives**
   - compare different visual representations for large, attributed, uncertain graphs;
   - evaluate trade-offs between overview, detail, explainability, and interaction complexity.

3. **Develop and refine the concept**
   - create sketches, wireframes, or interactive mockups;
   - gather feedback during class reviews;
   - refine the design rationale and task support.

4. **Prepare final deliverables**
   - write the final design description;
   - document limitations and assumptions;
   - assemble supporting visuals, storyboard, and reflection material.

## Collaboration Guidelines

To keep the project organized, the repository follows these practices:

- create focused branches for substantial changes;
- use clear commit messages;
- document design decisions in markdown files under `docs/`;
- store figures and interface mockups in `assets/`.


## Team

This project is developed for the **Course on Visual Analytics** by Alissia Biliotti.

## References

- VAST Challenge 2025 - Design Challenge: https://vast-challenge.github.io/2025/DC.html
- IEEE VIS / VAST community resources on visual analytics, graph visualization, and knowledge graphs

