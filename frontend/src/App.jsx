import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Topbar from './components/Topbar'
import SovScore from './pages/SovScore'
import ReadinessAssessment from './pages/ReadinessAssessment'
import FinancialConsideration from './pages/FinancialConsideration'
import Benchmarking from './pages/Benchmarking'

export default function App() {
  return (
    <BrowserRouter>
      <Topbar />
      <Routes>
        <Route path="/" element={<Navigate to="/sovscore" replace />} />
        <Route path="/sovscore" element={<SovScore />} />
        <Route path="/readiness" element={<ReadinessAssessment />} />
        <Route path="/financial" element={<FinancialConsideration />} />
        <Route path="/benchmarking" element={<Benchmarking />} />
      </Routes>
    </BrowserRouter>
  )
}
