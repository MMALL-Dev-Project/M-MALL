import React from 'react';
import { Link } from 'react-router-dom';
import { getThumbnailSrc } from "../../utils/image";
import './ProductCard.css';

const ProductCard = ({ product }) => {
  return (
    <li className='product-card'>
      <Link to={`/product/${product.pid}`}>
      <div className='photo'>
        <img src={getThumbnailSrc(product.thumbnail_url)} alt={product.name + " 썸네일"} />
      </div>
        <p className='brand'>브랜드 {product.bid}</p>
        <p className='name'>{product.name}</p>
        <p className='price'>{product.price.toLocaleString('ko-KR')} 원</p>
        <p className='mpoint'>최대 {product.point_rate}% M포인트</p>
      </Link>
    </li>
  );
};

export default ProductCard;