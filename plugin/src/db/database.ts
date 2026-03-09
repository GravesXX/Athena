import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description: string;
  directory: string | null;
  phase: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  project_id: string | null;
  phase: string;
  created_at: string;
  updated_at: string;
  summary: string | null;
}

export interface Message {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
  is_deleted: number;
}

export interface Decision {
  id: string;
  project_id: string;
  title: string;
  chosen: string;
  alternatives: string;
  reasoning: string;
  created_at: string;
}

export interface Todo {
  id: string;
  project_id: string;
  title: string;
  status: string;
  priority: number;
  created_at: string;
  completed_at: string | null;
}

export interface Achievement {
  id: string;
  project_id: string | null;
  category: string;
  title: string;
  description: string;
  evidence: string;
  tags: string;
  created_at: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  period: string;
  description: string;
  highlights: string;
  recruiter_insights: string;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  filename: string;
  version_label: string | null;
  content: string;
  ingested_at: string;
}

// ── Schema ──────────────────────────────────────────────────────────────────

const SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  directory TEXT,
  phase TEXT NOT NULL DEFAULT 'explore'
    CHECK (phase IN ('explore', 'build', 'harvest', 'completed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  phase TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  summary TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  chosen TEXT NOT NULL,
  alternatives TEXT DEFAULT '[]',
  reasoning TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'done')),
  priority INTEGER NOT NULL DEFAULT 2,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  category TEXT NOT NULL
    CHECK (category IN ('skill', 'achievement', 'challenge', 'reflection')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence TEXT DEFAULT '[]',
  tags TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS experiences (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  period TEXT NOT NULL,
  description TEXT NOT NULL,
  highlights TEXT DEFAULT '[]',
  recruiter_insights TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_decisions_project ON decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_todos_project ON todos(project_id);
CREATE INDEX IF NOT EXISTS idx_achievements_project ON achievements(project_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);

CREATE TABLE IF NOT EXISTS resumes (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  version_label TEXT,
  content TEXT NOT NULL,
  ingested_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

// ── Phase Order ─────────────────────────────────────────────────────────────

const PHASE_ORDER = ['explore', 'build', 'harvest', 'completed'] as const;

// ── AthenaDB Class ──────────────────────────────────────────────────────────

export class AthenaDB {
  private db: Database.Database;

  constructor(dbPath: string) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.exec(SCHEMA);
  }

  close(): void {
    this.db.close();
  }

  listTables(): string[] {
    const rows = this.db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[];
    return rows.map((r) => r.name);
  }

  // ── Projects ────────────────────────────────────────────────────────────

  createProject(name: string, description: string, directory?: string): Project {
    const id = uuidv4();
    this.db
      .prepare(
        'INSERT INTO projects (id, name, description, directory) VALUES (?, ?, ?, ?)'
      )
      .run(id, name, description, directory ?? null);
    return this.getProject(id)!;
  }

  getProject(id: string): Project | undefined {
    return this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as
      | Project
      | undefined;
  }

  getProjectsByPhase(phase: string): Project[] {
    return this.db
      .prepare('SELECT * FROM projects WHERE phase = ?')
      .all(phase) as Project[];
  }

  getAllProjects(): Project[] {
    return this.db.prepare('SELECT * FROM projects').all() as Project[];
  }

  advancePhase(id: string): void {
    const project = this.getProject(id);
    if (!project) return;

    const currentIndex = PHASE_ORDER.indexOf(
      project.phase as (typeof PHASE_ORDER)[number]
    );
    if (currentIndex < 0 || currentIndex >= PHASE_ORDER.length - 1) return;

    const nextPhase = PHASE_ORDER[currentIndex + 1];
    this.db
      .prepare(
        "UPDATE projects SET phase = ?, updated_at = datetime('now') WHERE id = ?"
      )
      .run(nextPhase, id);
  }

  updateProjectDirectory(id: string, directory: string): void {
    this.db
      .prepare(
        "UPDATE projects SET directory = ?, updated_at = datetime('now') WHERE id = ?"
      )
      .run(directory, id);
  }

  // ── Sessions ────────────────────────────────────────────────────────────

  createSession(projectId: string | null, phase: string): Session {
    const id = uuidv4();
    this.db
      .prepare('INSERT INTO sessions (id, project_id, phase) VALUES (?, ?, ?)')
      .run(id, projectId, phase);
    return this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as Session;
  }

  getSessionsForProject(projectId: string): Session[] {
    return this.db
      .prepare('SELECT * FROM sessions WHERE project_id = ? ORDER BY created_at')
      .all(projectId) as Session[];
  }

  getCareerSessions(): Session[] {
    return this.db
      .prepare("SELECT * FROM sessions WHERE project_id IS NULL AND phase = 'career' ORDER BY created_at")
      .all() as Session[];
  }

  updateSessionSummary(id: string, summary: string): void {
    this.db
      .prepare(
        "UPDATE sessions SET summary = ?, updated_at = datetime('now') WHERE id = ?"
      )
      .run(summary, id);
  }

  // ── Messages ────────────────────────────────────────────────────────────

  addMessage(sessionId: string, role: string, content: string): Message {
    const id = uuidv4();
    this.db
      .prepare(
        'INSERT INTO messages (id, session_id, role, content) VALUES (?, ?, ?, ?)'
      )
      .run(id, sessionId, role, content);
    return this.db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as Message;
  }

  getSessionMessages(sessionId: string): Message[] {
    return this.db
      .prepare(
        'SELECT * FROM messages WHERE session_id = ? AND is_deleted = 0 ORDER BY created_at'
      )
      .all(sessionId) as Message[];
  }

  // ── Decisions ───────────────────────────────────────────────────────────

  addDecision(
    projectId: string,
    title: string,
    chosen: string,
    alternatives: unknown[],
    reasoning: string
  ): Decision {
    const id = uuidv4();
    this.db
      .prepare(
        'INSERT INTO decisions (id, project_id, title, chosen, alternatives, reasoning) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(id, projectId, title, chosen, JSON.stringify(alternatives), reasoning);
    return this.db.prepare('SELECT * FROM decisions WHERE id = ?').get(id) as Decision;
  }

  getDecisions(projectId: string): Decision[] {
    return this.db
      .prepare('SELECT * FROM decisions WHERE project_id = ? ORDER BY created_at')
      .all(projectId) as Decision[];
  }

  // ── Todos ───────────────────────────────────────────────────────────────

  addTodo(projectId: string, title: string, priority: number): Todo {
    const id = uuidv4();
    this.db
      .prepare(
        'INSERT INTO todos (id, project_id, title, priority) VALUES (?, ?, ?, ?)'
      )
      .run(id, projectId, title, priority);
    return this.db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as Todo;
  }

  getTodo(id: string): Todo | undefined {
    return this.db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as
      | Todo
      | undefined;
  }

  getTodos(projectId: string): Todo[] {
    return this.db
      .prepare(
        'SELECT * FROM todos WHERE project_id = ? ORDER BY priority, created_at'
      )
      .all(projectId) as Todo[];
  }

  updateTodoStatus(id: string, status: string): void {
    const completedAt = status === 'done' ? new Date().toISOString() : null;
    this.db
      .prepare(
        'UPDATE todos SET status = ?, completed_at = ? WHERE id = ?'
      )
      .run(status, completedAt, id);
  }

  // ── Achievements ────────────────────────────────────────────────────────

  addAchievement(
    projectId: string | null,
    category: string,
    title: string,
    description: string,
    evidence: unknown[],
    tags: string[]
  ): Achievement {
    const id = uuidv4();
    this.db
      .prepare(
        'INSERT INTO achievements (id, project_id, category, title, description, evidence, tags) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        id,
        projectId,
        category,
        title,
        description,
        JSON.stringify(evidence),
        JSON.stringify(tags)
      );
    return this.db
      .prepare('SELECT * FROM achievements WHERE id = ?')
      .get(id) as Achievement;
  }

  getAchievementsByCategory(category: string): Achievement[] {
    return this.db
      .prepare('SELECT * FROM achievements WHERE category = ? ORDER BY created_at')
      .all(category) as Achievement[];
  }

  getAchievementsForProject(projectId: string): Achievement[] {
    return this.db
      .prepare('SELECT * FROM achievements WHERE project_id = ? ORDER BY created_at')
      .all(projectId) as Achievement[];
  }

  getAllAchievements(): Achievement[] {
    return this.db
      .prepare('SELECT * FROM achievements ORDER BY created_at')
      .all() as Achievement[];
  }

  // ── Experiences ─────────────────────────────────────────────────────────

  addExperience(
    company: string,
    role: string,
    period: string,
    description: string,
    highlights: string[],
    recruiterInsights: string[]
  ): Experience {
    const id = uuidv4();
    this.db
      .prepare(
        'INSERT INTO experiences (id, company, role, period, description, highlights, recruiter_insights) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        id,
        company,
        role,
        period,
        description,
        JSON.stringify(highlights),
        JSON.stringify(recruiterInsights)
      );
    return this.db
      .prepare('SELECT * FROM experiences WHERE id = ?')
      .get(id) as Experience;
  }

  getAllExperiences(): Experience[] {
    return this.db
      .prepare('SELECT * FROM experiences ORDER BY created_at')
      .all() as Experience[];
  }

  updateExperienceInsights(id: string, insights: string[]): void {
    this.db
      .prepare(
        "UPDATE experiences SET recruiter_insights = ?, updated_at = datetime('now') WHERE id = ?"
      )
      .run(JSON.stringify(insights), id);
  }

  // ── Stats ───────────────────────────────────────────────────────────────

  getProjectCount(): number {
    const row = this.db
      .prepare('SELECT COUNT(*) as count FROM projects')
      .get() as { count: number };
    return row.count;
  }

  getAchievementCount(): number {
    const row = this.db
      .prepare('SELECT COUNT(*) as count FROM achievements')
      .get() as { count: number };
    return row.count;
  }

  // ── Resumes ──────────────────────────────────────────────────────────

  addResume(filename: string, content: string, versionLabel?: string): Resume {
    const id = uuidv4();
    this.db
      .prepare('INSERT INTO resumes (id, filename, content, version_label) VALUES (?, ?, ?, ?)')
      .run(id, filename, content, versionLabel ?? null);
    return this.db.prepare('SELECT * FROM resumes WHERE id = ?').get(id) as Resume;
  }

  getAllResumes(): Resume[] {
    return this.db.prepare('SELECT * FROM resumes ORDER BY ingested_at').all() as Resume[];
  }

  getResumeCount(): number {
    const row = this.db
      .prepare('SELECT COUNT(*) as count FROM resumes')
      .get() as { count: number };
    return row.count;
  }

  clearResumes(): void {
    this.db.prepare('DELETE FROM resumes').run();
  }
}
