import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@config/supabase";
import { useAdminAuth } from "@hooks/useAdminAuth";
import Pagination from '@components/common/Pagination';
import "./ContentManagement.css";

const ContentManagement = () => {
  const navigate = useNavigate();

  const [bannerList, setBannerList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: 'MAIN_VISUAL',
    title: '',
    description: '',
    link_url: '', // 클릭 시 이동할 링크
    display_order: 0, // 표시 순서
    is_active: true  // 활성화 여부
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('content_banners')
        .select('*');

      if (selectedType !== 'ALL') {
        query = query.eq('type', selectedType);
      }

      const { data, error } = await query
        .order('id', { ascending: false });

      if (error) {
        console.error('배너 조회 에러:', error);
        return;
      }

      setBannerList(data || []);
    } catch (e) {
      console.error('데이터 로드 에러:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  useAdminAuth(fetchData);

  useEffect(() => {
    fetchData();
  }, [selectedType, fetchData]);

  // 이미지 파일 선택 핸들러
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }

      setSelectedFile(file);

      // FileReader: 파일을 읽는 브라우저 API
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Supabase Storage에 이미지 업로드
  const uploadBannerImage = async () => {
    if (!selectedFile) return null;

    try {
      // 파일 확장자 추출 'image.jpg' -> ['image', 'jpg'] -> 'jpg'
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      // Supabase Storage에 업로드
      const { error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(fileName, selectedFile, {
          upsert: true  // 같은 이름 파일이 있으면 덮어쓰기
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(fileName);

      return publicUrl;

    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      alert('이미지 업로드에 실패했습니다.');
      return null;
    }
  };

  // 배너 추가
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('배너 제목을 입력해주세요.');
      return;
    }

    if (!selectedFile) {
      alert('이미지를 선택해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const imageUrl = await uploadBannerImage();

      if (!imageUrl) {
        setSubmitting(false);
        return;
      }

      const { data, error } = await supabase
        .from('content_banners')
        .insert([
          {
            type: formData.type,
            title: formData.title.trim(),
            description: formData.description.trim(),
            image_url: imageUrl,
            link_url: formData.link_url.trim(),
            display_order: formData.display_order,
            is_active: formData.is_active
          }
        ])
        .select();

      if (error) throw error;

      alert('배너가 추가되었습니다.');
      closeModalAndReset();
      fetchData();

    } catch (error) {
      console.error('배너 생성 오류:', error);
      alert('배너 추가에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // Storage에서 이미지 삭제
  const deleteBannerImage = async (imageUrl) => {
    if (!imageUrl) return;

    try { // URL에서 파일명 추출
      const filePath = imageUrl.split("/").pop();
      const { error } = await supabase.storage
        .from('content-images')
        .remove([filePath]); // 배열로 전달 (여러 파일 동시 삭제 가능)

      if (error) {
        console.error('이미지 삭제 실패:', error);
      }
    } catch (error) {
      console.error('이미지 삭제 오류:', error);
    }
  };

  // 배너 삭제 함수
  const deleteBanner = async (id) => {
    try {
      const banner = bannerList.find(b => b.id === id);

      if (!banner) { // 배너가 없으면 종료
        alert('배너 정보를 찾을 수 없습니다.');
        return;
      }

      if (banner.image_url) { // Storage에서 이미지 먼저 삭제
        await deleteBannerImage(banner.image_url);
      }
      // DB에서 배너 삭제
      const { error } = await supabase
        .from('content_banners')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('배너가 삭제되었습니다.');
      fetchData();
    } catch (error) {
      console.error('배너 삭제 오류:', error);
      alert('배너 삭제에 실패했습니다.');
    }
  };

  // 배너 순서 업데이트 함수
  const updateDisplayOrder = async (id, newOrder) => {
    try {
      const order = parseInt(newOrder);

      if (isNaN(order) || order < 0) {
        alert('0 이상의 숫자를 입력해주세요.');
        return;
      }

      const { error } = await supabase
        .from('content_banners')
        .update({
          display_order: order,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      fetchData();
    } catch (error) {
      console.error('순서 업데이트 오류:', error);
      alert('순서 변경에 실패했습니다.');
    }
  };

  // 모달 닫고 전체 초기화
  const closeModalAndReset = () => {
    setIsModalOpen(false);
    setFormData({
      type: 'MAIN_VISUAL',
      title: '',
      description: '',
      link_url: '',
      display_order: 0,
      is_active: true
    });
    setSelectedFile(null);
    setPreviewImage('');
    setSubmitting(false);
  };

  // 배너 추가 모달 열기
  const openBannerAddModal = () => {
    closeModalAndReset(); // 이전 데이터 정리
    setIsModalOpen(true);
  };

  // 모달 닫기 (취소)
  const closeModal = () => {
    if (selectedFile || formData.title) {
      if (window.confirm('입력한 내용이 사라집니다. 취소하시겠습니까?')) {
        closeModalAndReset();
      }
    } else {
      closeModalAndReset();
    }
  };

  // 폼 입력 변경
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev, // 기존 데이터 유지 (checkbox면 checked 값, 아니면 value 값 사용)
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 페이지네이션 설정
  const itemPerPage = 10;
  const totalItems = bannerList.length;
  const totalPages = Math.ceil(totalItems / itemPerPage);

  const currentBanners = useMemo(() => {
    const startIndex = (currentPage - 1) * itemPerPage;
    const endIndex = startIndex + itemPerPage;
    return bannerList.slice(startIndex, endIndex);
  }, [bannerList, currentPage]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, []);

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  // 배너 활성화/비활성화 토글
  const toggleBannerStatus = async (id, currentStatus) => {
    try { // 상태 반대로 변경
      const { error } = await supabase
        .from('content_banners')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      fetchData();
    } catch (error) {
      console.error('상태 변경 오류:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
  }, [selectedType]);

  if (loading) {
    return <div>로딩 중...</div>;
  }

  // 배너 타입 한글 변환 함수
  const getTypeText = (type) => {
    const typeMap = {
      'MAIN_VISUAL': '메인 비주얼',
      'SHOWCASE': '쇼케이스',
      'EVENT': '이벤트',
      'PROMOTION': '프로모션'
    };
    return typeMap[type] || type;
  };

  return (
    <div id="content-admin" className="admin-wrap">
      <h2 className="content-admin-title admin-title">
        <div>
          컨텐츠 관리
          <button className="btn-content-add" onClick={openBannerAddModal}>
            배너 추가 +
          </button>
        </div>
      </h2>
      {/* 타입 필터 버튼들 */}
      <div className="type-filter">
        <button
          className={selectedType === 'ALL' ? 'active' : ''}
          onClick={() => handleTypeChange('ALL')}
        >
          전체
        </button>
        <button
          className={selectedType === 'MAIN_VISUAL' ? 'active' : ''}
          onClick={() => handleTypeChange('MAIN_VISUAL')}
        >
          메인 비주얼
        </button>
        <button
          className={selectedType === 'SHOWCASE' ? 'active' : ''}
          onClick={() => handleTypeChange('SHOWCASE')}
        >
          쇼케이스
        </button>
        <button
          className={selectedType === 'EVENT' ? 'active' : ''}
          onClick={() => handleTypeChange('EVENT')}
        >
          이벤트
        </button>
        <button
          className={selectedType === 'PROMOTION' ? 'active' : ''}
          onClick={() => handleTypeChange('PROMOTION')}
        >
          프로모션
        </button>
      </div>

      {/* 배너 목록 테이블 */}
      <div className="content-admin-container">
        <table className="admin-table content-admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>이미지</th>
              <th>타입</th>
              <th>제목</th>
              <th>링크</th>
              <th>순서</th>
              <th>상태</th>
              <th>생성일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {currentBanners.map(banner => (
              <tr key={banner.id} className="content-admin-card">
                <td>{banner.id}</td>
                <td className="banner-image">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="banner-thumbnail"
                  />
                </td>
                <td>{getTypeText(banner.type)}</td>
                <td className="title">{banner.title}</td>
                <td className="link">{banner.link_url || '-'}</td>
                <td>
                  <input
                    type="number"
                    value={banner.display_order}
                    onChange={(e) => updateDisplayOrder(banner.id, e.target.value)}
                    min="0"
                    style={{
                      width: '60px',
                      padding: '5px',
                      border: '1px solid #ddd',
                      textAlign: 'center'
                    }}
                  />
                </td>
                <td className="badge">
                  <span
                    className={`active-badge ${banner.is_active}`}
                    onClick={() => toggleBannerStatus(banner.id, banner.is_active)}
                    style={{ cursor: 'pointer' }}
                  >
                    {banner.is_active ? "활성" : "비활성"}
                  </span>
                </td>
                <td>{new Date(banner.created_at).toLocaleDateString('ko-KR')}</td>
                <td className="manage-btn">
                  <button
                    onClick={() => window.confirm('정말 삭제하시겠습니까?') && deleteBanner(banner.id)}
                    className="btn-delete"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* 페이지네이션 */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          itemsPerPage={itemPerPage}
        />
      </div>
      {/* 배너 추가 모달 */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="admin-title">배너 추가</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              {/* 배너 타입 선택 */}
              <div className="form-group">
                <label htmlFor="banner-type">배너 타입</label>
                <select
                  id="banner-type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="MAIN_VISUAL">메인 비주얼</option>
                  <option value="SHOWCASE">쇼케이스</option>
                  <option value="EVENT">이벤트</option>
                  <option value="PROMOTION">프로모션</option>
                </select>
              </div>
              {/* 배너 제목 */}
              <div className="form-group">
                <label htmlFor="banner-title">배너 제목</label>
                <input
                  id="banner-title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="배너 제목을 입력하세요"
                  required
                />
              </div>
              {/* 배너 설명 */}
              <div className="form-group">
                <label htmlFor="banner-description">배너 설명</label>
                <textarea
                  id="banner-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="배너 설명을 입력하세요 (선택사항)"
                  rows="3"
                />
              </div>
              {/* 링크 URL */}
              <div className="form-group">
                <label htmlFor="banner-link">링크 URL</label>
                <input
                  id="banner-link"
                  type="text"
                  name="link_url"
                  value={formData.link_url}
                  onChange={handleInputChange}
                  placeholder="/products 또는 https://example.com"
                />
              </div>
              {/* 표시 순서 */}
              <div className="form-group">
                <label htmlFor="banner-order">표시 순서</label>
                <input
                  id="banner-order"
                  type="number"
                  name="display_order"
                  value={formData.display_order}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              {/* 활성화 여부 */}
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  활성화
                </label>
              </div>
              {/* 이미지 업로드 */}
              <div className="form-group">
                <label htmlFor="banner-image-input">배너 이미지</label>
                {previewImage && (
                  <div className="image-preview">
                    <img src={previewImage} alt="미리보기" />
                  </div>
                )}
                <input
                  type="file"
                  id="banner-image-input"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn"
                  onClick={() => document.getElementById('banner-image-input').click()}
                >
                  {selectedFile ? '이미지 변경' : '이미지 선택'}
                </button>
              </div>
              {/* 제출 버튼 */}
              <div className="modal-actions">
                <button
                  type="submit"
                  className="btn btn-submit"
                  disabled={submitting}
                >
                  {submitting ? '추가 중...' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;