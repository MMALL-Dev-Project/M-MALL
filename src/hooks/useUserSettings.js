import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useUserSettings = () => {
  const { user } = useAuth(); // 현재 로그인한 사용자 정보
  const [ settings, setSettings ] = useState({
    save_search_history: true, // 검색어 저장 기본값
  });

  const [ loading, setLoading ] = useState(false);

  const fetchUserSettings = async () => {
    setLoading(true); // 로딩 시작

    try {
      if (user) { // 로그인 사용자 DB에서 설정 가져오기
        const { data, error } = await supabase
          .from('user_info')
          .select('notification_settings')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('설정 불러오기 오류:', error);
          return
        }

        if (data && data.notification_settings) {
          setSettings({
            save_search_history: data.notification_settings.save_search_history ?? true,
          });
        }
      } else { // 비회원: localStorage에서 설정 가져오기
        const localSettings = localStorage.getItem('userSettings');
        if (localSettings) {
          const parsed = JSON.parse(localSettings);
          setSettings({
            save_search_history: parsed.save_search_history ?? true,
          });
        }
      }
    } catch (error) {
      console.error('설정 불러오기 오류:', error);
    } finally {
      setLoading(false); // 로딩 종료
    }
  };

  // 설정 업데이트하는 함수 (DB or localStorage에 저장)
  const updateSetting = async (key, value) => {
    try {
      if (user) {
        const { data: currentData } =await supabase
          .from('user_info')
          .select('notification_settings')
          .eq('id', user.id)
          .single();
        // 기존 설정에 새 설정 추가/업데이트
        const updatedSettings = {
          ...currentData?.notification_settings,
          [key]: value
        };

        // DB에 저장
        const { error } = await supabase
          .from('user_info')
          .update({
            notification_settings: updatedSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) throw error;
      } else {
        // 비로그인 사용자: localStorage 업데이트
        const newSettings = { ...settings, [key]: value };
        localStorage.setItem('userSettings', JSON.stringify(newSettings));
      }

      // 화면 상태도 업데이트
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));

      return true; // 성공
    } catch (error) {
      console.error('설정 업데이트 실패:', error);
      return false; // 실패
    }
  };

  // 검색어 저장 설정 토글 함수
  const toggleSearchHistorySetting = async () => {
    const newValue = !settings.save_search_history; // 현재 값의 반대
    const success = await updateSetting('save_search_history', newValue);

    // 토글 off 해도 데이터 보존됨
    if (success && !newValue) {
      console.log('검색어 저장이 꺼졌습니다. 기존 기록은 보존되며 화면에서만 숨겨집니다.');
    } else if (success && newValue) {
      console.log('검색어 저장이 켜졌습니다. 기존 기록이 다시 표시됩니다.');
    }
    return success;
  };

  // 검색 기록 삭제
   const clearSearchHistory = async () => {
    try {
      if (user) { // 로그인 사용자: DB에서 검색 기록 삭제
        const { error } = await supabase
          .from('search_history')
          .delete()
          .eq('uid', user.id);
        
        if (error) throw error;
      } else { // 비로그인 사용자: localStorage에서 검색 기록 삭제
        localStorage.removeItem('searchHistory');
      }
      return true;
    } catch (error) { 
      console.error('검색 기록 삭제 실패:', error);
      return false;
    }
  };

  // 컴포넌트가 처음 렌더링될 때, 또는 user가 변경될 때 설정 불러오기
  useEffect (() => {
    fetchUserSettings();
  }, [user]);
  
  // 이 훅을 사용하는 컴포넌트에게 제공할 값들과 함수들
  return {
    settings, // 현재 설정값들
    loading, // 로딩 상태
    updateSetting, // 설정 업데이트 함수
    toggleSearchHistorySetting, // 검색어 저장 토글 함수
    clearSearchHistory, // 검색 기록 삭제 함수
    fetchUserSettings // 설정 다시 불러오기 함수
  };
};