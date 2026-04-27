import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { endRoleplaySession, submitRoleplayTurn } from "@/lib/roleplay/client";
import { SCENARIOS, getScenarioById } from "@/lib/roleplay/scenarios";

import {
  ActiveSession,
  FailedTurnPreview,
  SavedSession,
  ScenarioDefinition,
  SessionConfig,
  SessionSummary,
  SessionTurn,
  TurnResponse,
} from "./types";
import { KEYS, getJson, setJson } from "./storage";

type SessionContextType = {
  scenarios: ScenarioDefinition[];
  activeSession: ActiveSession | null;
  currentSummary: SessionSummary | null;
  savedSessions: SavedSession[];
  startSession: (config: SessionConfig) => void;
  abandonSession: () => void;
  submitTurn: (audioUri: string) => Promise<TurnResponse>;
  retryLastTurn: () => Promise<TurnResponse>;
  setPlaybackState: (isPlaying: boolean) => void;
  failLatestPlayback: (message: string) => void;
  endSession: () => Promise<SessionSummary>;
  saveCurrentSummary: () => Promise<SavedSession>;
  clearCurrentFlow: () => void;
  getSavedSession: (id: string) => SavedSession | undefined;
  deleteSavedSession: (id: string) => void;
};

const SessionContext = createContext<SessionContextType | null>(null);

function buildId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildTranscript(turns: SessionTurn[]) {
  return turns
    .map((turn) => `${turn.role === "user" ? "You" : "Partner"}: ${turn.text}`)
    .join("\n");
}

