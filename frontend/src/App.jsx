import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Topbar from './components/Topbar'
import SovScore from './pages/SovScore'

export default function App() {
  return (
    <BrowserRouter>
      <Topbar />
      <Routes>
        <Route path="/" element={<Navigate to="/sovscore" replace />} />
        <Route path="/sovscore" element={<SovScore />} />
      </Routes>
    </BrowserRouter>
  )
}
