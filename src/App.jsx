import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase } from '@config/supabase'
import '@/App.css'

import { AuthProvider } from '@contexts/AuthContext'
import AuthCallback from '@contexts/AuthCallback';
import Header from '@components/common/Header';
import Footer from '@components/common/Footer';

import Search from '@pages/search/Search';
import SignUp from '@pages/auth/SignUp';
import Login from '@pages/auth/Login';

import CategoryPage from '@pages/product/CategoryPage';
import ProductDetail from '@pages/product/ProductDetail';

import Checkout from '@pages/order/Checkout';
import OrderDetail from '@pages/order/OrderDetail';

import Notice from '@pages/support/Notice';

import NotFound from '@pages/error/NotFound';
import OrderManagement from './pages/admin/OrderManagement';

console.log('Supabase 연결:', supabase)

// 푸터 숨길 페이지 경로들

function App() {
  return (
    <AuthProvider>
      <Router basename={process.env.NODE_ENV === 'production' ? '/M-MALL' : '/'}>
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

            {/* 상품별 상세 페이지 - 동적 라우팅 */}
            <Route path="/product/:pid" element={<ProductDetail />} />
            

            {/* 주문 관련 페이지들 */}
            <Route path="/order/checkout" element={<Checkout />} />
            <Route path="/order/orderdetail/:orderId" element={<OrderDetail/>} />

            {/* 사용자 관련 페이지들 */}
            <Route path="/search" element={<Search />} />
            <Route path="/mypage" element={<div>마이페이지</div>} />
            <Route path="/cart" element={<div>장바구니</div>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            {/* 공지사항 */}
            <Route path="/support/notice" element={<Notice />} />
            <Route path="/support/notice/:nid" element={<Notice />} />

            {/* 404 페이지 */}
            <Route path="*" element={<NotFound/>} />

            {/* admin */}
            <Route path="/admin" element={<OrderManagement/>} />
          </Routes>

          {/* Footer도 모든 페이지에서 공통으로 보여짐 */}
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App;