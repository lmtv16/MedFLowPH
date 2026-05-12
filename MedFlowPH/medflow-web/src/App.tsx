import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Comparison } from './pages/Comparison'
import { Landing } from './pages/Landing'
import { ClusteringPage } from './pages/Clustering'
import { EDA } from './pages/EDA'
import { Evaluation } from './pages/Evaluation'
import { Interpretation } from './pages/Interpretation'
import { Preprocessing } from './pages/Preprocessing'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/eda" element={<EDA />} />
          <Route path="/data-understanding" element={<Navigate to="/eda" replace />} />
          <Route path="/preprocessing" element={<Preprocessing />} />
          <Route path="/clustering" element={<ClusteringPage />} />
          <Route path="/evaluation" element={<Evaluation />} />
          <Route path="/interpretation" element={<Interpretation />} />
          <Route path="/comparison" element={<Comparison />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
