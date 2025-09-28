import { useState, useEffect } from 'react';
import { supabase } from '@config/supabase';
import { useAuth } from '@contexts/AuthContext';

export const useLike = ({
	targetType,
	targetId,
	initialLikeCount = 0
}) => {
	const { user } = useAuth();
	const [liked, setLiked] = useState(false);
	const [likeCount, setLikeCount] = useState(initialLikeCount);
	const [loading, setLoading] = useState(false);

	// 좋아요 상태 조회
	useEffect(() => {
		if (!user || !targetId) return;

		const fetchLikeStatus = async () => {
			try {
				setLoading(true);

				// targetType에 따른 조건 설정
				let query = supabase
					.from('likes')
					.select('*')
					.eq('target_type', targetType)
					.eq('uid', user.id)
					.order('created_at', { ascending: true })
					.maybeSingle();

				// targetType에 따라 적절한 ID 컬럼으로 필터링
				if (targetType === 'PRODUCT') {
					query = query.eq('pid', targetId);
				} else if (targetType === 'BRAND') {
					query = query.eq('bid', targetId);
				}

				const { data, error } = await query;

				if (!error && data) {
					setLiked(true);
				} else {
					setLiked(false);
				}
			} catch (error) {
				console.error('좋아요 상태 조회 에러:', error);
				setLiked(false);
			} finally {
				setLoading(false);
			}
		};

		fetchLikeStatus();
	}, [user, targetType, targetId]);

	// 좋아요 토글 함수
	const toggleLike = async () => {
		if (!user) {
			alert('로그인이 필요합니다.');
			return false;
		}

		if (!targetId) {
			console.error('Target ID가 없습니다.');
			return false;
		}

		try {
			setLoading(true);

			if (liked) {
				// 좋아요 취소
				let deleteQuery = supabase
					.from('likes')
					.delete()
					.eq('target_type', targetType)
					.eq('uid', user.id);

				// targetType에 따라 적절한 ID 컬럼으로 필터링
				if (targetType === 'PRODUCT') {
					deleteQuery = deleteQuery.eq('pid', targetId);
				} else if (targetType === 'BRAND') {
					deleteQuery = deleteQuery.eq('bid', targetId);
				}

				const { error } = await deleteQuery;

				if (error) throw error;

				setLiked(false);
				setLikeCount(prev => Math.max(0, prev - 1));
				return false;
			} else {
				// 좋아요 추가
				const insertData = {
					target_type: targetType,
					uid: user.id
				};

				// targetType에 따라 적절한 ID 설정
				if (targetType === 'PRODUCT') {
					insertData.pid = targetId;
					insertData.bid = null;
				} else if (targetType === 'BRAND') {
					insertData.bid = targetId;
					insertData.pid = null;
				}

				const { error } = await supabase
					.from('likes')
					.insert(insertData);

				if (error) throw error;

				setLiked(true);
				setLikeCount(prev => prev + 1);
				return true;
			}
		} catch (error) {
			console.error('좋아요 토글 에러:', error);
			alert('좋아요 처리 중 오류가 발생했습니다.');
			return null;
		} finally {
			setLoading(false);
		}
	};

	return {
		liked,
		likeCount,
		loading,
		toggleLike
	};
};