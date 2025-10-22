import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../config/supabase';
import './ProductInquiry.css'

const ProductInquiry = ({ product }) => {
    const navigate = useNavigate();
    const { user, userInfo } = useAuth();
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    const isAdmin = userInfo?.role === 'admin';

    useEffect(() => {
        if (product?.pid) {
            loadProductInquiries();
        }
    }, [product?.pid]);

    const loadProductInquiries = async () => {
        try {
            setLoading(true);

            const { data: inquiriesData, error: inquiriesError } = await supabase
                .from('inquiries')
                .select('*')
                .eq('pid', product.pid)
                .eq('type', 'PRODUCT')
                .order('created_at', { ascending: false });

            if (inquiriesError) throw inquiriesError;

            const inquiriesWithUserInfo = await Promise.all(
                inquiriesData.map(async (inquiry) => {
                    const { data: userInfo, error: userError } = await supabase
                        .from('user_info')
                        .select('name, user_id')
                        .eq('id', inquiry.uid)
                        .maybeSingle();

                    if (userError) {
                        console.error('사용자 정보 조회 오류:', userError);
                    }

                    return {
                        ...inquiry,
                        user_info: userInfo
                    };
                })
            );

            setInquiries(inquiriesWithUserInfo || []);
        } catch (error) {
            console.error('상품 문의 조회 오류:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInquiryClick = () => {
        window.scrollTo(0, 0);
        navigate('/support/inquiries', {
            state: {
                productInfo: {
                    pid: product.pid,
                    name: product.name,
                    brand: product.brands?.name,
                    thumbnail: product.thumbnail_url
                }
            }
        });
    };

    const toggleExpand = (inquiry) => {
        // 비밀글 체크
        if (inquiry.is_private && !canViewInquiry(inquiry)) {
            alert('비밀글입니다.');
            return;
        }

        // 비밀글이지만 로그인 안 한 경우
        if (inquiry.is_private && !user) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        setExpandedId(expandedId === inquiry.iid ? null : inquiry.iid);
    };

    const canViewInquiry = (inquiry) => {
        if (!inquiry.is_private) return true; // 일반글은 모두 볼 수 있음
        if (!user) return false; // 비밀글인데 로그인 안 함
        if (isAdmin) return true; // 관리자는 모든 비밀글 볼 수 있음
        return inquiry.uid === user.id; // 본인 글만 볼 수 있음
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };

    if (!product) {
        return <div>Loading...</div>;
    }

    return (
        <div className='product-inquiry'>
            <div className="inquiry-header">
                <p>상품문의 ({inquiries.length})</p>
                <button
                    className="btn-inquiry"
                    onClick={handleInquiryClick}
                >
                    문의하기
                </button>
            </div>

            {loading ? (
                <div className="inquiry-loading">로딩 중...</div>
            ) : inquiries.length === 0 ? (
                <div className="inquiry-empty">
                    <p>아직 등록된 문의가 없습니다.</p>
                    <p className="inquiry-hint">상품에 대해 궁금한 점을 문의해주세요.</p>
                </div>
            ) : (
                <div className="inquiry-list">
                    {inquiries.map((inquiry) => (
                        <div key={inquiry.iid} className="product-inquiry-item">
                            <div
                                className="inquiry-item-header"
                                onClick={() => toggleExpand(inquiry)}
                            >
                                <div className="inquiry-header-left">
                                    <span className="inquiry-label">
                                        {inquiry.status === 'ANSWERED' ? '답변완료' : '답변대기'}
                                    </span>
                                    {inquiry.is_private && (
                                        <span className="inquiry-private-icon">🔒</span>
                                    )}
                                    <span className={`inquiry-title-preview ${inquiry.is_private && !canViewInquiry(inquiry) ? 'is-private' : ''}`}>
                                        {inquiry.is_private && !canViewInquiry(inquiry)
                                            ? '비밀글입니다.'
                                            : inquiry.title
                                        }
                                    </span>
                                </div>
                                <div className="inquiry-header-right">
                                    <span className="inquiry-author">
                                        {inquiry.user_info?.user_id?.substring(0, 3)}*** · {formatDate(inquiry.created_at)}
                                    </span>
                                    <span className={`inquiry-toggle ${expandedId === inquiry.iid ? 'expanded' : ''}`}>
                                        {expandedId === inquiry.iid ? '∧' : '∨'}
                                    </span>
                                </div>
                            </div>

                            {expandedId === inquiry.iid && canViewInquiry(inquiry) && (
                                <div className="inquiry-item-content">
                                    <div className="inquiry-content-text">
                                        {inquiry.content}
                                    </div>

                                    {inquiry.images && inquiry.images.length > 0 && (
                                        <div className="inquiry-images">
                                            {inquiry.images.map((imageUrl, index) => (
                                                <img
                                                    key={index}
                                                    src={imageUrl}
                                                    alt={`문의 이미지 ${index + 1}`}
                                                    className="inquiry-image"
                                                    onClick={() => window.open(imageUrl, '_blank')}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {inquiry.admin_answer && (
                                        <div className="inquiry-answer">
                                            <div className="answer-header">
                                                <span className="answer-icon">└</span>
                                                <span className="answer-label">판매자답변</span>
                                            </div>
                                            <div className="answer-content">{inquiry.admin_answer}</div>
                                            <div className="answer-date">
                                                {formatDate(inquiry.answered_at)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductInquiry;