import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const renderPageNumbers = () => {
    const totalPageCount = Math.max(1, totalPages); // Ensure totalPages is at least 1
    
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPageCount, currentPage + 1);
    
    // Adjust start and end page if we're at the boundaries
    if (endPage - startPage + 1 < 3 && totalPageCount > 2) {
      if (currentPage === 1) {
        endPage = Math.min(3, totalPageCount);
      } else if (currentPage === totalPageCount) {
        startPage = Math.max(1, totalPageCount - 2);
      }
    }
    
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const handlePageClick = (page) => {
    if (page !== '...' && page !== currentPage) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-1">
      <button
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded ${
          currentPage === 1
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        &laquo;
      </button>
      
      {renderPageNumbers().map((page, index) => (
        <button
          key={index}
          onClick={() => handlePageClick(page)}
          disabled={page === '...'}
          className={`px-3 py-1 rounded ${
            page === currentPage
              ? 'bg-primary text-white'
              : page === '...'
              ? 'bg-gray-200 text-gray-500 cursor-default'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {page}
        </button>
      ))}
      
      <button
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded ${
          currentPage === totalPages
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        &raquo;
      </button>
    </div>
  );
};

export default Pagination; 