import React, { useState, useEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { supabase } from '@config/supabase';
import ReviewWriteModal from '@pages/review/ReviewWriteModal';
import './ProductReview.css';

const ProductReview = ({ product }) => {
    const { user } = useAuth();

    const [reviews, setReviews] = useState([]);
    const [photoReviews, setPhotoReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewStats, setReviewStats] = useState({
        totalCount: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });

    const [canWriteReview, setCanWriteReview] = useState(false);
    const [userOrderItem, setUserOrderItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 이미지 모달
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [allImages, setAllImages] = useState([]);

    // ✅ 포토리뷰 갤러리 모달
    const [photoGalleryModalOpen, setPhotoGalleryModalOpen] = useState(false);

    useEffect(() => {
        if (product?.pid) {
            loadReviews();
            loadPhotoReviews();
            loadReviewStats();

            if (user) {
                checkCanWriteReview();
            }
        }
    }, [product?.pid, user]);

    // 리뷰 목록 조회
    const loadReviews = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('pid', product.pid)
                .eq('is_visible', true)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            setReviews(data || []);
        } catch (error) {
            console.error('리뷰 조회 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    // 사진 리뷰만 따로 조회
    const loadPhotoReviews = async () => {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('pid', product.pid)
                .eq('is_visible', true)
                .not('images', 'is', null)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const allPhotos = [];
            data?.forEach(review => {
                if (review.images && review.images.length > 0) {
                    review.images.forEach(img => {
                        allPhotos.push({
                            url: img,
                            review: review
                        });
                    });
                }
            });

            setPhotoReviews(allPhotos);
        } catch (error) {
            console.error('사진 리뷰 조회 실패:', error);
        }
    };

    // 리뷰 통계 조회
    const loadReviewStats = async () => {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('rating')
                .eq('pid', product.pid)
                .eq('is_visible', true);

            if (error) throw error;

            const totalCount = data.length;
            const averageRating = totalCount > 0
                ? (data.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(1)
                : 0;

            const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            data.forEach(r => {
                distribution[r.rating]++;
            });

            setReviewStats({ totalCount, averageRating, ratingDistribution: distribution });
        } catch (error) {
            console.error('리뷰 통계 조회 실패:', error);
        }
    };

    // 리뷰 작성 가능 여부 확인
    const checkCanWriteReview = async () => {
        try {
            const { data: orderItems, error: itemError } = await supabase
                .from('order_items')
                .select(`
                    *,
                    orders!inner (
                        uid,
                        status
                    )
                `)
                .eq('pid', product.pid)
                .eq('orders.uid', user.id)
                .eq('orders.status', 'DELIVERED');

            if (itemError) throw itemError;

            if (orderItems.length === 0) {
                setCanWriteReview(false);
                return;
            }

            const { data: existingReview, error: reviewError } = await supabase
                .from('reviews')
                .select('rid')
                .eq('pid', product.pid)
                .eq('uid', user.id)
                .single();

            if (reviewError && reviewError.code !== 'PGRST116') throw reviewError;

            if (!existingReview) {
                setCanWriteReview(true);
                setUserOrderItem(orderItems[0]);
            } else {
                setCanWriteReview(false);
            }
        } catch (error) {
            console.error('리뷰 작성 가능 여부 확인 실패:', error);
        }
    };

    const handleWriteReview = () => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }
        setIsModalOpen(true);
    };

    // ✅ 포토 갤러리 모달에서 이미지 클릭
    const handlePhotoGalleryClick = (index) => {
        setCurrentImageIndex(index);
        setSelectedImage(photoReviews[index].url);
        const allPhotoUrls = photoReviews.map(p => p.url);
        setAllImages(allPhotoUrls);
        setPhotoGalleryModalOpen(false); // 갤러리 모달 닫기
        setImageModalOpen(true); // 이미지 확대 모달 열기
    };

    // 리뷰 아이템의 이미지 클릭
    const handleImageClick = (images, index) => {
        setAllImages(images);
        setCurrentImageIndex(index);
        setSelectedImage(images[index]);
        setImageModalOpen(true);
    };

    const handlePrevImage = () => {
        const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : allImages.length - 1;
        setCurrentImageIndex(newIndex);
        setSelectedImage(allImages[newIndex]);
    };

    const handleNextImage = () => {
        const newIndex = currentImageIndex < allImages.length - 1 ? currentImageIndex + 1 : 0;
        setCurrentImageIndex(newIndex);
        setSelectedImage(allImages[newIndex]);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR').replace(/\. /g, '.').slice(0, -1);
    };

    const maskName = (name) => {
        if (!name || name.length === 0) return '익명';

        if (name.length === 1) {
            return name;
        } else if (name.length === 2) {
            return name[0] + '*';
        } else {
            const firstChar = name[0];
            const lastChar = name[name.length - 1];
            const middleStars = '*'.repeat(name.length - 2);
            return firstChar + middleStars + lastChar;
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={star <= rating ? 'star filled' : 'star'}>
                        ★
                    </span>
                ))}
            </div>
        );
    };

    if (!product) {
        return <div>Loading...</div>;
    }

    if (loading) {
        return <div className="reviews-loading">리뷰를 불러오는 중...</div>;
    }

    return (
        <div className="product-review">
            {/* 헤더 */}
            <div className="review-header-section">
                <div className="review-title-with-stars">
                    <h4 id='review-title'>리뷰({reviewStats.totalCount})</h4>
                    <div className="header-rating">
                        {renderStars(Math.round(reviewStats.averageRating))}
                    </div>
                </div>
            </div>

            {/* ✅ 리뷰 통계 + 사진 갤러리 */}
            <div className="review-stats-gallery-container">
                {/* 리뷰 통계 (왼쪽) */}
                {reviewStats.totalCount > 0 && (
                    <div className="review-stats">
                        <div className="average-rating">
                            <span className="rating-number">{reviewStats.averageRating}</span>
                            {renderStars(Math.round(reviewStats.averageRating))}
                        </div>

                        <div className="rating-distribution">
                            {[5, 4, 3, 2, 1].map(rating => (
                                <div key={rating} className="rating-bar">
                                    <span className="rating-label">{rating}점</span>
                                    <div className="bar-container">
                                        <div
                                            className="bar-fill"
                                            style={{
                                                width: `${(reviewStats.ratingDistribution[rating] / reviewStats.totalCount) * 100}%`
                                            }}
                                        />
                                    </div>
                                    <span className="rating-count">
                                        {reviewStats.ratingDistribution[rating]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ✅ 사진 리뷰 갤러리 (오른쪽) - 6개만 표시 */}
                {photoReviews.length > 0 && (
                    <div id="photo-review-gallery">
                        {photoReviews.slice(0, 6).map((photo, idx) => (
                            <div 
                                key={idx} 
                                className={`photo-item ${idx === 5 && photoReviews.length > 6 ? 'more-overlay' : ''}`}
                                onClick={() => {
                                    if (idx === 5 && photoReviews.length > 6) {
                                        setPhotoGalleryModalOpen(true);
                                    } else {
                                        handlePhotoGalleryClick(idx);
                                    }
                                }}
                            >
                                <img src={photo.url} alt={`리뷰 사진 ${idx + 1}`} />
                                {idx === 5 && photoReviews.length > 6 && (
                                    <div className="more-overlay-content">
                                        <span className="more-text">더보기</span>
                                        <span className="more-count">+{photoReviews.length - 5}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 리뷰 작성 버튼 */}
            {canWriteReview && (
                <div className="write-review-section">
                    <button className="write-review-btn" onClick={handleWriteReview}>
                        리뷰 작성하기
                    </button>
                </div>
            )}

            {/* 리뷰 목록 */}
            <div className="reviews-list">
                {reviews.length > 0 ? (
                    reviews.map(review => (
                        <div key={review.rid} className="review-item">
                            <div className="review-header">
                                <div className="reviewer-info">
                                    <span className="reviewer-name">
                                        {maskName(review.author_name)}
                                    </span>
                                    {renderStars(review.rating)}
                                </div>
                                <span className="review-date">{formatDate(review.created_at)}</span>
                            </div>

                            <div className="review-content">
                                {review.title && <h5 className="review-title">{review.title}</h5>}
                                <p className="review-text">{review.content}</p>

                                {review.images && review.images.length > 0 && (
                                    <div className="review-images">
                                        {review.images.map((img, idx) => (
                                            <img
                                                key={idx}
                                                src={img}
                                                alt={`리뷰 이미지 ${idx + 1}`}
                                                onClick={() => handleImageClick(review.images, idx)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-reviews">
                        <p>아직 작성된 리뷰가 없습니다.</p>
                        {canWriteReview && <p>첫 번째 리뷰를 작성해보세요!</p>}
                    </div>
                )}
            </div>

            {/* 리뷰 작성 모달 */}
            {isModalOpen && userOrderItem && (
                <ReviewWriteModal
                    orderItem={userOrderItem}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        loadReviews();
                        loadPhotoReviews();
                        loadReviewStats();
                        checkCanWriteReview();
                        setIsModalOpen(false);
                    }}
                />
            )}

            {/* ✅ 포토리뷰 갤러리 모달 (전체 사진 보기) */}
            {photoGalleryModalOpen && (
                <div className="photo-gallery-modal-overlay" onClick={() => setPhotoGalleryModalOpen(false)}>
                    <div className="photo-gallery-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="photo-gallery-modal-header">
                            <h3>포토리뷰</h3>
                            <button className="photo-gallery-close" onClick={() => setPhotoGalleryModalOpen(false)}>
                                ✕
                            </button>
                        </div>
                        <div className="photo-gallery-grid">
                            {photoReviews.map((photo, idx) => (
                                <div 
                                    key={idx} 
                                    className="photo-gallery-item"
                                    onClick={() => handlePhotoGalleryClick(idx)}
                                >
                                    <img src={photo.url} alt={`리뷰 사진 ${idx + 1}`} />
                                </div>
                            ))}
                        </div>
                        <button 
                            className="photo-gallery-close-btn"
                            onClick={() => setPhotoGalleryModalOpen(false)}
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}

            {/* 이미지 확대 모달 */}
            {imageModalOpen && (
                <div className="image-modal-overlay" onClick={() => setImageModalOpen(false)}>
                    <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="image-modal-close" onClick={() => setImageModalOpen(false)}>
                            ✕
                        </button>

                        {allImages.length > 1 && (
                            <>
                                <button className="image-nav-btn prev" onClick={handlePrevImage}>
                                    ‹
                                </button>
                                <button className="image-nav-btn next" onClick={handleNextImage}>
                                    ›
                                </button>
                            </>
                        )}

                        <img src={selectedImage} alt="리뷰 이미지 크게 보기" />

                        {allImages.length > 1 && (
                            <div className="image-counter">
                                {currentImageIndex + 1} / {allImages.length}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductReview;