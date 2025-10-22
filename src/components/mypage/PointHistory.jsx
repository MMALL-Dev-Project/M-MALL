// src/components/mypage/PointHistory.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { supabase } from '@config/supabase';
import './PointHistory.css';

export default function PointHistory() {
  // AuthContext에서 현재 로그인한 사용자 정보 가져오기
  const { user, userInfo } = useAuth();
  
  // 포인트 사용 내역 리스트를 저장할 state
  const [pointLogs, setPointLogs] = useState([]);
  
  // 데이터 로딩 상태를 관리할 state
  const [loading, setLoading] = useState(true);

  // 컴포넌트가 마운트되거나 user가 변경될 때 포인트 내역 조회
  useEffect(() => {
    if (user) {
      fetchPointHistory();
    }
  }, [user]);

  // point_log 테이블에서 사용자의 포인트 내역을 조회하는 함수
  const fetchPointHistory = async () => {
    // 로딩 시작
    setLoading(true);
    
    try {
      // Supabase에서 point_log 테이블 조회
      const { data, error } = await supabase
        .from('point_log')
        .select('*')
        .eq('uid', user.id)
        .lt('amount', 0) // amount가 음수인 것만 조회 (사용 내역만)
        .order('created_at', { ascending: false }); // 최신순 정렬

      // 에러가 발생하면 throw
      if (error) throw error;

      // 조회 성공 시 state에 저장
      setPointLogs(data || []);
    } catch (error) {
      // 에러 발생 시 빈 배열로 설정
      setPointLogs([]);
    } finally {
      // 성공/실패 여부와 관계없이 로딩 종료
      setLoading(false);
    }
  };

  // 날짜 포맷 함수 (2025-01-15T12:30:00 → 2025.01.15)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR').replace(/\. /g, '.').slice(0, -1);
  };

  // 숫자를 천 단위 콤마 형식으로 변환하는 함수 (50000 → 50,000)
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 로딩 중일 때 표시할 화면
  if (loading) {
    return (
      <div className="point-history">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="point-history">
      {/* 페이지 제목 */}
      <h2 className="section-title">포인트 사용 내역</h2>

      {/* 현재 보유 포인트 표시 영역 */}
      <div className="point-summary">
        <div className="current-points">
          <span className="label">현재 보유 포인트</span>
          <span className="amount">{formatNumber(userInfo?.points_balance || 0)}P</span>
        </div>
      </div>

      {/* 포인트 사용 내역이 없을 때 */}
      {pointLogs.length === 0 ? (
        <div className="empty-history">
          <p>아직 포인트 사용 내역이 없습니다.</p>
        </div>
      ) : (
        // 포인트 사용 내역이 있을 때
        <div className="history-list">
          {pointLogs.map((log) => (
            // 각 포인트 사용 내역 항목
            <div key={log.plid} className="history-item">
              <div className="history-date">
                {formatDate(log.created_at)}
              </div>
              <div className="history-content">
                <div className="history-reason">{log.reason}</div>
                <div className="history-amount">
                  {formatNumber(log.amount)}P
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}