function normalizeConfig(config: SessionConfig): SessionConfig {
  return {
    ...config,
    attachments: config.attachments ?? [],
  };
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [currentSummary, setCurrentSummary] = useState<SessionSummary | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const sessions = await getJson<SavedSession[]>(KEYS.savedSessions, []);
      if (!mounted) return;
      setSavedSessions(Array.isArray(sessions) ? sessions : []);
      setHydrated(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setJson(KEYS.savedSessions, savedSessions);
  }, [hydrated, savedSessions]);

  function startSession(config: SessionConfig) {
    const normalizedConfig = normalizeConfig(config);
    const scenario = getScenarioById(normalizedConfig.scenarioId);
    if (!scenario) {
      throw new Error(`Unknown scenario: ${normalizedConfig.scenarioId}`);
    }

    setCurrentSummary(null);
    setActiveSession({
      id: buildId("session"),
      scenario,
      config: {
        ...normalizedConfig,
        summaryTemplate: scenario.summaryTemplate,
      },
      turns: [],
      status: "ready",
      latestAssistantText: null,
      latestAssistantAudioUri: null,
      lastTurnAudioUri: null,
      lastTurnIds: null,
      failedTurnPreview: null,
      error: null,
      createdAt: Date.now(),
    });
  }

  function abandonSession() {
    setActiveSession(null);
    setCurrentSummary(null);
  }

  async function submitTurn(audioUri: string) {
    if (!activeSession) {
      throw new Error("Start a session before submitting a turn.");
    }
    const snapshot = activeSession;
    setActiveSession((current) =>
      current && current.id === snapshot.id
        ? {
            ...current,
            status: "submitting",
            lastTurnAudioUri: audioUri,
            failedTurnPreview: null,
            error: null,
          }
        : current
    );

    try {
      const response = await submitRoleplayTurn(snapshot.config, snapshot.turns, audioUri);
      const failedTurnPreview: FailedTurnPreview = {
        userTranscript: response.userTranscript,
        assistantText: response.assistantText,
      };

      if (!response.assistantAudioUri) {
        const message =
          "The roleplay backend returned text without assistant audio. Retry this turn after fixing voice generation.";
        setActiveSession((current) => {
          if (!current || current.id !== snapshot?.id) return current;
          return {
            ...current,
            status: "ready",
            latestAssistantText: null,
            latestAssistantAudioUri: null,
            lastTurnIds: null,
            failedTurnPreview,
            error: message,
          };
        });
        throw new Error(message);
      }

      const userTurnId = buildId("turn");
      const assistantTurnId = buildId("turn");

      setActiveSession((current) => {
        if (!current || current.id !== snapshot?.id) return current;

        const appendedTurns: SessionTurn[] = [
          ...current.turns,
          {
            id: userTurnId,
            role: "user",
            text: response.userTranscript,
            createdAt: Date.now(),
          },
          {
            id: assistantTurnId,
            role: "assistant",
            text: response.assistantText,
            createdAt: Date.now() + 1,
          },
        ];

        return {
          ...current,
          turns: appendedTurns,
          status: "playing",
          latestAssistantText: response.assistantText,
          latestAssistantAudioUri: response.assistantAudioUri ?? null,
          lastTurnIds: [userTurnId, assistantTurnId],
          failedTurnPreview: null,
          error: null,
        };
      });

      return response;
    } catch (error: any) {
      const message = error?.message ?? "Unable to process that turn.";
      setActiveSession((current) => {
        if (!current || current.id !== snapshot?.id) return current;
        return {
          ...current,
          status: "ready",
          latestAssistantText: null,
          latestAssistantAudioUri: null,
          lastTurnIds: null,
          error: message,
        };
      });
      throw new Error(message);
    }
  }

  async function retryLastTurn() {
    if (!activeSession?.lastTurnAudioUri) {
      throw new Error("No failed turn is available to retry.");
    }
    return submitTurn(activeSession.lastTurnAudioUri);
  }

  function setPlaybackState(isPlaying: boolean) {
    setActiveSession((current) => {
      if (!current) return current;
      return {
        ...current,
        status: isPlaying ? "playing" : "ready",
        lastTurnIds: isPlaying ? current.lastTurnIds : null,
      };
    });
  }

  function failLatestPlayback(message: string) {
    setActiveSession((current) => {
      if (!current) return current;

      const nextTurns = current.lastTurnIds?.length
        ? current.turns.filter((turn) => !current.lastTurnIds?.includes(turn.id))
        : current.turns;

      const failedTurnPreview =
        current.lastTurnIds?.length && current.turns.length >= 2
          ? {
              userTranscript:
                current.turns.find((turn) => turn.id === current.lastTurnIds?.[0])?.text ?? "",
              assistantText:
                current.turns.find((turn) => turn.id === current.lastTurnIds?.[1])?.text ?? "",
            }
          : current.failedTurnPreview;

      return {
        ...current,
        turns: nextTurns,
        status: "ready",
        latestAssistantText: null,
        latestAssistantAudioUri: null,
        lastTurnIds: null,
        failedTurnPreview,
        error: message,
      };
    });
  }

  async function endSession() {
    if (!activeSession) {
      throw new Error("No active session to end.");
    }

    const snapshot = activeSession;
    setActiveSession((current) =>
      current ? { ...current, status: "ending", error: null } : current
    );

    try {
      const summary = await endRoleplaySession(snapshot.config, snapshot.turns);
      const normalizedSummary: SessionSummary = {
        ...summary,
        transcript: summary.transcript || buildTranscript(snapshot.turns),
      };
      setCurrentSummary(normalizedSummary);
      setActiveSession((current) =>
        current && current.id === snapshot.id
          ? { ...current, status: "summary-ready", error: null }
          : current
      );
      return normalizedSummary;
    } catch (error: any) {
      const message = error?.message ?? "Unable to build the summary.";
      setActiveSession((current) =>
        current && current.id === snapshot.id
          ? { ...current, status: "ready", error: message }
          : current
      );
      throw new Error(message);
    }
  }

  async function saveCurrentSummary() {
    if (!activeSession || !currentSummary) {
      throw new Error("No completed session is ready to save.");
    }

    const saved: SavedSession = {
      id: buildId("saved"),
      createdAt: Date.now(),
      scenario: activeSession.scenario,
      config: normalizeConfig(activeSession.config),
      turns: activeSession.turns,
      summary: currentSummary,
    };

    setSavedSessions((current) => [saved, ...current]);
    return saved;
  }

  function clearCurrentFlow() {
    setActiveSession(null);
    setCurrentSummary(null);
  }

  function getSavedSession(id: string) {
    return savedSessions.find((session) => session.id === id);
  }

  function deleteSavedSession(id: string) {
    setSavedSessions((current) => current.filter((session) => session.id !== id));
  }

  const value = useMemo<SessionContextType>(
    () => ({
      scenarios: SCENARIOS,
      activeSession,
      currentSummary,
      savedSessions,
      startSession,
      abandonSession,
      submitTurn,
      retryLastTurn,
      setPlaybackState,
      failLatestPlayback,
      endSession,
      saveCurrentSummary,
      clearCurrentFlow,
      getSavedSession,
      deleteSavedSession,
    }),
    [activeSession, currentSummary, savedSessions]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return value;
}
