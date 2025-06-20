import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './Dashboard'
import Laporan from './Laporan'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/laporan" element={<Laporan />} />
      </Routes>
    </Router>
  )
}

export default App
