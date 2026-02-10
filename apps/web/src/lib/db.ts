import Database from "better-sqlite3";
import path from "path";

// Singleton database instance — same DB file as better-auth
const DB_PATH = path.resolve(process.cwd(), "sqlite.db");

let _db: ReturnType<typeof Database> | null = null;

export function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    ensurePlatformsTable(_db);
    ensureDocumentsTable(_db);
  }
  return _db;
}

// ---------- Schema ----------

function ensurePlatformsTable(db: ReturnType<typeof Database>) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "platform" (
      "id"           TEXT NOT NULL PRIMARY KEY,
      "userId"       TEXT NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
      "platformName" TEXT NOT NULL,
      "platformUrl"  TEXT NOT NULL,
      "contactName"  TEXT NOT NULL,
      "contactRole"  TEXT NOT NULL,
      "companySize"  TEXT NOT NULL,
      "industry"     TEXT NOT NULL,
      "useCase"      TEXT,
      "createdAt"    TEXT NOT NULL DEFAULT (datetime('now')),
      "updatedAt"    TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS "platform_userId_idx" ON "platform"("userId");
  `);
}

// ---------- Types ----------

export interface Platform {
  id: string;
  userId: string;
  platformName: string;
  platformUrl: string;
  contactName: string;
  contactRole: string;
  companySize: string;
  industry: string;
  useCase: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlatformInput {
  userId: string;
  platformName: string;
  platformUrl: string;
  contactName: string;
  contactRole: string;
  companySize: string;
  industry: string;
  useCase?: string;
}

// ---------- CRUD ----------

export function getPlatformByUserId(userId: string): Platform | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM "platform" WHERE "userId" = ?')
    .get(userId) as Platform | undefined;
}

export function createPlatform(input: CreatePlatformInput): Platform {
  const db = getDb();
  const id = `plat_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO "platform" ("id","userId","platformName","platformUrl","contactName","contactRole","companySize","industry","useCase","createdAt","updatedAt")
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.userId,
    input.platformName,
    input.platformUrl,
    input.contactName,
    input.contactRole,
    input.companySize,
    input.industry,
    input.useCase ?? null,
    now,
    now,
  );

  return getPlatformByUserId(input.userId)!;
}

export function updatePlatform(
  id: string,
  updates: Partial<Omit<CreatePlatformInput, "userId">>,
): Platform | undefined {
  const db = getDb();
  const setClauses: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      setClauses.push(`"${key}" = ?`);
      values.push(value);
    }
  }

  if (setClauses.length === 0) return undefined;

  setClauses.push('"updatedAt" = ?');
  values.push(new Date().toISOString());
  values.push(id);

  db.prepare(
    `UPDATE "platform" SET ${setClauses.join(", ")} WHERE "id" = ?`
  ).run(...values);

  const row = db.prepare('SELECT * FROM "platform" WHERE "id" = ?').get(id);
  return row as Platform | undefined;
}

// =====================================================
// PLATFORM DOCUMENTS
// =====================================================

function ensureDocumentsTable(db: ReturnType<typeof Database>) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "platform_document" (
      "id"                 TEXT NOT NULL PRIMARY KEY,
      "platformId"         TEXT NOT NULL REFERENCES "platform"("id") ON DELETE CASCADE,
      "type"               TEXT NOT NULL CHECK("type" IN ('pdf','image','markdown')),
      "cloudinaryUrl"      TEXT NOT NULL,
      "cloudinaryPublicId" TEXT NOT NULL,
      "filename"           TEXT NOT NULL,
      "sizeBytes"          INTEGER NOT NULL DEFAULT 0,
      "analysis"           TEXT,
      "createdAt"          TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS "document_platformId_idx" ON "platform_document"("platformId");
  `);
}

// ---------- Document Types ----------

export interface PlatformDocument {
  id: string;
  platformId: string;
  type: "pdf" | "image" | "markdown";
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  filename: string;
  sizeBytes: number;
  analysis: string | null;
  createdAt: string;
}

export interface CreateDocumentInput {
  platformId: string;
  type: "pdf" | "image" | "markdown";
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  filename: string;
  sizeBytes: number;
  analysis?: string;
}

// ---------- Document CRUD ----------

export function getDocumentsByPlatformId(platformId: string): PlatformDocument[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM "platform_document" WHERE "platformId" = ? ORDER BY "createdAt" DESC')
    .all(platformId) as PlatformDocument[];
}

export function getDocumentById(id: string): PlatformDocument | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM "platform_document" WHERE "id" = ?')
    .get(id) as PlatformDocument | undefined;
}

export function createDocument(input: CreateDocumentInput): PlatformDocument {
  const db = getDb();
  const id = `doc_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO "platform_document" ("id","platformId","type","cloudinaryUrl","cloudinaryPublicId","filename","sizeBytes","analysis","createdAt")
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.platformId,
    input.type,
    input.cloudinaryUrl,
    input.cloudinaryPublicId,
    input.filename,
    input.sizeBytes,
    input.analysis ?? null,
    now,
  );

  return getDocumentById(id)!;
}

export function updateDocumentAnalysis(id: string, analysis: string): void {
  const db = getDb();
  db.prepare('UPDATE "platform_document" SET "analysis" = ? WHERE "id" = ?').run(
    analysis,
    id,
  );
}

export function deleteDocument(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM "platform_document" WHERE "id" = ?').run(id);
  return result.changes > 0;
}

export function getDocumentCount(platformId: string): number {
  const db = getDb();
  const row = db
    .prepare('SELECT COUNT(*) as count FROM "platform_document" WHERE "platformId" = ?')
    .get(platformId) as { count: number };
  return row.count;
}
