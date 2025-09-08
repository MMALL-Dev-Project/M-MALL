import React from 'react';

const ProductInquiry = ({ product }) => {
    // console.log("상품 pid:", product.pid);
    if (!product) {
        return <div>Loading...</div>;
    }
    return (
        <div className='product-inquiry'>

            <h4>평점 및 상품평 (0)</h4>
            {/* 상품 문의 */}
        </div>
    );
};

export default ProductInquiry;