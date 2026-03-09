import { Harvester } from '../career/harvester.js';
import { CareerCoach } from '../career/coach.js';
import { ResumeEngine } from '../career/resume.js';
import { ResumeIntake } from '../career/intake.js';
import { ResumeTailor } from '../career/tailor.js';
import type { PluginAPI } from '../types.js';
import { text } from './helpers.js';

export function registerCareerTools(
  api: PluginAPI,
  harvester: Harvester,
  coach: CareerCoach,
  resume: ResumeEngine,
  intake: ResumeIntake,
  tailor: ResumeTailor
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
    execute: async (_id, params) => {
      const projectId = params.project_id as string;
      if (params.harvest_json) {
        harvester.applyHarvest(projectId, params.harvest_json as string);
        return text({ content: 'Harvest applied to achievement bank.' });
      }
      const prompt = harvester.buildHarvestPrompt(projectId);
      return text({ content: prompt });
    },
  });

  api.registerTool({
    name: 'athena_achievement_list',
    description: 'Query the achievement bank. Optionally filter by category (skill, achievement, challenge, reflection) or project.',
    parameters: {
      category: { type: 'string', description: 'Filter by category', enum: ['skill', 'achievement', 'challenge', 'reflection'] },
      project_id: { type: 'string', description: 'Filter by project ID' },
    },
    execute: async (_id, params) => text(coach.listAchievements({
      category: params.category as string | undefined,
      project_id: params.project_id as string | undefined,
    })),
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
    execute: async (_id, params) => text(coach.addExperience({
      company: params.company as string,
      role: params.role as string,
      period: params.period as string,
      description: params.description as string,
      highlights_json: params.highlights_json as string | undefined,
    })),
  });

  api.registerTool({
    name: 'athena_resume_generate',
    description: 'Generate a resume from your achievement bank and work experiences. Returns a prompt for Claude to produce the resume.',
    parameters: {},
    execute: async (_id, _params) => {
      const prompt = resume.buildGeneratePrompt();
      return text({ content: prompt });
    },
  });

  api.registerTool({
    name: 'athena_resume_review',
    description: 'Review and polish an existing resume against best practices. Compares with your achievement bank for missed opportunities.',
    parameters: {
      resume_text: { type: 'string', description: 'The resume text to review', required: true },
    },
    execute: async (_id, params) => {
      const prompt = resume.buildReviewPrompt(params.resume_text as string);
      return text({ content: prompt });
    },
  });

  // ── Resume Intake Tools ─────────────────────────────────────────────

  api.registerTool({
    name: 'athena_resume_ingest',
    description: 'Read resume files from a path (file or directory), store them, and return all resume contents for analysis. Supports .txt, .md, .pdf files.',
    parameters: {
      path: { type: 'string', description: 'Absolute path to a resume file or directory containing resumes', required: true },
      version_label: { type: 'string', description: 'Label for this resume version, e.g. "SWE March 2025" or "PM Fall 2024"' },
    },
    execute: async (_id, params) => {
      return text(intake.ingest(params.path as string, params.version_label as string | undefined));
    },
  });

  api.registerTool({
    name: 'athena_resume_intake_list',
    description: 'List all ingested resumes with metadata (filename, label, size, date)',
    parameters: {},
    execute: async () => {
      return text({ content: intake.list().content });
    },
  });

  api.registerTool({
    name: 'athena_resume_intake_analyze',
    description: 'Load all ingested resume contents for cross-version analysis. Returns full text of every resume.',
    parameters: {},
    execute: async () => {
      const result = intake.getAllContent();
      if (result.error) return text(result);
      return text({ content: result.content });
    },
  });

  api.registerTool({
    name: 'athena_resume_intake_clear',
    description: 'Clear all ingested resumes from the bank (fresh start)',
    parameters: {},
    execute: async () => {
      return text(intake.clear());
    },
  });

  // ── Resume Tailor Tools ───────────────────────────────────────────────

  api.registerTool({
    name: 'athena_jd_fetch',
    description: 'Fetch a job description from a URL, extract text, and store it. Returns the JD text for analysis.',
    parameters: {
      url: { type: 'string', description: 'URL of the job posting', required: true },
    },
    execute: async (_id, params) => {
      const result = await tailor.fetchJobDescription(params.url as string);
      return text(result);
    },
  });

  api.registerTool({
    name: 'athena_jd_save_analysis',
    description: 'Save a structured analysis of a job description (extracted requirements, skills, seniority level, etc.)',
    parameters: {
      jd_id: { type: 'string', description: 'ID of the job description', required: true },
      analysis: { type: 'string', description: 'Structured analysis of the JD (skills, requirements, seniority, keywords)', required: true },
    },
    execute: async (_id, params) => {
      return text(tailor.saveAnalysis(params.jd_id as string, params.analysis as string));
    },
  });

  api.registerTool({
    name: 'athena_resume_tailor',
    description: 'Generate a tailored resume for a specific job description. Combines JD requirements with achievement bank and work experience.',
    parameters: {
      jd_id: { type: 'string', description: 'ID of the job description to tailor for', required: true },
    },
    execute: async (_id, params) => {
      const prompt = tailor.buildTailorPrompt(params.jd_id as string);
      return text({ content: prompt });
    },
  });

  api.registerTool({
    name: 'athena_resume_ats_check',
    description: 'Check a tailored resume against the job description for ATS keyword match. Returns match rate and missing keywords.',
    parameters: {
      jd_id: { type: 'string', description: 'ID of the job description', required: true },
      resume_text: { type: 'string', description: 'The tailored resume text to check', required: true },
    },
    execute: async (_id, params) => {
      const prompt = tailor.buildAtsCheckPrompt(params.jd_id as string, params.resume_text as string);
      return text({ content: prompt });
    },
  });

  api.registerTool({
    name: 'athena_jd_list',
    description: 'List all fetched job descriptions with analysis status',
    parameters: {},
    execute: async () => {
      return text(tailor.listJobDescriptions());
    },
  });
}
