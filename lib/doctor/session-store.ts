import { randomUUID } from "node:crypto";

import type { DoctorSessionState } from "@/engine/doctor/doctor-types";
import { getPrismaClient } from "@/lib/db/prisma";

export type DoctorSession = {
  id: string;
  state: DoctorSessionState;
  expiresAt: number;
};

export interface DoctorSessionStore {
  create(state: DoctorSessionState): Promise<DoctorSession>;
  get(sessionId: string): Promise<DoctorSession | null>;
  update(
    sessionId: string,
    state: DoctorSessionState,
  ): Promise<DoctorSession | null>;
  delete(sessionId: string): Promise<void>;
}

function boundState(
  state: DoctorSessionState,
  maxFacts: number,
): DoctorSessionState {
  return {
    ...state,
    facts: state.facts.slice(-maxFacts),
    answeredQuestionIds:
      state.answeredQuestionIds.slice(-maxFacts),
  };
}

export class InMemoryDoctorSessionStore
  implements DoctorSessionStore
{
  private readonly sessions = new Map<string, DoctorSession>();

  constructor(
    private readonly ttlMs = 30 * 60 * 1000,
    private readonly maxSessions = 500,
    private readonly maxFacts = 100,
  ) {}

  async create(state: DoctorSessionState): Promise<DoctorSession> {
    this.purge();

    if (this.sessions.size >= this.maxSessions) {
      const oldest = [...this.sessions.values()].sort(
        (left, right) => left.expiresAt - right.expiresAt,
      )[0];

      if (oldest) {
        this.sessions.delete(oldest.id);
      }
    }

    const session: DoctorSession = {
      id: randomUUID(),
      state: boundState(state, this.maxFacts),
      expiresAt: Date.now() + this.ttlMs,
    };

    this.sessions.set(session.id, session);
    return session;
  }

  async get(sessionId: string): Promise<DoctorSession | null> {
    this.purge();
    return this.sessions.get(sessionId) ?? null;
  }

  async update(
    sessionId: string,
    state: DoctorSessionState,
  ): Promise<DoctorSession | null> {
    this.purge();

    if (!this.sessions.has(sessionId)) {
      return null;
    }

    const session: DoctorSession = {
      id: sessionId,
      state: boundState(state, this.maxFacts),
      expiresAt: Date.now() + this.ttlMs,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  private purge(): void {
    const now = Date.now();

    for (const [id, session] of this.sessions) {
      if (session.expiresAt <= now) {
        this.sessions.delete(id);
      }
    }
  }
}

type DoctorSessionRow = {
  id: string;
  state: unknown;
  expiresAt: Date;
};

export class PostgresDoctorSessionStore
  implements DoctorSessionStore
{
  private schemaReady: Promise<void> | undefined;

  constructor(
    private readonly ttlMs = 30 * 60 * 1000,
    private readonly maxFacts = 100,
  ) {}

  async create(state: DoctorSessionState): Promise<DoctorSession> {
    await this.ensureSchema();

    const id = randomUUID();
    const expiresAt = new Date(Date.now() + this.ttlMs);
    const serializedState = JSON.stringify(
      boundState(state, this.maxFacts),
    );

    const rows = await getPrismaClient().$queryRaw<DoctorSessionRow[]>`
      INSERT INTO "DoctorSessionStore"
        ("id", "state", "expiresAt", "createdAt", "updatedAt")
      VALUES
        (${id}, ${serializedState}::jsonb, ${expiresAt}, NOW(), NOW())
      RETURNING "id", "state", "expiresAt"
    `;

    return this.toSession(rows[0]);
  }

  async get(sessionId: string): Promise<DoctorSession | null> {
    await this.ensureSchema();
    await this.deleteExpired();

    const rows = await getPrismaClient().$queryRaw<DoctorSessionRow[]>`
      SELECT "id", "state", "expiresAt"
      FROM "DoctorSessionStore"
      WHERE "id" = ${sessionId}
        AND "expiresAt" > NOW()
      LIMIT 1
    `;

    return rows[0] ? this.toSession(rows[0]) : null;
  }

  async update(
    sessionId: string,
    state: DoctorSessionState,
  ): Promise<DoctorSession | null> {
    await this.ensureSchema();
    await this.deleteExpired();

    const expiresAt = new Date(Date.now() + this.ttlMs);
    const serializedState = JSON.stringify(
      boundState(state, this.maxFacts),
    );

    const rows = await getPrismaClient().$queryRaw<DoctorSessionRow[]>`
      UPDATE "DoctorSessionStore"
      SET
        "state" = ${serializedState}::jsonb,
        "expiresAt" = ${expiresAt},
        "updatedAt" = NOW()
      WHERE "id" = ${sessionId}
        AND "expiresAt" > NOW()
      RETURNING "id", "state", "expiresAt"
    `;

    return rows[0] ? this.toSession(rows[0]) : null;
  }

  async delete(sessionId: string): Promise<void> {
    await this.ensureSchema();

    await getPrismaClient().$executeRaw`
      DELETE FROM "DoctorSessionStore"
      WHERE "id" = ${sessionId}
    `;
  }

  private async ensureSchema(): Promise<void> {
    if (!this.schemaReady) {
      this.schemaReady = this.createSchema();
    }

    await this.schemaReady;
  }

  private async createSchema(): Promise<void> {
    await getPrismaClient().$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DoctorSessionStore" (
        "id" TEXT PRIMARY KEY,
        "state" JSONB NOT NULL,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await getPrismaClient().$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "DoctorSessionStore_expiresAt_idx"
      ON "DoctorSessionStore" ("expiresAt")
    `);
  }

  private async deleteExpired(): Promise<void> {
    await getPrismaClient().$executeRaw`
      DELETE FROM "DoctorSessionStore"
      WHERE "expiresAt" <= NOW()
    `;
  }

  private toSession(row: DoctorSessionRow | undefined): DoctorSession {
    if (!row) {
      throw new Error("DOCTOR_SESSION_CREATE_FAILED");
    }

    const state =
      typeof row.state === "string"
        ? JSON.parse(row.state)
        : row.state;

    return {
      id: row.id,
      state: state as DoctorSessionState,
      expiresAt: row.expiresAt.getTime(),
    };
  }
}

let store: DoctorSessionStore | undefined;

export function getDoctorSessionStore(): DoctorSessionStore {
  if (store) {
    return store;
  }

  const defaultMode =
    process.env.NODE_ENV === "production"
      ? "postgres"
      : "memory";

  const mode = process.env.DOCTOR_SESSION_STORE ?? defaultMode;

  if (mode === "postgres") {
    store = new PostgresDoctorSessionStore();
    return store;
  }

  if (mode === "memory" && process.env.NODE_ENV !== "production") {
    store = new InMemoryDoctorSessionStore();
    return store;
  }

  throw new Error(`Unsupported DOCTOR_SESSION_STORE mode: ${mode}`);
}

export function setDoctorSessionStoreForTests(
  next: DoctorSessionStore | undefined,
): void {
  store = next;
}
