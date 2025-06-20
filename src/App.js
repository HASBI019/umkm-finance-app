import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AuthForm from './AuthForm'
import Dashboard from './Dashboard'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  )
}

export default App
