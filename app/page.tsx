"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Task {
  id: number;
  name: string;
  isRGA: boolean;
}

const STORAGE_KEY = "dailyflow-tasks";

function createDefaultTasks(): Task[] {
  return Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    name: "",
    isRGA: false,
  }));
}

function loadTasks(): Task[] {
  if (typeof window === "undefined") return createDefaultTasks();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Task[];
      if (Array.isArray(parsed) && parsed.length === 6) return parsed;
    }
  } catch {}
  return createDefaultTasks();
}

const TIMER_SECONDS = 25 * 60;

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(createDefaultTasks);
  const [hydrated, setHydrated] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [running, setRunning] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setTasks(loadTasks());
    setHydrated(true);
  }, []);

  // Persist to localStorage on change (after hydration)
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks, hydrated]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Timer tick
  useEffect(() => {
    if (!running) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [running, clearTimer]);

  function handleTaskClick(id: number) {
    if (activeId === id) {
      setActiveId(null);
      setRunning(false);
      setSecondsLeft(TIMER_SECONDS);
    } else {
      setActiveId(id);
      setRunning(false);
      setSecondsLeft(TIMER_SECONDS);
    }
  }

  function handleNameChange(id: number, value: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: value } : t))
    );
  }

  function toggleRGA(id: number) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isRGA: !t.isRGA } : t))
    );
  }

  function handleStart() {
    if (secondsLeft > 0) setRunning(true);
  }

  function handlePause() {
    setRunning(false);
  }

  // Scroll focused input into view above the mobile keyboard
  function handleInputFocus(e: React.FocusEvent<HTMLInputElement>) {
    setInputFocused(true);
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  }

  function handleInputBlur() {
    setInputFocused(false);
  }

  function dismissKeyboard() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans pb-20">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Good Morning, Sarah</h1>
        <p className="text-sm text-slate-400 mt-1">
          Focus on what matters most today.
        </p>
      </header>

      {/* Task Cards */}
      <div className="flex flex-col gap-3">
        {tasks.map((task) => {
          const isActive = activeId === task.id;
          const borderColor = task.isRGA
            ? "border-yellow-500"
            : isActive
              ? "border-blue-500"
              : "border-slate-800";

          return (
            <div key={task.id}>
              <div
                onClick={() => handleTaskClick(task.id)}
                className={`w-full rounded-xl bg-slate-900 border transition-all
                  ${borderColor} ${isActive ? "rounded-b-none" : ""}
                  min-h-[44px] p-4 cursor-pointer`}
              >
                <div className="flex items-center gap-2">
                  {/* Editable task name */}
                  <input
                    type="text"
                    value={task.name}
                    onChange={(e) => handleNameChange(task.id, e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Enter Mission..."
                    className="flex-1 bg-transparent border-none outline-none text-slate-100
                      font-medium placeholder:text-slate-600 min-w-0"
                  />

                  {/* Money Maker toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRGA(task.id);
                    }}
                    className={`min-w-[44px] min-h-[44px] flex items-center justify-center
                      rounded-lg text-lg transition-all
                      ${task.isRGA ? "bg-yellow-500/20 scale-110" : "bg-slate-800/50 opacity-50"}`}
                    aria-label="Toggle Revenue Generating Activity"
                  >
                    💰
                  </button>

                  {/* Status badge */}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                      isActive
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isActive ? "Active" : "Tap to focus"}
                  </span>
                </div>
              </div>

              {/* Expanded timer panel */}
              {isActive && (
                <div className="bg-slate-900 border border-t-0 border-slate-800 rounded-b-xl px-4 pb-4">
                  <div className="text-center pt-4">
                    <p className="text-4xl font-mono font-bold tracking-wider">
                      {formatTime(secondsLeft)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      25-minute focus session
                    </p>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleStart}
                      disabled={running}
                      className="flex-1 min-h-[44px] rounded-lg bg-blue-600 font-semibold
                        enabled:hover:bg-blue-500 disabled:opacity-40 transition-colors"
                    >
                      Start
                    </button>
                    <button
                      onClick={handlePause}
                      disabled={!running}
                      className="flex-1 min-h-[44px] rounded-lg bg-slate-800 font-semibold
                        enabled:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                    >
                      Pause
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating "Done" button — visible when an input is focused */}
      {inputFocused && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-3 z-50">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              dismissKeyboard();
            }}
            className="w-full min-h-[44px] rounded-lg bg-blue-600 font-semibold
              hover:bg-blue-500 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
