import React, { useState, useMemo } from "react";
import ProductCard from "@components/products/ProductCard";
import Pagination from "@components/common/Pagination";

const ProductList = ({
  products,
  itemPerPage = 15,
  emptyMessage = "상품이 없습니다."
}) => {
  // 상품목록 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = products.length;
  const totalPages = Math.ceil(totalItems / itemPerPage);

  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemPerPage;
    const endIndex = startIndex + itemPerPage;
    return products.slice(startIndex, endIndex);
  }, [products, currentPage, itemPerPage]);


  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (products.length === 0) {
    return (
      <p style={{ textAlign: 'center', marginTop: 50 }}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
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
    </>
  );
};

export default ProductList