# Athena

A strategic career engineer agent built on [OpenClaw](https://openclaw.ai).

Athena helps you think through engineering projects, execute them, extract career value from your work, and craft a resume that actually represents what you've built. She connects to your real codebases for grounding and accumulates achievements across all your projects.

## Two Layers

### Project Lifecycle
Every project moves through four phases:

| Phase | What Athena Does |
|-------|------------------|
| **EXPLORE** | Discuss approaches, evaluate trade-offs, record key decisions |
| **BUILD** | Create tasks, track progress, scan your codebase for context |
| **HARVEST** | Extract skills, achievements, challenges, reflections |
| **COMPLETED** | Archived. Data feeds into your career profile. |

### Career (always available)
- Add past work experiences
- Query your achievement bank across all projects
- Generate resumes from real data
- Review and polish resumes against best practices

## Requirements

- [OpenClaw](https://openclaw.ai) installed and configured
- Node.js >= 22

## Installation

```bash
git clone <this-repo> ~/Desktop/athena
cd ~/Desktop/athena
bash install.sh
```

Then add to your OpenClaw config (`~/.openclaw/openclaw.json`):

```json
{
  "plugins": {
    "load": {
      "paths": ["/path/to/athena/plugin/src/index.ts"]
    },
    "allow": ["athena"],
    "entries": {
      "athena": { "enabled": true }
    }
  }
}
```

## Slash Commands

| Command | What it does |
|---------|-------------|
| `/project new <name>` | Start tracking a new project |
| `/project list` | Show all projects by phase |
| `/project open <query>` | Switch to a project |
| `/project advance` | Move project to next phase |
| `/project scan` | Scan linked directory for context |
| `/harvest` | Extract achievements from current project |
| `/resume generate` | Generate a resume from your data |
| `/resume review` | Review an existing resume |

## Tools (14)

| Tool | Purpose |
|------|---------|
| `athena_project_create` | Create a new project |
| `athena_project_list` | List projects by phase |
| `athena_project_open` | Open a project by name |
| `athena_project_advance` | Advance project phase |
| `athena_project_scan` | Scan linked directory |
| `athena_decision_record` | Record a decision with alternatives |
| `athena_todo_add` | Add a task |
| `athena_todo_update` | Update task status |
| `athena_todo_list` | List tasks with progress |
| `athena_harvest` | Extract achievements from a project |
| `athena_achievement_list` | Query the achievement bank |
| `athena_experience_add` | Add a past work experience |
| `athena_resume_generate` | Generate resume from real data |
| `athena_resume_review` | Review resume against best practices |

## Project Structure

```
athena/
├── install.sh
├── README.md
├── workspace/
│   ├── SOUL.md                 # Strategic career engineer persona
│   ├── AGENTS.md               # Operating instructions + tool usage
│   ├── IDENTITY.md             # Name and tagline
│   ├── USER.md                 # User customization
│   └── RESUME_KNOWLEDGE.md     # Resume best practices knowledge base
├── plugin/
│   ├── openclaw.plugin.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── db/
│   │   │   ├── schema.sql
│   │   │   ├── database.ts      # AthenaDB class
│   │   │   └── __tests__/
│   │   ├── projects/
│   │   │   ├── manager.ts       # Project lifecycle + scanning
│   │   │   └── __tests__/
│   │   ├── career/
│   │   │   ├── harvester.ts     # Achievement extraction
│   │   │   ├── coach.ts         # Experience analysis
│   │   │   ├── resume.ts        # Resume generation + review
│   │   │   └── __tests__/
│   │   └── tools/
│   │       ├── register.ts      # Registers all 14 tools
│   │       ├── project-tools.ts
│   │       ├── build-tools.ts
│   │       ├── career-tools.ts
│   │       └── __tests__/
│   └── skills/
│       ├── project/SKILL.md
│       ├── harvest/SKILL.md
│       └── resume/SKILL.md
└── docs/
    └── plans/
```

## Development

```bash
cd plugin
npm install
npm test              # run all tests
npm run test:watch    # watch mode
npm run build         # compile TypeScript
```

## Data Privacy

All data stored locally in `~/.athena/athena.db`. Nothing leaves your machine except API calls to Claude.
