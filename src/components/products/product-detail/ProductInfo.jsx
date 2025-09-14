import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../config/supabase';
import { useAuth } from "../../../contexts/AuthContext";
import { getThumbnailSrc } from "../../../utils/image";

const ProductInfo = ({ product }) => {
	// 사용자 정보
	const { user } = useAuth();
	const [userPoints, setUserPoints] = useState(0);

	// 옵션 및 SKU 상태
	const [selectedOptions, setSelectedOptions] = useState({});
	const [selectedSku, setSelectedSku] = useState(null);
	const [productSkus, setProductSkus] = useState([]);
	const [quantity, setQuantity] = useState(1);

	// 좋아요 상태
	const [likeCount, setLikeCount] = useState(product?.like_count || 0);
	const [liked, setLiked] = useState(false);

	const [loading, setLoading] = useState(false);


	// 상품 로딩 상태 처리
	if (!product) {
		return <div>Loading...</div>;
	}

	// 사용자 보유포인트 불러오기
	useEffect(() => {
		if (!user) return;

		const fetchUserPoints = async () => {
			try {
				setLoading(true);
				const { data, error } = await supabase
					.from('user_info')
					.select('points_balance')
					.eq('id', user.id)
					.single();

				setUserPoints(data?.points_balance || 0);
			} catch (error) {
				console.error('사용자 포인트 조회 에러:', error);
			} finally {
				setLoading(false);
			}
		};
		fetchUserPoints();
	}, []);

	// 좋아요 상태 불러오기
	useEffect(() => {
		if (!user) return;
		const fetchLikeStatus = async () => {
			try {
				const { data, error } = await supabase
					.from('likes')
					.select('*')
					.eq('pid', product.pid)
					.eq('target_type', 'PRODUCT')
					.eq('uid', user.id)
					.maybeSingle();

				// 좋아요 상태 설정
				if (!error && data) {
					setLiked(true);
				}

			} catch (error) {
				console.error('좋아요 상태 조회 에러:', error);
			}
		}
		fetchLikeStatus();
	}, [user, product.pid]);

	// SKU 데이터 불러오기
	useEffect(() => {
		const fetchProductSkus = async () => {
			try {
				setLoading(true);

				// 현재 상품의 활성화된 SKU만 조회
				const { data: skusData, error } = await supabase
					.from('product_skus')
					.select('*')
					.eq('pid', product.pid)
					.eq('is_active', true);

				setProductSkus(skusData || []);

				console.log(`PID ${product.pid}의 활성화된 SKU 데이터:`, skusData);
			} catch (error) {
				console.error('SKU 데이터 로드 에러:', error);
				setProductSkus([]);
			} finally {
				setLoading(false);
			}
		};

		if (product.pid) {
			fetchProductSkus();
		}
	}, [product.pid]);

	// 선택된 옵션에 맞는 SKU 찾기
	useEffect(() => {
		if (!productSkus.length || !Object.keys(selectedOptions).length) {
			setSelectedSku(null);
			return;
		}

		// product.option_types에 있는 모든 옵션이 선택되었는지 확인
		const requiredOptions = Object.keys(product.option_types || {});
		const allOptionsSelected = requiredOptions.every(optionType =>
			selectedOptions[optionType] && selectedOptions[optionType] !== ''
		);

		if (!allOptionsSelected) {
			setSelectedSku(null);
			return;
		}

		// 선택된 옵션 조합과 일치하는 SKU 찾기
		const matchingSku = productSkus.find(sku => {
			let skuOptions;

			// JSONB 데이터 파싱 처리
			if (typeof sku.options === 'string') {
				try {
					skuOptions = JSON.parse(sku.options);
				} catch (e) {
					console.error('SKU 옵션 파싱 에러:', e);
					return false;
				}
			} else {
				skuOptions = sku.options || {};
			}

			// 모든 필수 옵션이 일치하는지 확인
			return requiredOptions.every(optionType => {
				return skuOptions[optionType] === selectedOptions[optionType];
			});
		});

		if (matchingSku) {
			console.log('매칭된 SKU:', matchingSku.skid, matchingSku.options);
		}

		setSelectedSku(matchingSku || null);
	}, [selectedOptions, productSkus, product.option_types]);

	// 할인 가격 계산 함수
	const calculateDiscountPrice = (product, userPoints) => {
		if (!product || !product.point_rate) return 0;
		const maxPointUsage = Math.floor((product.price * product.point_rate) / 100);
		const discountedPrice = product.price - Math.min(userPoints, maxPointUsage);
		return discountedPrice;
	}

	// 옵션 선택 핸들러
	const handleOptionChange = (optionType, value) => {
		setSelectedOptions(prev => ({
			...prev,
			[optionType]: value
		}));
	};

	// 좋아요 토글 핸들러
	const handleLikeToggle = async () => {
		if (!user) {
			alert('로그인이 필요합니다.');
			return;
		}
		try {
			if (liked) {
				// 좋아요 취소
				const { error } = await supabase
					.from('likes')
					.delete()
					.eq('pid', product.pid)
					.eq('target_type', 'PRODUCT')
					.eq('uid', user.id);

				if (error) throw error;

				setLiked(false);
				setLikeCount(prev => Math.max(0, prev - 1));

			} else {
				// 좋아요 추가
				const { error } = await supabase
					.from('likes')
					.insert({
						pid: product.pid,
						target_type: 'PRODUCT',
						uid: user.id
					});

				if (error) throw error;

				setLiked(true);
				setLikeCount(prev => prev + 1);

			}
		} catch (error) {
			console.error('좋아요 토글 에러:', error);
		}
	};

	// console.log('옵션:', product.option_types);
	// console.log('Product SKUs:', productSkus);
	// console.log('Selected SKU:', selectedSku);

	return (
		<>
			{/* 상품 정보 영역 */}
			<div className='product-info'>
				{/* 상품 이미지 */}
				<div>
					<img src={getThumbnailSrc(product.thumbnail_url)} alt={product.name} />
				</div>
				{/* 상품 정보 */}
				<div className='info-wrap'>
					{/* 카테고리 & 브랜드 */}
					<div className='info-main'>
						<Link
							to={
								product.bid
									? `/brands/${product.brands?.bid}`
									: `/${product.categories?.slug}/${product.sub_categories?.slug}`
							} className='category-brand'
						>
							{product.brands?.name || product.sub_categories.name || '미분류'}
						</Link>
						<div className='name'>
							{product.name}
						</div>
						<div className='price'>
							<span>{product.price.toLocaleString('ko-KR')}</span>원
						</div>
						<div className='price-note'>
							{
								user
									? `보유 M포인트 모두 사용 시 ${calculateDiscountPrice(product, userPoints).toLocaleString('ko-KR')} 원`
									: `최대 M포인트 할인 시 ${Math.floor(product.price * (100 - product.point_rate) / 100).toLocaleString('ko-KR')}원`
							}
						</div>
						<div className='mpoint'>최대 {product.point_rate}% M포인트</div>
					</div>
					<div className='info-extra'>
						<dl className='modelName'>
							<dt>모델명</dt>
							<dd>{product?.name.replace(/[\[\(].*?[\]\)]/g, '').trim()}</dd>
						</dl>
						<dl>
							<dt>발송기일</dt>
							<dd>7일 이내/ 평균 1일</dd>
						</dl>
						<dl>
							<dt>남은수량</dt>
							<dd>
								{
									product?.option_types
										? selectedSku ? selectedSku.stock_qty : '옵션을 선택하세요'
										: productSkus[0]?.stock_qty
								}
							</dd>
						</dl>
					</div>

					{/* 옵션 선택 영역 */}
					{product.option_types
						? Object.keys(product.option_types).length > 0 && (
							<div style={{ margin: '20px 0', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
								<h4 style={{ margin: '0 0 15px 0', fontWeight: 'bold' }}>옵션 선택</h4>

								{Object.entries(product.option_types).map(([optionType, options]) => (
									<div key={optionType} style={{ marginBottom: '15px' }}>
										<label>{optionType.toUpperCase()}</label>
										<select
											value={selectedOptions[optionType] || ''}
											onChange={(e) => handleOptionChange(optionType, e.target.value)}
											style={{
												width: '100%',
												padding: '10px',
												border: '1px solid #ccc',
												color: '#444'
											}}
										>
											<option value="">
												{optionType?.toUpperCase()}
											</option>
											{options.map((option) => (
												<option key={option} value={option}>
													{option}
												</option>
											))}
										</select>
									</div>
								))}

								{/* 선택된 옵션 표시 */}
								{Object.keys(selectedOptions).length > 0 && (
									<div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
										<strong>선택된 옵션:</strong>
										{Object.entries(selectedOptions).map(([type, value]) => (
											value && <span key={type} style={{ marginLeft: '10px', color: '#333' }}>
												{type === 'size' ? '사이즈' : type === 'color' ? '색상' : type}: {value}
											</span>
										))}
									</div>
								)}

								{/* 선택된 SKU 정보 표시 */}
								{selectedSku && (
									<div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
										<div><strong>SKU ID:</strong> {selectedSku.skid}</div>
										<div><strong>남은재고:</strong> {selectedSku.stock_qty}개</div>
									</div>
								)}
							</div>
						)
						:
						<div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
							<div><strong>SKU ID:</strong> {productSkus[0]?.skid}</div>
							<strong>SKU options:</strong> {productSkus[0]?.options ? JSON.stringify(productSkus[0].options) : 'null'}
							<div><strong>남은재고:</strong> {productSkus[0]?.stock_qty}개</div>
						</div>
					}

					{/* 수량 선택 */}
					<div>
						<label>수량:</label>
						<input
							type="number"
							min="1"
							max={selectedSku ? selectedSku.stock_qty : productSkus[0]?.stock_qty}
							value={quantity}
							onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
							style={{
								border: '1px solid #ccc',
								textAlign: 'center'
							}}
						/>
					</div>

					<div className='btn-group'>
						<button className='btn-wish' onClick={handleLikeToggle}>
							<img src={liked ? `${import.meta.env.BASE_URL}images/icons/ico_likeFull.png` : `${import.meta.env.BASE_URL}images/icons/ico_like.png`} alt="좋아요" />
							<span>{likeCount}</span>
						</button>
						<div className='purchase-buttons'>
							<button className='btn-cart'>장바구니</button>
							<button className='btn-buy'>구매하기</button>
						</div>
					</div>
				</div>
			</div>
			{/* 상품 디테일 이미지 영역 */}
			<div className='product-detail-images'>
				{product.images && product.images.length > 0 ? (
					product.images.map((url, index) => (
						<img
							key={index}
							src={url}
							alt={`${product.name} 상세 이미지 ${index + 1}`}
						/>
					))
				) : (<p>상세 이미지가 없습니다.</p>
				)}
			</div>
		</>
	);
};

export default ProductInfo;