import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@config/supabase';
import { useCheckAdmin } from "@hooks/useAdminAuth";

import ProductInfo from '@components/products/product-detail/ProductInfo';
import ProductReview from '@components/products/product-detail/ProductReview';
import ProductInquiry from '@components/products/product-detail/ProductInquiry';
import '@components/products/product-detail/ProductDetail.css';
import { useNavigate } from 'react-router-dom';

const ProductDetail = () => {
    const { pid } = useParams(); // URL 파라미터에서 상품 pid 추출
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true); // 초기값을 true로 변경
    const [error, setError] = useState(null);
    const isAdmin = useCheckAdmin();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);

                // pid로 상품 정보 조회 (카테고리, 브랜드 정보도 함께 조회)
                const { data: productData, error: productError } = await supabase
                    .from('products')
                    .select(`
                        *,
                        brands(name, bid),
                        categories(name, cid, slug),
                        sub_categories(name, scid, slug)
                    `)
                    .eq('pid', pid)
                    .single();

                if (productError) {
                    setError('상품을 찾을 수 없습니다.');
                    return;
                }

                setProduct(productData);

            } catch (error) {
                console.error('상품 데이터 로드 에러:', error);
                setError('상품 정보를 불러오는 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        if (pid) {
            fetchProduct();
        }
    }, [pid]);

    if (!loading && product?.is_active === false && isAdmin !== true) {

        alert('판매중지된 상품입니다.');
        setTimeout(() => {
            navigate('/');
        }, 0);
        return null;
    }


    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p style={{ textAlign: 'center', color: 'red' }}>{error}</p>;
    }

    // 상품이 없을 때 NotFound 페이지로 리다이렉트
    if (!product) {
        return <Navigate to="*" replace />;
    }

    return (
        <div id='product-detail-page'>
            {product?.is_active === false && isAdmin && (
                <div style={{ backgroundColor: '#f5f5f5', padding: '20px 0', textAlign: 'center', color: '#666' }}>비활성 상품 입니다.</div>
            )}
            {/* 상품 정보 및 상세페이지 */}
            <ProductInfo product={product} />
            {/* 상품 문의 */}
            <ProductInquiry product={product} />
            {/* 상품 후기 */}
            <ProductReview product={product} />
        </div>
    );
};

export default ProductDetail;