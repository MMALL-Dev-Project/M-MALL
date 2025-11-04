import { useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

// 사용자 활동을 자동으로 기록하는 Hook
export const useActivityTracker = () => {
  const { user } = useAuth();

  /* 상품 조회 기록
     * @param {number} productId - 상품 ID
  */
  const trackProductView = async (productId) => {
    if (!user || !productId) {
      return;
    }

    try {
      const { error } = await supabase.rpc('record_product_view', {
        p_uid: user.id,  // user.id 사용 (AuthContext에서 확인)
        p_pid: parseInt(productId)
      });

      if (error) {
        console.error('조회 기록 실패', error)

      } else {
        console.log('상품 조회 기록 성공', productId)
      }
    } catch (error) {
      console.error('조회 기록 예외', error)
    }
  };

  return {
    trackProductView
  };
};

/* 상품 상세 페이지용 자동 추적 Hook
  컴포넌트에 추가만 하면 자동으로 조회 기록
*/

export const useProductViewTracker = (productId) => {
  const { trackProductView } = useActivityTracker();
  const trackedRef = useRef (false);

  useEffect (() => {
    // productId 있, 기록 X -> 기록
    if (productId && !trackedRef.current) {
      trackProductView(productId);
      trackedRef.current = true;
    };

    // cleanup: productId 변경되면 다시 기록 가능하게
    return () => {
      trackedRef.current = false
    };
  }, [productId, trackProductView]);
};