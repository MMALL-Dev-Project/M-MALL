import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase } from './config/supabase'
import './App.css'

import { AuthProvider } from './contexts/AuthContext'
import AuthCallback from './contexts/AuthCallback';
import Header from './components/common/Header';
import Footer from './components/common/Footer';

import SignUp from './pages/auth/SignUp';
import Login from './pages/auth/Login';

import CategoryPage from './pages/CategoryPage';

import Notice from './pages/support/Notice';

console.log('Supabase 연결:', supabase)

function App() {
  return (
    <AuthProvider>
      <Router basename='/M-MALL'>
        <div className='App'>
          {/* Header는 모든 페이지에서 공통으로 보여짐 */}
          <Header />

          {/* Routes는 Header와 Footer 사이에 독립적으로 위치 */}
          <Routes>
            <Route path="/" element={<div>홈 페이지</div>} />

            {/* 인증 콜백 라우트 */}
            <Route path="/auth/callback" element={<AuthCallback />} />

             {/* 메뉴별 페이지들 - 동적 라우팅*/}
            <Route path="/:categorySlug" element={<CategoryPage />} />
            <Route path="/:categorySlug/:subcategorySlug" element={<CategoryPage />} />

            {/* 사용자 관련 페이지들 */}
            <Route path="/mypage" element={<div>마이페이지</div>} />
            <Route path="/cart" element={<div>장바구니</div>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            {/* 공지사항 */}
              <Route path="/support/notice" element={<Notice />} />
              <Route path="/support/notice/:nid" element={<Notice />} />

            {/* 404 페이지 */}
            <Route path="*" element={<div>페이지를 찾을 수 없습니다.</div>} />
          </Routes>

          {/* Footer도 모든 페이지에서 공통으로 보여짐 */}
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App;