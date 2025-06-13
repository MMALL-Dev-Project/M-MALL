import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase } from './config/supabase'
import './App.css'

import { AuthProvider } from './contexts/AuthContext'
import AuthCallback from './contexts/AuthCallback';
import Header from './components/Header';
import Footer from './components/Footer';
import SignUp from './components/SignUp';

console.log('Supabase 연결:', supabase)

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className='App'>
          {/* Header는 모든 페이지에서 공통으로 보여짐 */}
          <Header />

          {/* Routes는 Header와 Footer 사이에 독립적으로 위치 */}
          <Routes>
            <Route path="/" element={<div>홈 페이지</div>} />

            {/* 인증 콜백 라우트 */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* 메뉴별 페이지들 */}
            <Route path="/recommended" element={<div>추천상품</div>} />
            <Route path="/fashion-beauty" element={<div>패션·뷰티</div>} />
            <Route path="/living" element={<div>리빙</div>} />
            <Route path="/tech" element={<div>테크</div>} />
            <Route path="/sports" element={<div>스포츠·레저</div>} />
            <Route path="/culture" element={<div>컬처</div>} />
            <Route path="/select-shop" element={<div>편집샵</div>} />
            <Route path="/hotel-gourmet" element={<div>호텔·고메</div>} />
            <Route path="/mobile" element={<div>모바일 이용권</div>} />
            <Route path="/hyundai-card" element={<div>현대카드</div>} />

            {/* 사용자 관련 페이지들 */}
            <Route path="/mypage" element={<div>마이페이지</div>} />
            <Route path="/cart" element={<div>장바구니</div>} />
            <Route path="/login" element={<div>로그인 페이지</div>} />
            <Route path="/signup" element={<SignUp />} />

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

export default App