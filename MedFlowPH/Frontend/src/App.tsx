import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { PageRouteFallback } from './components/PageRouteFallback'

const Landing = lazy(() => import('./pages/Landing').then((m) => ({ default: m.Landing })))
const EDA = lazy(() => import('./pages/EDA').then((m) => ({ default: m.EDA })))
const Cleaning = lazy(() => import('./pages/Cleaning').then((m) => ({ default: m.Cleaning })))
const Preprocessing = lazy(() => import('./pages/Preprocessing').then((m) => ({ default: m.Preprocessing })))
const PCAPage = lazy(() => import('./pages/PCA').then((m) => ({ default: m.PCAPage })))
const ClusteringPage = lazy(() => import('./pages/Clustering').then((m) => ({ default: m.ClusteringPage })))
const Evaluation = lazy(() => import('./pages/Evaluation').then((m) => ({ default: m.Evaluation })))
const Interpretation = lazy(() => import('./pages/Interpretation').then((m) => ({ default: m.Interpretation })))
const Comparison = lazy(() => import('./pages/Comparison').then((m) => ({ default: m.Comparison })))
const WorkbenchHome = lazy(() =>
  import('./pages/workbench/WorkbenchHome').then((m) => ({ default: m.WorkbenchHome })),
)
const WorkbenchNew = lazy(() =>
  import('./pages/workbench/WorkbenchNew').then((m) => ({ default: m.WorkbenchNew })),
)
const WorkbenchRunDetail = lazy(() =>
  import('./pages/workbench/WorkbenchRunDetail').then((m) => ({ default: m.WorkbenchRunDetail })),
)
const WorkbenchCompare = lazy(() =>
  import('./pages/workbench/WorkbenchCompare').then((m) => ({ default: m.WorkbenchCompare })),
)

function RouteFallbackBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageRouteFallback />}>{children}</Suspense>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route
            path="/"
            element={
              <RouteFallbackBoundary>
                <Landing />
              </RouteFallbackBoundary>
            }
          />
          <Route
            path="/eda"
            element={
              <RouteFallbackBoundary>
                <EDA />
              </RouteFallbackBoundary>
            }
          />
          <Route path="/data-understanding" element={<Navigate to="/eda" replace />} />
          <Route
            path="/cleaning"
            element={
              <RouteFallbackBoundary>
                <Cleaning />
              </RouteFallbackBoundary>
            }
          />
          <Route
            path="/preprocessing"
            element={
              <RouteFallbackBoundary>
                <Preprocessing />
              </RouteFallbackBoundary>
            }
          />
          <Route
            path="/pca"
            element={
              <RouteFallbackBoundary>
                <PCAPage />
              </RouteFallbackBoundary>
            }
          />
          <Route
            path="/clustering"
            element={
              <RouteFallbackBoundary>
                <ClusteringPage />
              </RouteFallbackBoundary>
            }
          />
          <Route
            path="/evaluation"
            element={
              <RouteFallbackBoundary>
                <Evaluation />
              </RouteFallbackBoundary>
            }
          />
          <Route
            path="/interpretation"
            element={
              <RouteFallbackBoundary>
                <Interpretation />
              </RouteFallbackBoundary>
            }
          />
          <Route
            path="/comparison"
            element={
              <RouteFallbackBoundary>
                <Comparison />
              </RouteFallbackBoundary>
            }
          />
          <Route
            path="/workbench"
            element={
              <RouteFallbackBoundary>
                <WorkbenchHome />
              </RouteFallbackBoundary>
            }
          />
          <Route
            path="/workbench/new"
            element={
              <RouteFallbackBoundary>
                <WorkbenchNew />
              </RouteFallbackBoundary>
            }
          />
          <Route
            path="/workbench/compare"
            element={
              <RouteFallbackBoundary>
                <WorkbenchCompare />
              </RouteFallbackBoundary>
            }
          />
          <Route
            path="/workbench/runs/:runId"
            element={
              <RouteFallbackBoundary>
                <WorkbenchRunDetail />
              </RouteFallbackBoundary>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
