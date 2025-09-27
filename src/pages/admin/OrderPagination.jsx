import React from 'react';
import './OrderPagination.css';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems, 
  itemsPerPage 
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page) => {
    onPageChange(page);
  };

  // 페이지 번호 생성 (최대 5개 표시)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="pagination-container">
      <div className="pagination-controls">
        <button 
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="pagination-btn pagination-prev"
        >
          이전
        </button>
        
        {getPageNumbers().map(page => (
          <button
            key={page}
            onClick={() => handlePageClick(page)}
            className={`pagination-btn pagination-number ${
              currentPage === page ? 'active' : ''
            }`}
          >
            {page}
          </button>
        ))}
        
        <button 
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="pagination-btn pagination-next"
        >
          다음
        </button>
      </div>
    </div>
  );
};

export default Pagination;