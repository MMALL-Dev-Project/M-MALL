import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@config/supabase";
import { useAdminAuth } from "@hooks/useAdminAuth";
import { getLogoSrc } from "@utils/image";
import Pagination from '@components/common/Pagination';
import "./BrandManagement.css";

const BrandManagement = () => {
	const navigate = useNavigate();

	// 브랜드 목록 및 페이지네이션
	const [brandList, setBrandList] = useState([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [loading, setLoading] = useState(true);

	// 모달 관련
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		name: ''
	})

	// 이미지 처리
	const [selectedFile, setSelectedFile] = useState(null);
	const [previewImage, setPreviewImage] = useState('');

	// 브랜드 데이터 로드(메모이제이션)
	const fetchData = useCallback(async () => {
		try {
			setLoading(true);

			let brandsQuery = supabase
				.from('brands')
				.select(`
            *, 
            products(*)
          `);

			const { data: brands, error: brandsError } = await brandsQuery
				.order('bid', { ascending: false });

			if (brandsError) {
				console.error('브랜드 조회 에러:', brandsError);
				return;
			}
			setBrandList(brands || []);
		} catch (e) {
			console.error('데이터 로드 에러:', e);
		} finally {
			setLoading(false);
		}
	}, []);

	// 관리자 권한 체크 + 데이터 로드
	useAdminAuth(fetchData);

	// 브랜드 이름 중복 체크 
	const checkDuplicateBrandName = (name) => {
		return brandList.some(brand =>
			brand.name.toLowerCase().trim() === name.toLowerCase().trim()
		);
	};

	// 브랜드 로고 이미지 선택 
	const handleImageChange = (e) => {
		const file = e.target.files[0];

		if (file) {
			// 파일 타입 검증
			if (!file.type.startsWith('image/')) {
				alert('이미지 파일만 업로드 가능합니다.');
				return;
			}
			// 파일 크기 검증 
			if (file.size > 5 * 1024 * 1024) {
				alert('파일 크기는 5MB 이하여야 합니다.');
				return;
			}

			setSelectedFile(file);

			// 미리보기 이미지 생성 
			const reader = new FileReader();
			reader.onloadend = () => {
				setPreviewImage(reader.result);
			};
			reader.readAsDataURL(file);

		}
	}

	// 브랜드 로고 업로드
	const uploadBrandLogo = async () => {
		if (!selectedFile) return null;
		try {
			const fileExt = selectedFile.name.split('.').pop();
			const fileName = `${Date.now()}.${fileExt}`;

			const { error: uploadError } = await supabase.storage
				.from('brand-logos')
				.upload(fileName, selectedFile, { upsert: true });

			if (uploadError) throw uploadError;

			const { data: { publicUrl } } = supabase.storage
				.from('brand-logos')
				.getPublicUrl(fileName);

			return publicUrl;

		} catch (error) {
			console.error('이미지 업로드 오류:', error);
			alert('이미지 업로드에 실패했습니다.');
			return null;
		}
	}

	const handleSubmit = async (e) => {
		e.preventDefault();

		// 유효성 검사 
		if (!formData.name.trim()) {
			alert('브랜드명을 입력해주세요.');
			return;
		}

		// 중복 체크
		if (checkDuplicateBrandName(formData.name)) {
			alert('이미 존재하는 브랜드명입니다.');
			return;
		}

		try {
			setSubmitting(true);

			// 이미지 업로드 (선택한 경우만)
			let logoUrl = null;
			if (selectedFile) {
				logoUrl = await uploadBrandLogo();
				if (!logoUrl) {
					// 업로드 실패시 중단
					setSubmitting(false);
					return;
				}
			}
			// 브랜드 데이터 DB에 저장
			const { data, error } = await supabase
				.from('brands')
				.insert([
					{
						name: formData.name.trim(),
						logo_url: logoUrl,
						is_active: true,
						like_count: 0
					}
				])
				.select();

			if (error) throw error;

			alert('브랜드가 추가되었습니다.');
			closeModalAndReset();
			fetchData();

		} catch (error) {
			console.error('브랜드 생성 오류:', error);
			alert('브랜드 추가에 실패했습니다.');
		} finally {
			setSubmitting(false);
		}
	}

	// 브랜드 로고 삭제 
	const deleteBrandLogo = async (logoUrl) => {
		if (!logoUrl) return;

		try {
			const filePath = logoUrl.split("/").pop();
			const { error } = await supabase.storage
				.from('brand-logos')
				.remove([filePath]);

			if (error) {
				alert('이미지 삭제를 실패했습니다.');
				return;
			};
		} catch (error) {
			console.error('이미지 삭제 오류:', error);
		}
	}

	// 브랜드 삭제 
	const deleteBrand = async (bid) => {
		try {
			const brand = brandList.find(b => b.bid === bid);

			// 유효성 검사
			if (!brand) {
				alert('브랜드 정보를 찾을 수 없습니다.');
				return;
			}

			// 상품 있으면 삭제 불가
			if (brand?.products?.length > 0) {
				alert('상품이 등록된 브랜드는 삭제할 수 없습니다.');
				return;
			}

			if (brand.logo_url) {
				await deleteBrandLogo(brand.logo_url);
			}

			const { error } = await supabase
				.from('brands')
				.delete()
				.eq('bid', bid);

			if (error) throw error;

			alert('브랜드가 삭제되었습니다.');
			fetchData();
		} catch (error) {
			console.error('브랜드 삭제 오류 :', error);
			alert('브랜드 삭제에 실패했습니다.');
		}
	};

	// 모달 닫고 전체 초기화 
	const closeModalAndReset = () => {
		setIsModalOpen(false);
		setFormData({ name: '' });
		setSelectedFile(null);
		setPreviewImage('');
		setSubmitting(false);
	};

	// 브랜드 생성 모달 열기
	const openBrandAddModal = () => {
		closeModalAndReset();
		setIsModalOpen(true);
	}

	// 모달 닫기 + 초기화 
	const closeModal = () => {
		if (selectedFile || formData.name) {
			if (confirm('입력한 내용이 사라집니다. 취소하시겠습니까?')) {
				closeModalAndReset();
			}
		} else {
			closeModalAndReset();
		}
	}

	// 폼 입력 핸들러
	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
	}

	// 페이지네이션
	const itemPerPage = 10;
	const totalItems = brandList.length;
	const totalPages = Math.ceil(totalItems / itemPerPage);

	const currentBrands = useMemo(() => {
		const startIndex = (currentPage - 1) * itemPerPage;
		const endIndex = startIndex + itemPerPage;
		return brandList.slice(startIndex, endIndex);
	}, [brandList, currentPage]);

	// 페이지네이션 핸들러
	const handlePageChange = useCallback((page) => {
		setCurrentPage(page);
		window.scrollTo(0, 0);
	}, [])

	// 페이지 상단으로
	useEffect(() => {
		window.scrollTo(0, 0);
	}, []);

	// 브랜드 수정
	const handleEdit = (bid) => {
		navigate(`/brand/${bid}/edit`);
	};

	// 브랜드 삭제
	const handleDelete = (bid) => {
		if (window.confirm('정말 삭제하시겠습니까?')) {
			deleteBrand(bid);
		}
	};

	if (loading) {
		return <div>Loading...</div>
	}

	return (
		<div id="brand-admin" className="admin-wrap">
			<h2 className="brand-admin-title admin-title">
				<div>브랜드 관리
					<button className="btn-brnad-add" onClick={openBrandAddModal}>브랜드 추가 +</button>
				</div>
			</h2>
			<div> </div>
			<div className="brand-admin-container">
				<table className="admin-table brand-admin-table">
					<thead>
						<tr>
							<th>ID</th>
							<th>로고</th>
							<th>브랜드명</th>
							<th>상품수</th>
							<th>좋아요수</th>
							<th>상태</th>
							<th>생성일</th>
							<th>페이지</th>
							<th colSpan={2}>관리</th>
						</tr>
					</thead>
					<tbody>
						{currentBrands.map(brand => (
							<tr key={brand.bid} className="brand-admin-card">
								<td>{brand.bid}</td>
								<td className="logo">
									<img
										src={getLogoSrc(brand.logo_url)}
										alt={brand.name}
										className="brand-logo-img"
									/>
								</td>
								<td className="name">
									{brand.name}
								</td>
								<td>{brand.products.length}</td>
								<td>{brand.like_count}</td>
								<td className="badge">
									<span className={`active-badge ${brand.is_active}`}>
										{brand.is_active === true || brand.is_active === "true" ? "활성" : "비활성"}
									</span>
								</td>
								<td>{new Date(brand.created_at).toLocaleDateString('ko-KR')}</td>
								<td className="page-btn">
									<button
										onClick={() => navigate(`/brand/${brand.bid}`)} className="btn-detail">
										상세보기
									</button>
								</td>
								<td className="manage-btn">
									<button
										onClick={() => handleEdit(brand.bid)} className="btn-edit">
										수정
									</button>
									<button
										onClick={() => handleDelete(brand.bid)} className="btn-delete">
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

			{/* 브랜드 추가 모달 */}
			{isModalOpen && (
				<div className="modal-overlay" onClick={closeModal}>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h3 className="admin-title">브랜드 추가</h3>
							<button className="modal-close" onClick={closeModal}>×</button>
						</div>

						<form className="modal-form" onSubmit={handleSubmit}>
							<div className="form-group">
								<label htmlFor="brand-name">브랜드명</label>
								<input
									id="brand-name"
									type="text"
									name="name"
									value={formData.name}
									onChange={handleInputChange}
									placeholder="브랜드명을 입력하세요"
									required
								/>
							</div>
							{/* 이미지 업로드 영역 */}
							<div className="form-group">
								<label htmlFor="brand-logo-input">로고 이미지</label>
								{/* 미리보기 */}
								{previewImage && (
									<div className="image-preview">
										<img src={previewImage} alt="미리보기" />
									</div>
								)}
								<input
									type="file"
									id="brand-logo-input"
									accept="image/*"
									onChange={handleImageChange}
									style={{ display: 'none' }}
								/>
								<button
									type="button"
									className="btn"
									onClick={() => document.getElementById('brand-logo-input').click()}
								>
									{selectedFile ? '이미지 변경' : '이미지 선택'}
								</button>
							</div>
							<div className="modal-actions">
								<button type="submit" className="btn btn-submit">
									생성
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}

export default BrandManagement;