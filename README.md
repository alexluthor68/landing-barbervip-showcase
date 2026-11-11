Markdown
# BarberVip: AI-Driven Barber Shop Platform & Automated Scheduling

An end-to-end web application and AI-driven automation ecosystem designed for modern barber shop management. The platform features an interactive frontend for booking services in real-time, backed by an autonomous AI receptionist agent (`Agente Recepcionista BarberVip`) integrated via webhooks, n8n workflows, and backend databases.

---

## 🚀 Key Features

* **Interactive Booking Landing Page:** Built under `web-app/`, enabling customers to browse services (haircuts, beard trimming), view real-time availability badges, and select service slots.
* **AI Receptionist Integration:** Integrated with n8n and LLM agents to process incoming leads, confirm appointments, and send automated notifications via messaging webhooks (Evolution API).
* **Spec-Driven Architecture:** Managed using strict specification-driven development rules (`ai-specs/`, `docs/`) for AI coding agents (Claude, Cursor, Codex).
* **Data Processing & Synchronization:** Real-time state updates across local JSON models/databases and external scheduling tools (Google Calendar/Sheets).

---

## 🛠 Tech Stack

* **Frontend:** JavaScript (ES6+), HTML5, CSS3 / Custom Component Styling.
* **Backend & Automation:** Node.js, Python scripts, RESTful Webhooks, n8n Orchestrator.
* **AI & Multi-Copilot Support:** Claude Code, Cursor, OpenSpec, LLM-based function calling.
* **DevOps & Standards:** Git/GitHub, Docker, Specboot Harness.

---

## 📁 Repository Structure

```text
.
├── web-app/             # Core application frontend & client-side booking logic
├── ai-specs/            # Domain specifications, agent skills, and prompt rules
├── docs/                # API specifications, backend standards, and data models
├── .claude / .cursor    # IDE and AI coding agent configurations
├── AGENTS.md            # Multi-agent rules for autonomous coding pipelines
└── README.md            # Project documentation

⚙️ Development Methodology: Specboot & Spec-Driven Development
This repository leverages Specboot (Augmented Spec-Driven Development), an advanced framework that enables multiple AI coding copilots (Claude, Cursor, Copilot) to work against a single source of truth defined in specifications.

Documentation & Standards: Core rules are maintained in docs/backend-standards.md and docs/api-spec.yml.

Multi-Agent Alignment: Agent rules in AGENTS.md and CLAUDE.md enforce consistent code quality, unit testing, and architectural integrity during AI-assisted development.

💻 Local Setup & Execution
Clone the repository:

Bash
git clone [https://github.com/shiverserk/landing-barbervip-showcase.git](https://github.com/shiverserk/landing-barbervip-showcase.git)
cd landing-barbervip-showcase
Run the Web Application:
Open web-app/index.html via Live Server or launch the local HTTP server.

Configure AI Agents:
Ensure environment variables for n8n webhooks and AI model APIs are configured in your local environment.

Ensure environment variables for n8n webhooks and AI model APIs are configured in your local environment.
