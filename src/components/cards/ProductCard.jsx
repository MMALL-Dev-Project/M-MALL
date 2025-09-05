import React from 'react';

const ProductCard = ({ product }) => {
    if (!product) return null;

    return (
        <div className="product-card">
            <img
                src={product.image}
                alt={product.name}
                className="product-card__image"
            />
            <div className="product-card__info">
                <h3 className="product-card__name">{product.name}</h3>
                <p className="product-card__price">${product.price}</p>
                <p className="product-card__description">{product.description}</p>
            </div>
        </div>
    );
};

export default ProductCard;