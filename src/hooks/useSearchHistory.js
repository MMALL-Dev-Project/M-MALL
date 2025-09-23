import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useUserSettings } from './useUserSettings';

export const useSearchHistory = () => {
  const { user } = useAuth();
  const { settings } = useUserSettings();
  
  const [searchHistory, setSearchHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  //***** 검색어 저장 함수 *****
  const saveSearchKeyword = async (keyword) => {
    if (!keyword.trim()) return; // 빈 검색어는 저장 x
    
    // 검색어 저장 설정 off→ 저장x
    if (!settings.save_search_history) {
      console.log('검색어 저장 설정이 꺼져있습니다.');
      return;
    }

    try {
      if (user) {// 중복된 검색어가 있으면 먼저 삭제 (최신으로 올리기 위해)
        await supabase
          .from('search_history')
          .delete()
          .eq('uid', user.id)
          .eq('keyword', keyword.trim());

        // 새로운 검색어 DB 저장
        const { error } = await supabase
          .from('search_history')
          .insert({
            uid: user.id,
            keyword: keyword.trim()
          });
        
        if (error) throw error;
        
        await fetchSearchHistory();
      } else { // 비회원: localStorage에 저장
        const localHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        // 새 검색어를 맨 앞에 추가, 중복 제거, 최대 5개까지 저장
        const newHistory = [
          keyword.trim(),
          ...localHistory.filter(item => item !== keyword.trim())
        ].slice(0, 5);
        
        // localStorage에 저장
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
        setSearchHistory(newHistory);
      }
    } catch (error) {
      console.error('검색어 저장 실패:', error);
    }
  };

  //***** 검색 기록 불러오는 함수 *****
  const fetchSearchHistory = async () => { // 검색어 저장 설정 off→ 빈 배열 반환(화면에 안 보임)
    if (!settings.save_search_history) {
      setSearchHistory([]);
      return;
    }

    setLoading(true); // 로딩 시작
    
    try {
      if (user) {
        const { data, error } = await supabase
          .from('search_history')
          .select('keyword, created_at')
          .eq('uid', user.id)
          .order('created_at', { ascending: false }) // 최신순 정렬
          .limit(5); // 최대 5개
        
        if (error) throw error;
        
        // 검색어만 추출해서 배열로 만들기
        setSearchHistory(data.map(item => item.keyword));
      } else { // 비회원
        const localHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        setSearchHistory(localHistory);
      }
    } catch (error) {
      console.error('검색 기록 조회 실패:', error);
    } finally {
      setLoading(false); // 로딩 종료
    }
  };

  //***** 개별 검색어 삭제 함수 *****
  const deleteSearchKeyword = async (keyword) => {
    try {
      if (user) {
        const { error } = await supabase
          .from('search_history')
          .delete()
          .eq('uid', user.id)
          .eq('keyword', keyword);
        
        if (error) throw error;
      } else { // 비회원
        const localHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        const newHistory = localHistory.filter(item => item !== keyword);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      }
      
      // 화면에서도 해당 검색어 제거
      setSearchHistory(prev => prev.filter(item => item !== keyword));
    } catch (error) {
      console.error('검색어 삭제 실패:', error);
    }
  };

  //***** 모든 검색 기록 삭제 함수 *****
  const clearAllSearchHistory = async () => {
    try {
      if (user) {
        const { error } = await supabase
          .from('search_history')
          .delete()
          .eq('uid', user.id);
        
        if (error) throw error;
      } else {
        localStorage.removeItem('searchHistory');
      }
      
      // 화면 상태도 빈 배열로 초기화
      setSearchHistory([]);
    } catch (error) {
      console.error('검색 기록 전체 삭제 실패:', error);
    }
  };

  useEffect(() => {
    fetchSearchHistory();
  }, [user, settings.save_search_history]); // user나 검색 설정이 바뀌면 다시 실행

  // 이 훅을 사용하는 컴포넌트에게 제공할 값들과 함수들
  return {
    // 현재 검색 기록 목록 (설정에 따라 빈 배열이거나 실제 기록)
    searchHistory: settings.save_search_history ? searchHistory : [], 
    loading,
    saveSearchKeyword, // 검색어 저장 함수
    deleteSearchKeyword, // 개별 검색어 삭제 함수
    clearAllSearchHistory, // 전체 검색 기록 삭제 함수
    fetchSearchHistory, // 검색 기록 다시 불러오기 함수
    isSearchHistoryEnabled: settings.save_search_history // 검색어 저장 설정 상태
  };
};