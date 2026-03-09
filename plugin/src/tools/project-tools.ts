import { ProjectManager } from '../projects/manager.js';
import type { PluginAPI } from '../types.js';
import { text } from './helpers.js';

export function registerProjectTools(api: PluginAPI, manager: ProjectManager): void {
  api.registerTool({
    name: 'athena_project_create',
    description: 'Create a new project to track. Optionally link to a local directory for code scanning.',
    parameters: {
      name: { type: 'string', description: 'Project name', required: true },
      description: { type: 'string', description: 'What this project is about', required: true },
      directory: { type: 'string', description: 'Absolute path to the project directory (optional)' },
    },
    execute: async (_id, params) => text(manager.create({
      name: params.name as string,
      description: params.description as string,
      directory: params.directory as string | undefined,
    })),
  });

  api.registerTool({
    name: 'athena_project_list',
    description: 'List all projects grouped by phase (explore, build, harvest, completed)',
    parameters: {},
    execute: async (_id, _params) => text(manager.list()),
  });

  api.registerTool({
    name: 'athena_project_open',
    description: 'Open a project by searching for it by name',
    parameters: {
      query: { type: 'string', description: 'Search query to find the project by name', required: true },
    },
    execute: async (_id, params) => text(manager.open({ query: params.query as string })),
  });

  api.registerTool({
    name: 'athena_project_advance',
    description: 'Advance a project to the next phase (explore → build → harvest → completed)',
    parameters: {
      project_id: { type: 'string', description: 'ID of the project to advance', required: true },
    },
    execute: async (_id, params) => text(manager.advance({ project_id: params.project_id as string })),
  });

  api.registerTool({
    name: 'athena_project_scan',
    description: "Scan a project's linked directory for README, dependencies, git history, and file structure",
    parameters: {
      project_id: { type: 'string', description: 'ID of the project to scan', required: true },
    },
    execute: async (_id, params) => text(manager.scan({ project_id: params.project_id as string })),
  });
}
