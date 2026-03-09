import path from 'path';
import os from 'os';
import { AthenaDB } from '../db/database.js';
import { ProjectManager } from '../projects/manager.js';
import { BuildTools } from './build-tools.js';
import { Harvester } from '../career/harvester.js';
import { CareerCoach } from '../career/coach.js';
import { ResumeEngine } from '../career/resume.js';
import { registerProjectTools } from './project-tools.js';
import { registerCareerTools } from './career-tools.js';
import { text } from './helpers.js';
import type { PluginAPI } from '../types.js';

export function registerAllTools(api: PluginAPI): void {
  const dbPath = path.join(os.homedir(), '.athena', 'athena.db');
  const db = new AthenaDB(dbPath);

  const manager = new ProjectManager(db);
  const buildTools = new BuildTools(db);
  const harvester = new Harvester(db);
  const coach = new CareerCoach(db);
  const resume = new ResumeEngine(db);

  // ── Project Tools (5) ───────────────────────────────────────────────
  registerProjectTools(api, manager);

  // ── Build Tools (4) ─────────────────────────────────────────────────

  api.registerTool({
    name: 'athena_decision_record',
    description: 'Record a key decision with the chosen approach, alternatives considered, and reasoning',
    parameters: {
      project_id: { type: 'string', description: 'ID of the project', required: true },
      title: { type: 'string', description: 'What was decided', required: true },
      chosen: { type: 'string', description: 'The chosen approach', required: true },
      alternatives_json: { type: 'string', description: 'JSON array of {name, tradeoff} objects for alternatives' },
      reasoning: { type: 'string', description: 'Why this choice was made', required: true },
    },
    execute: async (_id, params) => text(buildTools.recordDecision({
      project_id: params.project_id as string,
      title: params.title as string,
      chosen: params.chosen as string,
      alternatives_json: (params.alternatives_json as string) || '[]',
      reasoning: params.reasoning as string,
    })),
  });

  api.registerTool({
    name: 'athena_todo_add',
    description: 'Add a todo item to a project',
    parameters: {
      project_id: { type: 'string', description: 'ID of the project', required: true },
      title: { type: 'string', description: 'Task description', required: true },
      priority: { type: 'string', description: 'Priority: 1 (high), 2 (medium), 3 (low). Default: 2' },
    },
    execute: async (_id, params) => text(buildTools.addTodo({
      project_id: params.project_id as string,
      title: params.title as string,
      priority: params.priority as string | undefined,
    })),
  });

  api.registerTool({
    name: 'athena_todo_update',
    description: 'Update the status of a todo item',
    parameters: {
      todo_id: { type: 'string', description: 'ID of the todo', required: true },
      status: { type: 'string', description: 'New status', required: true, enum: ['pending', 'in_progress', 'done'] },
    },
    execute: async (_id, params) => text(buildTools.updateTodo({
      todo_id: params.todo_id as string,
      status: params.status as string,
    })),
  });

  api.registerTool({
    name: 'athena_todo_list',
    description: 'List all todos for a project with progress summary',
    parameters: {
      project_id: { type: 'string', description: 'ID of the project', required: true },
    },
    execute: async (_id, params) => text(buildTools.listTodos({ project_id: params.project_id as string })),
  });

  // ── Career Tools (5) ────────────────────────────────────────────────
  registerCareerTools(api, harvester, coach, resume);
}
