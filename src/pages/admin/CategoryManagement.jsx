import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@config/supabase";
import { useAdminAuth } from "@hooks/useAdminAuth";
import Pagination from '@components/common/Pagination';
import "./CategoryManagement.css";

const CategoryManagement = () => {
  const navigate = useNavigate();

  const [categoryList, setCategoryList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    display_order: 0
  });

  // 서브카테고리 모달
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subModalMode, setSubModalMode] = useState('add');
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [selectedParentCategory, setSelectedParentCategory] = useState(null);
  
  const [subFormData, setSubFormData] = useState({
    name: '',
    slug: '',
    display_order: 0
  });

  // 카테고리 + 서브카테고리 조회
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          sub_categories(*)
        `)
        .order('display_order', { ascending: true })
        .order('cid', { ascending: true });

      if (error) {
        console.error('카테고리 조회 에러:', error);
        return;
      }

      // 서브카테고리도 정렬
      const sortedData = data.map(category => ({
        ...category,
        sub_categories: category.sub_categories?.sort((a, b) => 
          a.display_order - b.display_order || a.scid - b.scid
        ) || []
      }));

      setCategoryList(sortedData || []);
    } catch (e) {
      console.error('데이터 로드 에러:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useAdminAuth(fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 카테고리 추가
  const handleCategorySubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.slug.trim()) {
      alert('카테고리명과 Slug를 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);

      if (modalMode === 'add') {
        // 추가
        const { error } = await supabase
          .from('categories')
          .insert([
            {
              name: formData.name.trim(),
              slug: formData.slug.trim(),
              display_order: formData.display_order
            }
          ]);

        if (error) throw error;
        alert('카테고리가 추가되었습니다.');
      } else {
        // 수정
        const { error } = await supabase
          .from('categories')
          .update({
            name: formData.name.trim(),
            slug: formData.slug.trim(),
            display_order: formData.display_order,
            updated_at: new Date().toISOString()
          })
          .eq('cid', editingCategory.cid);

        if (error) throw error;
        alert('카테고리가 수정되었습니다.');
      }

      closeCategoryModal();
      fetchData();

    } catch (error) {
      console.error('카테고리 저장 오류:', error);
      alert(error.message || '카테고리 저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 카테고리 삭제
  const deleteCategory = async (cid) => {
    try {
      const category = categoryList.find(c => c.cid === cid);

      if (!category) {
        alert('카테고리 정보를 찾을 수 없습니다.');
        return;
      }

      // 서브카테고리가 있으면 삭제 불가
      if (category.sub_categories && category.sub_categories.length > 0) {
        alert('서브카테고리가 있는 카테고리는 삭제할 수 없습니다.\n먼저 서브카테고리를 삭제해주세요.');
        return;
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('cid', cid);

      if (error) throw error;

      alert('카테고리가 삭제되었습니다.');
      fetchData();
    } catch (error) {
      console.error('카테고리 삭제 오류:', error);
      alert('카테고리 삭제에 실패했습니다.');
    }
  };

  // 서브카테고리 추가
  const handleSubCategorySubmit = async (e) => {
    e.preventDefault();

    if (!subFormData.name.trim() || !subFormData.slug.trim()) {
      alert('서브카테고리명과 Slug를 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);

      if (subModalMode === 'add') {
        // 추가
        const { error } = await supabase
          .from('sub_categories')
          .insert([
            {
              cid: selectedParentCategory.cid,
              name: subFormData.name.trim(),
              slug: subFormData.slug.trim(),
              display_order: subFormData.display_order
            }
          ]);

        if (error) throw error;
        alert('서브카테고리가 추가되었습니다.');
      } else {
        // 수정
        const { error } = await supabase
          .from('sub_categories')
          .update({
            name: subFormData.name.trim(),
            slug: subFormData.slug.trim(),
            display_order: subFormData.display_order,
            updated_at: new Date().toISOString()
          })
          .eq('scid', editingSubCategory.scid);

        if (error) throw error;
        alert('서브카테고리가 수정되었습니다.');
      }

      closeSubCategoryModal();
      fetchData();

    } catch (error) {
      console.error('서브카테고리 저장 오류:', error);
      alert(error.message || '서브카테고리 저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 서브카테고리 삭제
  const deleteSubCategory = async (scid) => {
    try {
      const { error } = await supabase
        .from('sub_categories')
        .delete()
        .eq('scid', scid);

      if (error) throw error;

      alert('서브카테고리가 삭제되었습니다.');
      fetchData();
    } catch (error) {
      console.error('서브카테고리 삭제 오류:', error);
      alert('서브카테고리 삭제에 실패했습니다.');
    }
  };

  // 카테고리 모달 열기 (추가)
  const openCategoryAddModal = () => {
    setModalMode('add');
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      display_order: 0
    });
    setIsModalOpen(true);
  };

  // 카테고리 모달 열기 (수정)
  const openCategoryEditModal = (category) => {
    setModalMode('edit');
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      display_order: category.display_order
    });
    setIsModalOpen(true);
  };

  // 카테고리 모달 닫기
  const closeCategoryModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      display_order: 0
    });
    setSubmitting(false);
  };

  // 서브카테고리 모달 열기 (추가)
  const openSubCategoryAddModal = (parentCategory) => {
    setSubModalMode('add');
    setSelectedParentCategory(parentCategory);
    setEditingSubCategory(null);
    setSubFormData({
      name: '',
      slug: '',
      display_order: 0
    });
    setIsSubModalOpen(true);
  };

  // 서브카테고리 모달 열기 (수정)
  const openSubCategoryEditModal = (subCategory, parentCategory) => {
    setSubModalMode('edit');
    setSelectedParentCategory(parentCategory);
    setEditingSubCategory(subCategory);
    setSubFormData({
      name: subCategory.name,
      slug: subCategory.slug,
      display_order: subCategory.display_order
    });
    setIsSubModalOpen(true);
  };

  // 서브카테고리 모달 닫기
  const closeSubCategoryModal = () => {
    setIsSubModalOpen(false);
    setEditingSubCategory(null);
    setSelectedParentCategory(null);
    setSubFormData({
      name: '',
      slug: '',
      display_order: 0
    });
    setSubmitting(false);
  };

  // 폼 입력 변경
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubInputChange = (e) => {
    const { name, value } = e.target;
    setSubFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 페이지네이션
  const itemPerPage = 10;
  const totalItems = categoryList.length;
  const totalPages = Math.ceil(totalItems / itemPerPage);

  const currentCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * itemPerPage;
    const endIndex = startIndex + itemPerPage;
    return categoryList.slice(startIndex, endIndex);
  }, [categoryList, currentPage]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div id="category-admin" className="admin-wrap">
      <h2 className="category-admin-title admin-title">
        <div>
          카테고리 관리
          <button className="btn-category-add" onClick={openCategoryAddModal}>
            카테고리 추가 +
          </button>
        </div>
      </h2>

      <div className="category-admin-container">
        <table className="admin-table category-admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>카테고리명</th>
              <th>Slug</th>
              <th>순서</th>
              <th>서브카테고리</th>
              <th>생성일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {currentCategories.map(category => (
              <tr key={category.cid}>
                <td>{category.cid}</td>
                <td className="name">{category.name}</td>
                <td className="slug">{category.slug}</td>
                <td>{category.display_order}</td>
                <td>
                  <div className="sub-categories">
                    {category.sub_categories?.map(sub => (
                      <div key={sub.scid} className="sub-item">
                        <span>{sub.name} ({sub.slug})</span>
                        <div className="sub-actions">
                          <button 
                            onClick={() => openSubCategoryEditModal(sub, category)}
                            className="btn-edit-small"
                          >
                            수정
                          </button>
                          <button 
                            onClick={() => window.confirm('정말 삭제하시겠습니까?') && deleteSubCategory(sub.scid)}
                            className="btn-delete-small"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => openSubCategoryAddModal(category)}
                      className="btn-sub-add"
                    >
                      서브카테고리 추가 +
                    </button>
                  </div>
                </td>
                <td>{new Date(category.created_at).toLocaleDateString('ko-KR')}</td>
                <td className="manage-btn">
                  <button
                    onClick={() => openCategoryEditModal(category)}
                    className="btn-edit"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => window.confirm('정말 삭제하시겠습니까?') && deleteCategory(category.cid)}
                    className="btn-delete"
                  >
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

      {/* 카테고리 추가/수정 모달 */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeCategoryModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="admin-title">
                {modalMode === 'add' ? '카테고리 추가' : '카테고리 수정'}
              </h3>
              <button className="modal-close" onClick={closeCategoryModal}>×</button>
            </div>

            <form className="modal-form" onSubmit={handleCategorySubmit}>
              <div className="form-group">
                <label htmlFor="category-name">카테고리명</label>
                <input
                  id="category-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="예: 패션·뷰티"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category-slug">Slug (URL 경로)</label>
                <input
                  id="category-slug"
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="예: fashion-beauty"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category-order">표시 순서</label>
                <input
                  id="category-order"
                  type="number"
                  name="display_order"
                  value={formData.display_order}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="submit"
                  className="btn btn-submit"
                  disabled={submitting}
                >
                  {submitting ? '저장 중...' : (modalMode === 'add' ? '추가' : '수정')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 서브카테고리 추가/수정 모달 */}
      {isSubModalOpen && (
        <div className="modal-overlay" onClick={closeSubCategoryModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="admin-title">
                {subModalMode === 'add' ? '서브카테고리 추가' : '서브카테고리 수정'}
                {selectedParentCategory && ` - ${selectedParentCategory.name}`}
              </h3>
              <button className="modal-close" onClick={closeSubCategoryModal}>×</button>
            </div>

            <form className="modal-form" onSubmit={handleSubCategorySubmit}>
              <div className="form-group">
                <label htmlFor="sub-name">서브카테고리명</label>
                <input
                  id="sub-name"
                  type="text"
                  name="name"
                  value={subFormData.name}
                  onChange={handleSubInputChange}
                  placeholder="예: 여성의류"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="sub-slug">Slug (URL 경로)</label>
                <input
                  id="sub-slug"
                  type="text"
                  name="slug"
                  value={subFormData.slug}
                  onChange={handleSubInputChange}
                  placeholder="예: womens-clothing"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="sub-order">표시 순서</label>
                <input
                  id="sub-order"
                  type="number"
                  name="display_order"
                  value={subFormData.display_order}
                  onChange={handleSubInputChange}
                  min="0"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="submit"
                  className="btn btn-submit"
                  disabled={submitting}
                >
                  {submitting ? '저장 중...' : (subModalMode === 'add' ? '추가' : '수정')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;