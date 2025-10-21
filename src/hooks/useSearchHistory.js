import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useUserSettings } from './useUserSettings';

export const useSearchHistory = () => {
  const { user } = useAuth();
  const { settings } = useUserSettings();

  const [searchHistory, setSearchHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // settings 변경 감지
  const isSearchHistoryEnabled = settings?.save_search_history ?? true;

  //***** 인기 검색어 통계 업데이트 함수 *****
  const updatePopularKeywords = async (keyword) => {
    try {
      const { data: existing, error: selectError } = await supabase
        .from('popular_keywords')
        .select('*')
        .eq('keyword', keyword)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from('popular_keywords')
          .update({
            hourly_count: existing.hourly_count + 1,
            daily_count: existing.daily_count + 1,
            weekly_count: existing.weekly_count + 1,
            total_count: existing.total_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('keyword', keyword);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('popular_keywords')
          .insert({
            keyword,
            hourly_count: 1,
            daily_count: 1,
            weekly_count: 1,
            total_count: 1
          });

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('인기 검색어 통계 업데이트 실패:', error);
    }
  };

  //***** 검색어 저장 함수 *****
  const saveSearchKeyword = async (keyword) => {
    if (!keyword.trim()) return;

    try {
      await updatePopularKeywords(keyword.trim());

      if (!settings || settings.save_search_history === false) {
        return;
      }

      if (user) {
        await supabase
          .from('search_history')
          .delete()
          .eq('uid', user.id)
          .eq('keyword', keyword.trim());

        const { error } = await supabase
          .from('search_history')
          .insert({
            uid: user.id,
            keyword: keyword.trim()
          });

        if (error) throw error;

        await fetchSearchHistory();
      } else {
        const localHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        const newHistory = [
          keyword.trim(),
          ...localHistory.filter(item => item !== keyword.trim())
        ].slice(0, 5);

        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
        setSearchHistory(newHistory);
      }
    } catch (error) {
      console.error('검색어 저장 실패:', error);
    }
  };

  //***** 검색 기록 불러오는 함수 *****
  const fetchSearchHistory = async () => {
    if (!settings || settings.save_search_history === false) {
      setSearchHistory([]);
      return;
    }

    setLoading(true);

    try {
      if (user) {
        const { data, error } = await supabase
          .from('search_history')
          .select('keyword, created_at')
          .eq('uid', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        setSearchHistory(data.map(item => item.keyword));
      } else {
        const localHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        setSearchHistory(localHistory);
      }
    } catch (error) {
      console.error('검색 기록 조회 실패:', error);
    } finally {
      setLoading(false);
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
      } else {
        const localHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        const newHistory = localHistory.filter(item => item !== keyword);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      }

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

      setSearchHistory([]);
    } catch (error) {
      console.error('검색 기록 전체 삭제 실패:', error);
    }
  };

  // 검색 기록 불러오기 - settings 변경 시 다시 실행
  useEffect(() => {
    if (isSearchHistoryEnabled) {
      fetchSearchHistory();
    } else {
      setSearchHistory([]);
    }
  }, [isSearchHistoryEnabled, user]);

  return {// 현재 검색 기록 목록 (설정에 따라 빈 배열이거나 실제 기록)
    searchHistory: settings?.save_search_history ? searchHistory : [],
    loading,
    saveSearchKeyword,
    deleteSearchKeyword,
    clearAllSearchHistory,
    fetchSearchHistory,
    isSearchHistoryEnabled: settings?.save_search_history ?? true 
  };
};