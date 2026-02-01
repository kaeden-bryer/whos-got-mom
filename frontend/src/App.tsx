// import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css'
import Header from './components_login/Header'
import Username from './components_login/Username'
import Password from './components_login/Password'
import Create_account from './Create_account';

function App() {
  

  return (
    <div>
        <Header/>
        <Username/>
        <Password/>
    
      <BrowserRouter>
      <nav>
          <h5>Don't have an account? <Link to="/create_account">Sign up</Link>{" "}</h5>
        </nav>
      <Routes>
        <Route path="/create_account" element={<Create_account/>} />
      </Routes>
    </BrowserRouter>
    </div>
  )
}

export default App;
