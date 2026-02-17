import { File as ExpoFile } from "expo-file-system";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { KEYS, getJson, getStr, setJson, setStr } from "./storage";
import { Criteria, Grade, RecordingInput } from "./types";

const defaultCriteria: Criteria = {
  clarity: true,
  empathy: true,
  conciseness: true,
  objectionHandling: false,
  productKnowledge: false,
};

type HistoryItem = Grade & {
  audioUri?: string | null;
  transcript?: string;
  notes?: string;
  ai?: any;
};

type CtxType = {
  // grading/recordings
  criteria: Criteria;
  updateCriteria: (c: Criteria) => void;
  history: HistoryItem[];
  addRecording: (r: RecordingInput) => Promise<Grade>;
  deleteRecording: (idOrCreatedAt: string | number) => void;
  updateRecordingNotes: (idOrCreatedAt: string | number, notes: string) => void;

  // stats (only what you use)
  avgScore: number;
};

function gradeFrom(text: string, c: Criteria) {
  let base = 60 + Math.min(20, Math.floor((text?.length || 0) / 80));
  if (c.clarity) base += 5;
  if (c.empathy) base += 6;
  if (c.conciseness) base += 4;
  if (c.objectionHandling) base += 3;
  if (c.productKnowledge) base += 2;
  return Math.max(0, Math.min(100, base));
}
function pickPositives(c: Criteria): string[] {
  const out: string[] = [];
  if (c.clarity) out.push("Clear structure and messaging");
  if (c.empathy) out.push("Good rapport and empathetic language");
  if (c.conciseness) out.push("Concise delivery with minimal filler");
  if (c.objectionHandling) out.push("Handled objections effectively");
  if (c.productKnowledge) out.push("Strong product knowledge");
  return (out.length ? out : ["Engaging delivery"]).slice(0, 3);
}
function pickSuggestions(_: Criteria): string[] {
  return [
    "Slow down slightly and pause after key points",
    "Ask one more open-ended question",
    "Summarize next steps at the end",
  ];
}

const Ctx = createContext<CtxType | null>(null);

export function RecordingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [criteria, setCriteria] = useState<Criteria>(defaultCriteria);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [avgScore, setAvgScore] = useState<number>(NaN);
  const [hydrated, setHydrated] = useState(false);

  // hydrate
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const [storedCriteria, storedHistory, storedAvgScore] = await Promise.all(
        [
          getJson(KEYS.criteria, defaultCriteria),
          getJson(KEYS.history, []),
          getStr(KEYS.avgScore, "NaN"),
        ]
      );

      // 🔎 Debug: see how many items we have on launch
      try {
        const count = Array.isArray(storedHistory) ? storedHistory.length : 0;
        console.log("[RecordingsProvider] HISTORY COUNT ON LAUNCH:", count);
      } catch {}

      if (!isMounted) return;

      setCriteria(storedCriteria);
      setHistory(storedHistory);
      setAvgScore(Number(storedAvgScore));
      setHydrated(true);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // persist
  useEffect(() => {
    if (!hydrated) return;
    setJson(KEYS.criteria, criteria);
  }, [criteria, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    setJson(KEYS.history, history);
  }, [history, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    setStr(KEYS.avgScore, String(avgScore));
  }, [avgScore, hydrated]);

  function updateCriteria(c: Criteria) {
    setCriteria(c);
  }

  async function addRecording(r: RecordingInput): Promise<Grade> {
    const scoreFromAi = Number.isFinite(r.ai?.overallScore)
      ? Number(r.ai!.overallScore)
      : null;
    const score = scoreFromAi ?? gradeFrom(r.transcript, criteria);
    const g: Grade = {
      id: Date.now(),
      createdAt: Date.now(),
      score,
      positives: pickPositives(criteria),
      suggestions: pickSuggestions(criteria),
    };

    setHistory((h) => [
      {
        ...g,
        audioUri: r.uri,
        transcript: r.transcript?.trim() ?? "",
        notes: r.notes?.trim() ?? "",
        ai: r.ai,
      },
      ...h,
    ]);

    // maintain avgScore only (no sessions/streak legacy)
    setAvgScore((prev) =>
      Number.isFinite(prev)
        ? (prev * history.length + score) / (history.length + 1)
        : score
    );

    return g;
  }

  function deleteRecording(idOrCreatedAt: string | number) {
    setHistory((prev: any[]) => {
      const key = String(idOrCreatedAt);
      const rec = prev.find((r) => String(r.id ?? r.createdAt) === key);
      if (rec?.audioUri) {
        Promise.resolve(new ExpoFile(rec.audioUri).delete()).catch(() => {});
      }
      const next = prev.filter((r) => String(r.id ?? r.createdAt) !== key);

      // recompute avgScore from remaining history
      if (next.length === 0) setAvgScore(NaN);
      else {
        const sum = next.reduce((acc, it) => acc + (it.score ?? 0), 0);
        setAvgScore(sum / next.length);
      }
      return next;
    });
  }

  function updateRecordingNotes(idOrCreatedAt: string | number, notes: string) {
    const key = String(idOrCreatedAt);
    setHistory((prev) =>
      prev.map((r) =>
        String(r.id ?? r.createdAt) === key ? { ...r, notes: notes.trim() } : r
      )
    );
  }

  const value: CtxType = useMemo(
    () => ({
      criteria,
      updateCriteria,
      history,
      addRecording,
      deleteRecording,
      updateRecordingNotes,
      avgScore,
    }),
    [criteria, history, avgScore]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRecordings() {
  const v = useContext(Ctx);
  if (!v)
    throw new Error("useRecordings must be used within RecordingsProvider");
  return v;
}
