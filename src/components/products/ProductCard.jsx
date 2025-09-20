import React from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getThumbnailSrc } from "../../utils/image";
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const isSoldout = product.is_soldout;

  const navigate = useNavigate();
  return (
    <li className={`product-card ${isSoldout ? 'soldout' : ''}`} onClick={() => navigate(`/product/${product.pid}`)}>
      <div className='photo'>
        <img src={getThumbnailSrc(product.thumbnail_url)} alt={product.name + " 썸네일"} />
      </div>
      {product.brands && product.brands.bid ? (
        <Link className='brand' to={`/brand/${product.brands.bid}`}>
          {product.brands.name}
        </Link>
      )
        : (

          <p className='brand'>{product.sub_categories?.name || product.categories?.name || ''}</p>
        )
      }
      <p className='name'>{product.name}</p>
      <p className='price'>{product.price.toLocaleString('ko-KR')} 원</p>
      <p className='mpoint'>최대 {product.point_rate}% M포인트</p>
      {isSoldout && (
        <div className='soldout-tag'>
          <span>품절</span>
        </div>
      )}
    </li>
  );
};

export default ProductCard;