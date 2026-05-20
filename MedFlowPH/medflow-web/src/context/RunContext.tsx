import { createContext, useContext, type ReactNode } from 'react'
import { THESIS_FINAL_RUN_ID, type RunId } from '../data/artifacts'

const RunContext = createContext<RunId>(THESIS_FINAL_RUN_ID)

export function RunProvider({ runId, children }: { runId: RunId; children: ReactNode }) {
  return <RunContext.Provider value={runId}>{children}</RunContext.Provider>
}

/** Active workbench run; defaults to frozen thesis baseline on static pages. */
export function useRunId(): RunId {
  return useContext(RunContext)
}
