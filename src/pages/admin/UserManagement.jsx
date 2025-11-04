import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@config/supabase";
import { useAdminAuth } from "@hooks/useAdminAuth";
import Pagination from '@components/common/Pagination';
import "./UserManagement.css";

const UserManagement = () => {
  const navigate = useNavigate();

  // 기본 프로필 이미지 상수 추가
  const DEFAULT_AVATAR = 'https://csitasavsenhjprwwdup.supabase.co/storage/v1/object/public/user-profiles/default-avatar.png';

  // 프로필 이미지 가져오는 헬퍼 함수 추가
  const getProfileImageSrc = (profileImage) => {
    if (!profileImage || profileImage === 'default.jpg' || profileImage === "'default.jpg'" || profileImage.includes('default')) {
      return DEFAULT_AVATAR;
    }
    return profileImage;
  };

  const [userList, setUserList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  // 선택된 회원 및 상세 정보
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 선택된 회원의 데이터
  const [userOrders, setUserOrders] = useState([]);
  const [userInquiries, setUserInquiries] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'inquiries', 'reviews'

  // 검색
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchType, setSearchType] = useState('all'); // 'all', 'name', 'email', 'phone'

  // 회원 데이터 로드
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      // 전체 회원 수 카운트
      let countQuery = supabase
        .from('user_info')
        .select('*', { count: 'exact', head: true });

      // 검색어가 있으면 필터 적용
      if (searchKeyword.trim()) {
        if (searchType === 'all') {
          // 전체 검색: 이름, 이메일, 전화번호 모두 검색
          countQuery = countQuery.or(`name.ilike.%${searchKeyword}%,email.ilike.%${searchKeyword}%,phone.ilike.%${searchKeyword}%`);
        } else if (searchType === 'name') {
          countQuery = countQuery.ilike('name', `%${searchKeyword}%`);
        } else if (searchType === 'email') {
          countQuery = countQuery.ilike('email', `%${searchKeyword}%`);
        } else if (searchType === 'phone') {
          countQuery = countQuery.ilike('phone', `%${searchKeyword}%`);
        }
      }

      const { count } = await countQuery;
      setTotalUsers(count || 0);

      // 페이지네이션 적용하여 회원 데이터 가져오기
      const startIndex = (currentPage - 1) * itemsPerPage;

      let usersQuery = supabase
        .from('user_info')
        .select('*')
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + itemsPerPage - 1);

      // 검색 필터 적용
      if (searchKeyword.trim()) {
        if (searchType === 'all') {
          // 전체 검색: 이름, 이메일, 전화번호 모두 검색
          usersQuery = usersQuery.or(`name.ilike.%${searchKeyword}%,email.ilike.%${searchKeyword}%,phone.ilike.%${searchKeyword}%`);
        } else if (searchType === 'name') {
          usersQuery = usersQuery.ilike('name', `%${searchKeyword}%`);
        } else if (searchType === 'email') {
          usersQuery = usersQuery.ilike('email', `%${searchKeyword}%`);
        } else if (searchType === 'phone') {
          usersQuery = usersQuery.ilike('phone', `%${searchKeyword}%`);
        }
      }

      const { data: usersData, error: usersError } = await usersQuery;

      if (usersError) {
        console.error('회원 조회 에러:', usersError);
        return;
      }

      setUserList(usersData || []);
    } catch (e) {
      console.error('데이터 로드 에러:', e);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchKeyword, searchType]);

  // 관리자 권한 체크 및 데이터 로드
  useAdminAuth(fetchUsers);

  // 검색어나 검색 타입이 변경되면 1페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, searchType]);

  // 페이지가 변경되면 데이터 다시 로드
  useEffect(() => {
    fetchUsers();
  }, [currentPage, fetchUsers]);

  // 회원 클릭 시 상세 정보 모달 열기
  const handleUserClick = async (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    setActiveTab('orders'); // 모달 열 때 주문 탭으로 초기화

    // 선택된 회원의 주문, 문의, 리뷰 데이터 로드
    await loadUserOrders(user.id);
    await loadUserInquiries(user.id);
    await loadUserReviews(user.id);
  };

  // 선택된 회원의 주문 내역 조회
  const loadUserOrders = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              name,
              thumbnail_url,
              brands (name)
            )
          )
        `)
        .eq('uid', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('주문 내역 조회 에러:', error);
        return;
      }

      setUserOrders(data || []);
    } catch (e) {
      console.error('주문 내역 로드 에러:', e);
    }
  };

  // 선택된 회원의 문의사항 조회
  const loadUserInquiries = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select(`
          *,
          products (
            name,
            thumbnail_url,
            brands (name)
          ),
          orders (
            oid,
            total_amount,
            created_at
          )
        `)
        .eq('uid', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('문의사항 조회 에러:', error);
        return;
      }

      setUserInquiries(data || []);
    } catch (e) {
      console.error('문의사항 로드 에러:', e);
    }
  };

  // 선택된 회원의 리뷰 조회
  const loadUserReviews = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          products (
            name,
            thumbnail_url,
            brands (name)
          )
        `)
        .eq('uid', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('리뷰 조회 에러:', error);
        return;
      }

      setUserReviews(data || []);
    } catch (e) {
      console.error('리뷰 로드 에러:', e);
    }
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setUserOrders([]);
    setUserInquiries([]);
    setUserReviews([]);
  };

  // 검색 실행
  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers();
  };

  // 검색어 입력 시 엔터키로 검색
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR').replace(/\. /g, '.').slice(0, -1);
  };

  // 금액 포맷팅
  const formatPrice = (price) => {
    return price?.toLocaleString() + '원';
  };

  // 주문 상태 한글 변환
  const getOrderStatusText = (status) => {
    const statusMap = {
      'PENDING': '결제대기',
      'PAID': '결제완료',
      'PREPARING': '배송준비중',
      'SHIPPED': '배송중',
      'DELIVERED': '배송완료',
      'CANCELLED': '취소됨',
      'RETURNED': '반품됨'
    };
    return statusMap[status] || status;
  };

  // 문의 상태 한글 변환
  const getInquiryStatusText = (status) => {
    const statusMap = {
      'PENDING': '답변대기',
      'ANSWERED': '답변완료'
    };
    return statusMap[status] || status;
  };

  // 문의 타입 한글 변환
  const getInquiryTypeText = (type) => {
    const typeMap = {
      'PRODUCT': '상품문의',
      'ORDER': '주문문의',
      'DELIVERY': '배송문의',
      'RETURN': '반품/교환',
      'ETC': '기타문의'
    };
    return typeMap[type] || type;
  };

  // 별점 렌더링
  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className="admin-wrap">
      {/* 페이지 제목 */}
      <div className="admin-title">
        <h2>회원 관리</h2>
      </div>

      {/* 검색 영역 */}
      <div className="user-search-section">
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          className="search-type-select"
        >
          <option value="all">전체</option>
          <option value="name">이름</option>
          <option value="email">이메일</option>
          <option value="phone">전화번호</option>
        </select>
        <input
          type="text"
          placeholder="검색어를 입력하세요"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="search-input"
        />
        <button onClick={handleSearch} className="btn-search">
          검색
        </button>
      </div>

      {/* 로딩 상태 */}
      {loading ? (
        <div className="loading-state">로딩 중...</div>
      ) : (
        <>
          {/* 회원 목록 테이블 */}
          <div className="admin-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>프로필</th>
                  <th>이름</th>
                  <th>아이디</th>
                  <th>이메일</th>
                  <th>전화번호</th>
                  <th>포인트</th>
                  <th>등급</th>
                  <th>가입일</th>
                </tr>
              </thead>
              <tbody>
                {userList.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                      회원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  userList.map((user, index) => (
                    <tr
                      key={user.id}
                      onClick={() => handleUserClick(user)}
                      style={{ cursor: 'pointer' }}
                      className="user-row"
                    >
                      <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td>
                        <img
                          src={getProfileImageSrc(user.profile_image)}
                          alt={user.name}
                          className="user-profile-image"
                        />
                      </td>
                      <td>{user.name}</td>
                      <td>{user.user_id}</td>
                      <td>{user.email}</td>
                      <td>{user.phone}</td>
                      <td>{formatPrice(user.points_balance)}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role === 'admin' ? '관리자' : '일반회원'}
                        </span>
                      </td>
                      <td>{formatDate(user.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalUsers > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalUsers / itemsPerPage)}
              onPageChange={setCurrentPage}
              totalItems={totalUsers}
              itemsPerPage={itemsPerPage}
            />
          )}
        </>
      )}

      {/* 회원 상세 정보 모달 */}
      {isModalOpen && selectedUser && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content user-detail-modal" onClick={(e) => e.stopPropagation()}>
            {/* 모달 헤더 */}
            <div className="modal-header">
              <h2>회원 상세 정보</h2>
              <button onClick={handleCloseModal} className="btn-close">
                ×
              </button>
            </div>

            {/* 회원 기본 정보 */}
            <div className="user-basic-info">
              <img
                src={getProfileImageSrc(selectedUser.profile_image)}
                alt={selectedUser.name}
                className="user-detail-profile"
              />
              <div className="user-info-details">
                <h3>{selectedUser.name}</h3>
                <p>아이디: {selectedUser.user_id}</p>
                <p>이메일: {selectedUser.email}</p>
                <p>전화번호: {selectedUser.phone}</p>
                <p>주소: {selectedUser.address || '-'}</p>
                <p>생년월일: {selectedUser.birth_date ? formatDate(selectedUser.birth_date) : '-'}</p>
                <p>포인트: {formatPrice(selectedUser.points_balance)}</p>
                <p>등급: {selectedUser.role === 'admin' ? '관리자' : '일반회원'}</p>
                <p>가입일: {formatDate(selectedUser.created_at)}</p>
              </div>
            </div>

            {/* 탭 메뉴 */}
            <div className="user-detail-tabs">
              <button
                className={activeTab === 'orders' ? 'tab-button active' : 'tab-button'}
                onClick={() => setActiveTab('orders')}
              >
                주문내역 ({userOrders.length})
              </button>
              <button
                className={activeTab === 'inquiries' ? 'tab-button active' : 'tab-button'}
                onClick={() => setActiveTab('inquiries')}
              >
                문의내역 ({userInquiries.length})
              </button>
              <button
                className={activeTab === 'reviews' ? 'tab-button active' : 'tab-button'}
                onClick={() => setActiveTab('reviews')}
              >
                리뷰내역 ({userReviews.length})
              </button>
            </div>

            {/* 탭 컨텐츠 */}
            <div className="tab-content">
              {/* 주문 내역 탭 */}
              {activeTab === 'orders' && (
                <div className="orders-list">
                  {userOrders.length === 0 ? (
                    <p className="empty-message">주문 내역이 없습니다.</p>
                  ) : (
                    userOrders.map((order) => (
                      <div key={order.oid} className="order-item">
                        <div className="order-header">
                          <span className="order-date">{formatDate(order.created_at)}</span>
                          <span className={`order-status ${order.status}`}>
                            {getOrderStatusText(order.status)}
                          </span>
                        </div>
                        <div className="order-products">
                          {order.order_items && order.order_items.map((item) => (
                            <div key={item.oiid} className="order-product">
                              <img
                                src={item.products?.thumbnail_url}
                                alt={item.product_name}
                                className="product-thumbnail"
                              />
                              <div className="product-info">
                                <p className="brand-name">{item.products?.brands?.name}</p>
                                <p className="product-name">{item.product_name}</p>
                                <p className="product-quantity">수량: {item.quantity}개</p>
                              </div>
                              <div className="product-price">
                                {formatPrice(item.line_subtotal)}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="order-total">
                          총 주문금액: <strong>{formatPrice(order.total_amount)}</strong>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 문의 내역 탭 */}
              {activeTab === 'inquiries' && (
                <div className="inquiries-list">
                  {userInquiries.length === 0 ? (
                    <p className="empty-message">문의 내역이 없습니다.</p>
                  ) : (
                    userInquiries.map((inquiry) => (
                      <div key={inquiry.iid} className="inquiry-item">
                        <div className="inquiry-header">
                          <span className="inquiry-type">{getInquiryTypeText(inquiry.type)}</span>
                          <span className={`inquiry-status ${inquiry.status}`}>
                            {getInquiryStatusText(inquiry.status)}
                          </span>
                          <span className="inquiry-date">{formatDate(inquiry.created_at)}</span>
                        </div>
                        <h4 className="inquiry-title">{inquiry.title}</h4>
                        <p className="inquiry-content">{inquiry.content}</p>
                        {inquiry.products && (
                          <div className="inquiry-product">
                            <img
                              src={inquiry.products.thumbnail_url}
                              alt={inquiry.products.name}
                              className="product-thumbnail-small"
                            />
                            <span>{inquiry.products.brands?.name} - {inquiry.products.name}</span>
                          </div>
                        )}
                        {inquiry.admin_answer && (
                          <div className="admin-answer">
                            <strong>관리자 답변:</strong>
                            <p>{inquiry.admin_answer}</p>
                            <span className="answer-date">
                              {formatDate(inquiry.answered_at)} - {inquiry.answered_by}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 리뷰 내역 탭 */}
              {activeTab === 'reviews' && (
                <div className="reviews-list">
                  {userReviews.length === 0 ? (
                    <p className="empty-message">리뷰 내역이 없습니다.</p>
                  ) : (
                    userReviews.map((review) => (
                      <div key={review.rid} className="review-item">
                        <div className="review-header">
                          <span className="review-rating">{renderStars(review.rating)}</span>
                          <span className="review-date">{formatDate(review.created_at)}</span>
                        </div>
                        {review.products && (
                          <div className="review-product">
                            <img
                              src={review.products.thumbnail_url}
                              alt={review.products.name}
                              className="product-thumbnail-small"
                            />
                            <span>{review.products.brands?.name} - {review.products.name}</span>
                          </div>
                        )}
                        <p className="review-content">{review.content}</p>
                        {review.images && review.images.length > 0 && (
                          <div className="review-images">
                            {review.images.map((image, index) => (
                              <img
                                key={index}
                                src={image}
                                alt={`리뷰 이미지 ${index + 1}`}
                                className="review-image"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;