// import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css'
import Login from './Login';


function App() {
  // const [count, setCount] = useState(0)

  return (
    <>
      <BrowserRouter>
      {/* Navigation */}
      <nav>
        <Link to="/login">Login</Link> |{" "}
        <Link to="/create_account">Create account</Link>{" "}
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
