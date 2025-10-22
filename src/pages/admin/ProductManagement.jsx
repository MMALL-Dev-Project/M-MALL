import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@config/supabase";
import { useAdminAuth } from "@hooks/useAdminAuth";
import Pagination from '@components/common/Pagination';
import { getThumbnailSrc } from "@/utils/image";
import './ProductManagement.css';

const ProductManagement = () => {
  const navigate = useNavigate();

  // 상품 목록 및 페이지네이션
  const [productList, setProductList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // 정렬 상태 추가
  const [sortBy, setSortBy] = useState('pid');
  const [sortOrder, setSortOrder] = useState('desc');

  // 데이터 로드
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // 상품 목록 조회 (브랜드 정보 포함)
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
					*,
					brands(bid, name),
					categories(cid, name),
          sub_categories(scid, name),
					product_skus(stock_qty),
          order_items(oid)
				`)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (productsError) {
        console.error('상품 조회 에러:', productsError);
        return;
      }

      setProductList(products || []);
    } catch (e) {
      console.error('데이터 로드 에러:', e);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder]);

  // 관리자 권한 체크 + 데이터 로드
  useAdminAuth(fetchData);

  // 정렬 변경 시 데이터 재로드
  useEffect(() => {
    fetchData();
  }, [sortBy, sortOrder]);

  // 상품 이미지 삭제
  const deleteProductImages = async (pid) => {
    try {
      // thumbnails/pid 폴더의 모든 파일 삭제
      const { data: thumbFiles } = await supabase.storage
        .from('products')
        .list(`thumbnails/${pid}`);

      if (thumbFiles && thumbFiles.length > 0) {
        const thumbPaths = thumbFiles.map(file => `thumbnails/${pid}/${file.name}`);
        await supabase.storage
          .from('products')
          .remove(thumbPaths);
      }

      // details/pid 폴더의 모든 파일 삭제
      const { data: detailFiles } = await supabase.storage
        .from('products')
        .list(`details/${pid}`);

      if (detailFiles && detailFiles.length > 0) {
        const detailPaths = detailFiles.map(file => `details/${pid}/${file.name}`);
        await supabase.storage
          .from('products')
          .remove(detailPaths);
      }
    } catch (error) {
      console.error('이미지 삭제 오류:', error);
    }
  };

  const deleteProduct = async (pid) => {
    try {
      // SKU 삭제
      const { error: skuError } = await supabase
        .from('product_skus')
        .delete()
        .eq('pid', pid);

      if (skuError) throw skuError;

      // 이미지 삭제 (pid 폴더 전체)
      await deleteProductImages(pid);

      // 상품 삭제
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('pid', pid);

      if (productError) throw productError;

      alert('상품이 삭제되었습니다.');
      fetchData();
    } catch (error) {
      console.error('상품 삭제 오류:', error);
      alert('상품 삭제에 실패했습니다.');
    }
  };

  // 페이지네이션
  const itemPerPage = 10;
  const totalItems = productList.length;
  const totalPages = Math.ceil(totalItems / itemPerPage);

  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemPerPage;
    const endIndex = startIndex + itemPerPage;
    return productList.slice(startIndex, endIndex);
  }, [productList, currentPage]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, []);

  // 상품 삭제 핸들러
  const handleDelete = (pid) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      deleteProduct(pid);
    }
  };

  // 정렬 변경 핸들러
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1); // 정렬 변경 시 첫 페이지로
  };

  const handleOrderChange = (e) => {
    setSortOrder(e.target.value);
    setCurrentPage(1); // 정렬 변경 시 첫 페이지로
  };

  // 총 재고 계산
  const getTotalStock = (product) => {
    if (!product.product_skus || product.product_skus.length === 0) return 0;
    return product.product_skus.reduce((sum, sku) => sum + (sku.stock_qty || 0), 0);
  };

  // 총 주문 개산
  const getTotalOrder = (product) => {
    if (!product.order_items || product.order_items.length === 0) return 0;
    return product.order_items.length || 0;
  }

  // 상품 추가 페이지로 이동
  const handleAddProduct = () => {
    navigate('/admin/products/new');
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div id="product-admin" className="admin-wrap">
      <h2 className="product-admin-title admin-title">
        <div>
          상품 관리
          <button className="btn-product-add" onClick={handleAddProduct}>
            상품 추가 +
          </button>
        </div>
        {/* 정렬 옵션 */}
        <div className="sort-controls">
          <select value={sortBy} onChange={handleSortChange} className="form-select" style={{ width: 'auto' }}>
            <option value="pid">ID</option>
            <option value="name">상품명</option>
            <option value="price">가격</option>
            <option value="created_at">생성일</option>
          </select>
          <select value={sortOrder} onChange={handleOrderChange} className="form-select" style={{ width: 'auto' }}>
            <option value="desc">내림차순</option>
            <option value="asc">오름차순</option>
          </select>
        </div>
      </h2>


      <div className="brand-admin-container">
        <table className="admin-table product-admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>이미지</th>
              <th>상품명</th>
              <th>브랜드</th>
              <th>카테고리</th>
              <th>가격</th>
              <th>포인트</th>
              <th>재고</th>
              <th>주문</th>
              <th>상태</th>
              <th>생성일</th>
              <th>상세보기</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {currentProducts.map(product => (
              <tr key={product.pid} className="product-admin-card">
                <td>{product.pid}</td>
                <td className="thumb">
                  <img
                    src={getThumbnailSrc(product.thumbnail_url)}
                    alt={product.name}
                    className=""
                    onError={(e) => { e.target.src = '/default-image.png'; }}
                  />
                </td>
                <td className="name">{product.name}</td>
                <td>{product.brands?.name || '-'}</td>
                <td>
                  {product.categories?.name
                    ? `${product.categories.name}${product.sub_categories?.name ? ` > ${product.sub_categories.name}` : ''}`
                    : '-'}
                </td>

                <td>{product.price?.toLocaleString()}원</td>
                <td>{product.point_rate}%</td>
                <td>{getTotalStock(product)}</td>
                <td>{getTotalOrder(product)}</td>
                <td className="badge">
                  <span className={`active-badge ${product.is_active}`}>
                    {product.is_active ? "활성" : "비활성"}
                  </span>
                </td>
                <td>{new Date(product.created_at).toLocaleDateString('ko-KR')}</td>
                <td className="page-btn">
                  <button
                    onClick={() => navigate(`/product/${product.pid}`)} className="btn-detail">
                    상세보기
                  </button>
                </td>
                <td className="manage-btn">
                  <button
                    onClick={() => navigate(`/admin/products/edit/${product.pid}`)}
                    className="btn-edit">
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(product.pid)}
                    className="btn-delete">
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          itemsPerPage={itemPerPage}
        />
      </div>
    </div>
  );
};

export default ProductManagement;