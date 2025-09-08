import React from 'react';

const ProductReview = ({ product }) => {
    // console.log("상품 pid:", product.pid);
    if (!product) {
        return <div>Loading...</div>;
    }

    return (
        <div className="product-review">
            <h4>상품 리뷰 (0)</h4>
            {/* 리뷰 목록 */}
            <p>아직 리뷰가 없습니다.</p>
        </div>
    );
};

export default ProductReview;