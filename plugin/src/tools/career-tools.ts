import { Harvester } from '../career/harvester.js';
import { CareerCoach } from '../career/coach.js';
import { ResumeEngine } from '../career/resume.js';
import type { PluginAPI, ToolResult } from '../types.js';

export function registerCareerTools(
  api: PluginAPI,
  harvester: Harvester,
  coach: CareerCoach,
  resume: ResumeEngine
): void {
  api.registerTool({
    name: 'athena_harvest',
    description: 'Extract skills, achievements, challenges, and reflections from a project. Call this when a project reaches the harvest phase.',
    parameters: {
      project_id: { type: 'string', description: 'ID of the project to harvest', required: true },
      harvest_json: {
        type: 'string',
        description: 'JSON string with harvest results (from Claude analysis). If not provided, returns a prompt to generate harvest data.',
      },
    },
    run: async (params): Promise<ToolResult> => {
      const projectId = params.project_id as string;
      if (params.harvest_json) {
        harvester.applyHarvest(projectId, params.harvest_json as string);
        return { content: 'Harvest applied to achievement bank.' };
      }
      const prompt = harvester.buildHarvestPrompt(projectId);
      return { content: prompt };
    },
  });

  api.registerTool({
    name: 'athena_achievement_list',
    description: 'Query the achievement bank. Optionally filter by category (skill, achievement, challenge, reflection) or project.',
    parameters: {
      category: { type: 'string', description: 'Filter by category', enum: ['skill', 'achievement', 'challenge', 'reflection'] },
      project_id: { type: 'string', description: 'Filter by project ID' },
    },
    run: async (params) => coach.listAchievements({
      category: params.category as string | undefined,
      project_id: params.project_id as string | undefined,
    }),
  });

  api.registerTool({
    name: 'athena_experience_add',
    description: 'Add a past work experience (company, role, period, description, highlights)',
    parameters: {
      company: { type: 'string', description: 'Company name', required: true },
      role: { type: 'string', description: 'Job title', required: true },
      period: { type: 'string', description: 'Time period, e.g. "2023-01 to 2024-06"', required: true },
      description: { type: 'string', description: 'What you did there', required: true },
      highlights_json: { type: 'string', description: 'JSON array of key accomplishments' },
    },
    run: async (params) => coach.addExperience({
      company: params.company as string,
      role: params.role as string,
      period: params.period as string,
      description: params.description as string,
      highlights_json: params.highlights_json as string | undefined,
    }),
  });

  api.registerTool({
    name: 'athena_resume_generate',
    description: 'Generate a resume from your achievement bank and work experiences. Returns a prompt for Claude to produce the resume.',
    parameters: {},
    run: async (): Promise<ToolResult> => {
      const prompt = resume.buildGeneratePrompt();
      return { content: prompt };
    },
  });

  api.registerTool({
    name: 'athena_resume_review',
    description: 'Review and polish an existing resume against best practices. Compares with your achievement bank for missed opportunities.',
    parameters: {
      resume_text: { type: 'string', description: 'The resume text to review', required: true },
    },
    run: async (params): Promise<ToolResult> => {
      const prompt = resume.buildReviewPrompt(params.resume_text as string);
      return { content: prompt };
    },
  });
}
