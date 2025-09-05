import React from 'react';

const ProductDetail = () => {
    // Placeholder product data
    const product = {
        id: 1,
        name: 'Sample Product',
        description: 'This is a detailed description of the product.',
        price: 19900,
        image: 'https://via.placeholder.com/300x300.png?text=Product+Image',
    };

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
            <img
                src={product.image}
                alt={product.name}
                style={{ width: '100%', borderRadius: 8, marginBottom: 16 }}
            />
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <h3>{product.price.toLocaleString()}원</h3>
            <button style={{ padding: '10px 24px', fontSize: 16, marginTop: 16 }}>
                장바구니 담기
            </button>
        </div>
    );
};

export default ProductDetail;