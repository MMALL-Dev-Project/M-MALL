import {useState} from 'react';
import { supabase } from '../../config/supabase';

export const useNotices = () => {
    const [notices, setNotices] = useState([]);
    const [selectedNotice, setSelectedNotice] = useState(null);

    //공지사항 목록 가져오기
    const fetchNotices = async () => {
        try {
        
            const {data, error} = await supabase
                .from('notices')
                .select('*')
                .eq('is_active', true)
                .order("is_important", {ascending: false})
                .order('created_at', {ascending: false});

            if (error) throw error;

            setNotices(data || []);
            return {success: true, data};
        }   catch(err) {
            console.error('공지사항 목록 가져오기 실패:', err);
            return {success: false, error: err.message};
        }  
    };

    //특정 공지사항 가져오기
    const fetchNoticeDetail = async (noticeId) => {
        try {

            const {data, error} = await supabase
                .from('notices')
                .select('*')
                .eq('nid', noticeId)
                .eq('is_active', true)
                .single();

            if (error) throw error;

            setSelectedNotice(data);
            return {success: true, data};
        }   catch(err) {
            console.error('공지사항 상세 조회 오류:', err);
            return {success: false, error: err.message};
        }  
    };

    //공지사항 추가

    const createNotice = async (noticeData) => {
        try {

            const {data, error} = await supabase
                .from('notices')
                .insert([{
                    title: noticeData.title,
                    content: noticeData.content,
                    is_important: noticeData.is_important || false,
                    is_active: true
                }])
                .select()
                .single();

            if (error) throw error;

            return {success: true, data};
        }   catch(err) {
            console.error('공지사항 추가 오류:',err);
            return {success: false, error: err.message};
        }  
    };

    //공지사항 수정
    const updateNotice = async (noticeId, noticeData) => {
        try {

            const {data, error} = await supabase
                .from('notices')
                .update({
                    title: noticeData.title,
                    content: noticeData.content,
                    is_important: noticeData.is_important || false,
                    updated_at: new Date().toISOString()
                })
                .eq('nid', noticeId)
                .select()
                .single();

            if (error) throw error;

            return {success: true, data};
        }   catch(err) {
            console.error('공지사항 수정 오류:', err);
            return {success: false, error: err.message};
        }   
    };

    //공지사항 삭제
    const deleteNotice = async (noticeId) => {
        try {
            const {data, error} = await supabase
                .from('notices')
                .delete()
                .eq('nid', noticeId)
                .select()
                .single();

            if (error) throw error;

            return {success: true, data};
        }   catch(err) {
            console.error('공지사항 삭제 오류:', err);
            return {success: false, error: err.message};
        }  
    };

    //상태 초기화
    const resetNotices = () => {
        setNotices([]);
        setSelectedNotice(null);
    };

    return {
        notices,
        selectedNotice,
        fetchNotices,
        fetchNoticeDetail,
        createNotice,
        updateNotice,
        deleteNotice,
        resetNotices
    };
};