import { useState, useMemo } from "react";
import ProductCard from "@components/products/ProductCard";
import Pagination from "@components/common/Pagination";

const ProductList = ({
  products,
  itemPerPage = 15,
  emptyMessage = "상품이 없습니다."
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState('latest');

  // 상품 정렬 기능
  const sortedProducts = useMemo(() => {
    // 원본 상품 복사
    const sorted = [...products];

    return sorted.sort((a, b) => {

      // 1차 정렬: 품절 정렬 (true 를 뒤로)
      if (a.is_soldout != b.is_soldout) {
        return a.is_soldout ? 1 : -1;
      }

      // 2차 정렬: 선택된 정렬 옵션
      switch (sortOption) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'likes':
          return b.like_count - a.like_count;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'points':
          return b.point_rate - a.point_rate;
        case 'latest':
        default:
          return new Date(b.created_at) - new Date(a.created_at);

      }
    })
  }, [products, sortOption])


  // 상품목록 페이지네이션
  const totalItems = sortedProducts.length;
  const totalPages = Math.ceil(totalItems / itemPerPage);

  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemPerPage;
    const endIndex = startIndex + itemPerPage;
    return sortedProducts.slice(startIndex, endIndex);
  }, [sortedProducts, currentPage, itemPerPage]);

  // 정렬 핸들러
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    setCurrentPage(1);
  }

  // 페이지네이션 핸들러
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 상품이 없을 경우
  if (products.length === 0) {
    return (
      <p style={{ textAlign: 'center', marginTop: 50 }}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="product-list-wrap">
      <div className="product-list-sort">
        <select
          name="product-list-sort"
          value={sortOption}
          onChange={handleSortChange}
          className="select-common"
        >
          <option value="latest">최신 순</option>
          <option value="price-low">낮은 가격 순</option>
          <option value="price-high">높은 가격 순</option>
          <option value="likes">좋아요 순</option>
          <option value="name">가나다 순</option>
          <option value="points">포인트 순</option>
        </select>

      </div>
      <ul className='product-list'>
        {currentProducts.map(product => (
          <ProductCard key={product.pid} product={product} />
        ))}
      </ul>
      {totalPages > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          itemsPerPage={itemPerPage}
        />
      )}
    </div>
  );
};

export default ProductList