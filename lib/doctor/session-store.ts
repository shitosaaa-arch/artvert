import { randomUUID } from "node:crypto";

import type { DoctorSessionState } from "@/engine/doctor/doctor-types";

export type DoctorSession = {
  id: string;
  state: DoctorSessionState;
  expiresAt: number;
};

export interface DoctorSessionStore {
  create(state: DoctorSessionState): Promise<DoctorSession>;
  get(sessionId: string): Promise<DoctorSession | null>;
  update(sessionId: string, state: DoctorSessionState): Promise<DoctorSession | null>;
  delete(sessionId: string): Promise<void>;
}

export class InMemoryDoctorSessionStore implements DoctorSessionStore {
  private readonly sessions = new Map<string, DoctorSession>();

  constructor(private readonly ttlMs = 30 * 60 * 1000, private readonly maxSessions = 500, private readonly maxFacts = 100) {}

  async create(state: DoctorSessionState): Promise<DoctorSession> {
    this.purge();
    if (this.sessions.size >= this.maxSessions) {
      const oldest = [...this.sessions.values()].sort((left, right) => left.expiresAt - right.expiresAt)[0];
      if (oldest) this.sessions.delete(oldest.id);
    }
    const session = { id: randomUUID(), state: this.bound(state), expiresAt: Date.now() + this.ttlMs };
    this.sessions.set(session.id, session);
    return session;
  }

  async get(sessionId: string): Promise<DoctorSession | null> {
    this.purge();
    return this.sessions.get(sessionId) ?? null;
  }

  async update(sessionId: string, state: DoctorSessionState): Promise<DoctorSession | null> {
    this.purge();
    if (!this.sessions.has(sessionId)) return null;
    const session = { id: sessionId, state: this.bound(state), expiresAt: Date.now() + this.ttlMs };
    this.sessions.set(sessionId, session);
    return session;
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  private bound(state: DoctorSessionState): DoctorSessionState {
    return { ...state, facts: state.facts.slice(-this.maxFacts), answeredQuestionIds: state.answeredQuestionIds.slice(-this.maxFacts) };
  }

  private purge(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) if (session.expiresAt <= now) this.sessions.delete(id);
  }
}

let store: DoctorSessionStore | undefined;

export function getDoctorSessionStore(): DoctorSessionStore {
  if (store) return store;
  const mode = process.env.DOCTOR_SESSION_STORE ?? (process.env.NODE_ENV === "production" ? "required" : "memory");
  if (mode === "memory" && process.env.NODE_ENV !== "production") return store = new InMemoryDoctorSessionStore();
  throw new Error("A production-capable DOCTOR_SESSION_STORE is required in production.");
}

export function setDoctorSessionStoreForTests(next: DoctorSessionStore | undefined): void {
  store = next;
}
