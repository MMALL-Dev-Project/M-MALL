// src/pages/mypage/MyPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { supabase } from '@config/supabase';
import Dashboard from '@components/mypage/Dashboard';
import OrderHistory from '@components/mypage/OrderHistory';
import LikedProducts from '@components/mypage/LikedProducts';
import ProfileEdit from '@components/mypage/ProfileEdit';
import NotificationSettings from '@components/mypage/NotificationSettings';
import ReviewSection from '@components/mypage/ReviewSection';
import './MyPage.css';

export default function MyPage() {
  const navigate = useNavigate();
  const { user, userInfo } = useAuth();

  // ========== 상태 관리 ==========
  const [activeMenu, setActiveMenu] = useState('대시보드');
  const [detailedUserInfo, setDetailedUserInfo] = useState(null);
  const [likedProducts, setLikedProducts] = useState([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [orderStats, setOrderStats] = useState({
    pending: 0,
    paid: 0,
    preparing: 0,
    shipping: 0,
    delivered: 0,
    cancelled: 0,
    exchanged: 0,
    returned: 0
  });
  const [loading, setLoading] = useState(true);

  // ========== 데이터 로드 ==========
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchUserDetailInfo(),
      fetchLikedProducts(),
      fetchReviewCount(),
      fetchRecentOrders(),
      fetchOrderStats()
    ]);
    setLoading(false);
  };

  // 사용자 상세 정보
  const fetchUserDetailInfo = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_info')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setDetailedUserInfo(data);
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
    }
  };

  // 좋아요한 상품
  const fetchLikedProducts = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          *,
          products (
            pid,
            name,
            price,
            thumbnail_url,
            brands (
              bid,
              name
            )
          )
        `)
        .eq('uid', user.id)
        .eq('target_type', 'product')
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      setLikedProducts(data || []);
    } catch (error) {
      console.error('좋아요 목록 조회 실패:', error);
    }
  };

  // 리뷰 개수
  const fetchReviewCount = async () => {
    if (!user) return;
    try {
      const { count, error } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('uid', user.id);

      if (error) throw error;
      setReviewCount(count || 0);
    } catch (error) {
      console.error('리뷰 개수 조회 실패:', error);
    }
  };

  // 최근 주문 내역
  const fetchRecentOrders = async () => {
    if (!user) return;
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              pid,
              name,
              thumbnail_url,
              brands (
                bid,
                name
              )
            )
          )
        `)
        .eq('uid', user.id)
        .gte('created_at', oneMonthAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentOrders(data || []);
    } catch (error) {
      console.error('최근 주문 조회 실패:', error);
    }
  };

  // 주문 통계
  const fetchOrderStats = async () => {
    if (!user) return;
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .eq('uid', user.id)
        .gte('created_at', oneMonthAgo.toISOString());

      if (error) throw error;

      const stats = {
        pending: 0,
        paid: 0,
        preparing: 0,
        shipping: 0,
        delivered: 0,
        cancelled: 0,
        exchanged: 0,
        returned: 0
      };

      data?.forEach(order => {
        const status = order.status.toLowerCase();
        if (stats.hasOwnProperty(status)) {
          stats[status]++;
        }
        if (order.status === 'CONFIRMED') {
          stats.preparing++;
        }
      });

      setOrderStats(stats);
    } catch (error) {
      console.error('주문 통계 조회 실패:', error);
    }
  };

  // ========== 유틸 함수 ==========
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR').replace(/\. /g, '.').slice(0, -1);
  };

  // ========== 좋아요 취소 ==========
  const handleUnlike = async (lid, pid) => {
    try {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('lid', lid);

      if (error) throw error;

      await fetchLikedProducts();
    } catch (error) {
      console.error('좋아요 취소 실패:', error);
      alert('좋아요 취소에 실패했습니다.');
    }
  };

  // ========== 알림 설정 저장 ==========
  const handleSaveNotifications = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData(e.target);
      const notificationSettings = {
        order_status: formData.get('order_status') === 'on',
        marketing: formData.get('marketing') === 'on',
        product_restock: formData.get('product_restock') === 'on',
        product_discount: formData.get('product_discount') === 'on',
        shipping: formData.get('shipping') === 'on'
      };

      const { error } = await supabase
        .from('user_info')
        .update({ notification_settings: notificationSettings })
        .eq('id', user.id);

      if (error) throw error;

      alert('알림 설정이 저장되었습니다.');
      await fetchUserDetailInfo();
    } catch (error) {
      console.error('알림 설정 저장 실패:', error);
      alert('알림 설정 저장에 실패했습니다.');
    }
  };

  // ========== 회원정보 저장 ==========
  const handleSaveProfile = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData(e.target);
      const updateData = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        address: formData.get('address')
      };

      const { error } = await supabase
        .from('user_info')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      alert('회원정보가 수정되었습니다.');
      await fetchUserDetailInfo();
    } catch (error) {
      console.error('회원정보 수정 실패:', error);
      alert('회원정보 수정에 실패했습니다.');
    }
  };

  // ========== 로딩 및 로그인 체크 ==========
  if (loading) {
    return (
      <div className="mypage">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mypage">
        <div className="empty-content">
          <p>로그인이 필요합니다.</p>
          <button onClick={() => navigate('/login')} className="submit-btn">
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="mypage" className="mypage">
      {/* 프로필 영역 */}
      <div className="profile-section">
        <div className="profile-container">
          <div className="profile-top">
            <div className="profile-info">
              <div className="profile-image">
                {userInfo?.profile_image ? (
                  <img src={userInfo.profile_image} alt="프로필" />
                ) : (
                  userInfo?.name?.charAt(0) || 'U'
                )}
              </div>

              <div className="profile-details">
                <h2>
                  {userInfo?.name || '사용자'}
                  <button onClick={() => setActiveMenu('회원정보 수정')}>✏️</button>
                </h2>
                <p>가입일 : {formatDate(detailedUserInfo?.created_at)}</p>
              </div>
            </div>
          </div>

          <div className="stats-grid three-items">
            <div className="stat-item">
              <p className="stat-label">M-point</p>
              <p className="stat-value">{userInfo?.points_balance || 0}P</p>
            </div>
            <div className="stat-item">
              <p className="stat-label">쿠폰</p>
              <p className="stat-value">0장</p>
            </div>
            <div className="stat-item">
              <p className="stat-label">리뷰</p>
              <p className="stat-value">{reviewCount}개</p>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨테이너 */}
      <div className="main-container">
        {/* 사이드바 */}
        <aside className="sidebar">
          <h1 className="sidebar-title">마이페이지</h1>

          <div className="menu-section">
            <h3 className="menu-title">나의 쇼핑정보</h3>
            <ul className="menu-list">
              <li>
                <button
                  onClick={() => setActiveMenu('주문 내역')}
                  className={activeMenu === '주문 내역' ? 'active' : ''}
                >
                  주문 내역
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/order/orderList?status=CANCELLED')}
                  className={activeMenu === '교환/반품/취소 내역' ? 'active' : ''}
                >
                  교환/반품/취소 내역
                </button>
              </li>
            </ul>
          </div>

          <div className="menu-section">
            <h3 className="menu-title">나의 참여 내역</h3>
            <ul className="menu-list">
              <li>
                <button
                  onClick={() => navigate('/support/inquiries')}
                  className={activeMenu === '1:1 문의' ? 'active' : ''}
                >
                  1:1 문의
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveMenu('상품리뷰')}
                  className={activeMenu === '상품리뷰' ? 'active' : ''}
                >
                  상품리뷰
                </button>
              </li>
            </ul>
          </div>

          <div className="menu-section">
            <h3 className="menu-title">나의 정보 관리</h3>
            <ul className="menu-list">
              <li>
                <button
                  onClick={() => setActiveMenu('회원정보 수정')}
                  className={activeMenu === '회원정보 수정' ? 'active' : ''}
                >
                  회원정보 수정
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveMenu('알림 설정')}
                  className={activeMenu === '알림 설정' ? 'active' : ''}
                >
                  알림 설정
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveMenu('좋아요')}
                  className={activeMenu === '좋아요' ? 'active' : ''}
                >
                  좋아요
                </button>
              </li>
            </ul>
          </div>
        </aside>

        {/* 메인 컨텐츠 */}
        <main className="main-content">
          {activeMenu === '대시보드' && (
            <Dashboard
              orderStats={orderStats}
              onMenuChange={setActiveMenu} />
          )}

          {activeMenu === '주문 내역' && (
            <OrderHistory 
              orderStats={orderStats} 
              recentOrders={recentOrders} 
            />
          )}

          {activeMenu === '좋아요' && (
            <LikedProducts 
              likedProducts={likedProducts} 
              onUnlike={handleUnlike} 
            />
          )}

          {activeMenu === '회원정보 수정' && (
            <ProfileEdit 
              userInfo={userInfo} 
              detailedUserInfo={detailedUserInfo} 
              onSave={handleSaveProfile} 
            />
          )}

          {activeMenu === '알림 설정' && (
            <NotificationSettings 
              detailedUserInfo={detailedUserInfo} 
              onSave={handleSaveNotifications} 
            />
          )}

          {activeMenu === '상품리뷰' && (
            <ReviewSection reviewCount={reviewCount} />
          )}
        </main>
      </div>
    </div>
  );
}