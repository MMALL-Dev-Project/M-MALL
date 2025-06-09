import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'
import { supabase } from './config/supabase'
import './App.css'

import Header from './components/Header';
import Footer from './components/Footer';

console.log('Supabase 연결:', supabase)
function App() {

  return (
    <AuthProvider>
      <Router>
        <div className='App'>
          <Header />
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
