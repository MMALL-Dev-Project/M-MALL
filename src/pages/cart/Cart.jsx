import React, { useState, useEffect } from 'react';
import './Cart.css';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/config/supabase';
import { getThumbnailSrc } from '@/utils/image';
import { useNavigate } from 'react-router-dom';

const Cart = () => {

	const [cartList, setCartList] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedItems, setSelectedItems] = useState(new Set());
	const { user, userInfo } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (!user) {
			navigate('/login');
		}
	}, [user, navigate]);

	// 장바구니 데이터 로드
	useEffect(() => {
		const fetchCartData = async () => {
			try {
				const { data, error } = await supabase
					.from('cart_items')
					.select(`
            *,
            products (
              pid,
              name,
              price,
              thumbnail_url,
							is_active,
              brands (
                name
              )
            ),
						product_skus (
							skid,
							options,
							additional_price,
							sku_code,
							is_active
						)
          `)
					.eq('uid', user.id);

				if (error) throw error;

				// 비활성 상품 체크 해제 처리
				const inactiveItems = data.filter(item =>
					!item.products?.is_active || !item.product_skus?.is_active
				);

				if (inactiveItems.length > 0) {
					const inactiveIds = inactiveItems.map(item => item.caid);

					// 비활성 상품의 selected를 false로 업데이트
					await supabase
						.from('cart_items')
						.update({ selected: false })
						.in('caid', inactiveIds);

					// 로컬 데이터도 업데이트
					data.forEach(item => {
						if (inactiveIds.includes(item.caid)) {
							item.selected = false;
						}
					});
				}

				setCartList(data || []);

				// 활성 상품만 선택된 아이템으로 설정
				setSelectedItems(new Set(
					data.filter(item =>
						item.selected &&
						item.products?.is_active &&
						item.product_skus?.is_active
					).map(item => item.caid)
				));
			} catch (error) {
				console.error('장바구니 로딩 실패:', error);
			} finally {
				setLoading(false);
			}
		};

		if (user?.id) {
			fetchCartData();
		}
	}, [user]);

	// 옵션 텍스트 포맷팅
	const formatOptions = (options) => {
		if (!options) return '';

		return Object.entries(options)
			.map(([key, value]) => `${value}`)
			.join(' / ');
	};

	// 상품이 활성 상태인지 확인
	const isItemActive = (item) => {
		return item.products?.is_active && item.product_skus?.is_active;
	};

	// 전체 선택/해제
	const handleSelectAll = async (checked) => {
		try {
			// 활성 상품만 선택
			const activeItems = cartList.filter(item => isItemActive(item));
			const activeIds = activeItems.map(item => item.caid);

			const { error } = await supabase
				.from('cart_items')
				.update({ selected: checked })
				.in('caid', activeIds);

			if (error) throw error;

			if (checked) {
				setSelectedItems(new Set(activeIds));
			} else {
				setSelectedItems(new Set());
			}

			setCartList(cartList.map(item => {
				if (isItemActive(item)) {
					return { ...item, selected: checked };
				}
				return item;
			}));
		} catch (error) {
			console.error('전체 선택 실패:', error);
		}
	};

	// 개별 선택/해제
	const handleSelectItem = async (caid, checked) => {
		try {
			const { error } = await supabase
				.from('cart_items')
				.update({ selected: checked })
				.eq('caid', caid);

			if (error) throw error;

			const newSelected = new Set(selectedItems);
			if (checked) {
				newSelected.add(caid);
			} else {
				newSelected.delete(caid);
			}
			setSelectedItems(newSelected);

			setCartList(cartList.map(item =>
				item.caid === caid ? { ...item, selected: checked } : item
			));
		} catch (error) {
			console.error('선택 상태 업데이트 실패:', error);
		}
	};

	// 수량 변경
	const handleQuantityChange = async (caid, newQuantity) => {
		if (newQuantity < 1) return;

		try {
			const { error } = await supabase
				.from('cart_items')
				.update({ quantity: newQuantity })
				.eq('caid', caid);

			if (error) throw error;

			setCartList(cartList.map(item =>
				item.caid === caid ? { ...item, quantity: newQuantity } : item
			));
		} catch (error) {
			console.error('수량 변경 실패:', error);
			alert('수량 변경에 실패했습니다.');
		}
	};

	// 선택 항목 삭제
	const handleDeleteSelected = async () => {
		if (selectedItems.size === 0) {
			alert('삭제할 상품을 선택해주세요.');
			return;
		}

		if (window.confirm(`선택한 ${selectedItems.size}개 상품을 삭제하시겠습니까?`)) {
			try {
				const { error } = await supabase
					.from('cart_items')
					.delete()
					.in('caid', Array.from(selectedItems));

				if (error) throw error;

				setCartList(cartList.filter(item => !selectedItems.has(item.caid)));
				setSelectedItems(new Set());
			} catch (error) {
				console.error('삭제 실패:', error);
				alert('삭제에 실패했습니다.');
			}
		}
	};

	// 개별 항목 삭제
	const handleDeleteItem = async (caid) => {
		if (window.confirm('상품을 삭제하시겠습니까?')) {
			try {
				const { error } = await supabase
					.from('cart_items')
					.delete()
					.eq('caid', caid);

				if (error) throw error;

				setCartList(cartList.filter(item => item.caid !== caid));
				selectedItems.delete(caid);
				setSelectedItems(new Set(selectedItems));
			} catch (error) {
				console.error('삭제 실패:', error);
				alert('삭제에 실패했습니다.');
			}
		}
	};

	// 선택 항목 총액 계산
	const calculateTotal = () => {
		return cartList
			.filter(item => selectedItems.has(item.caid))
			.reduce((sum, item) => {
				const additionalPrice = item.product_skus?.additional_price || 0;
				return sum + ((item.products.price + additionalPrice) * item.quantity);
			}, 0);
	};

	// 주문하기
	const handleCheckout = async () => {
		if (selectedItems.size === 0) {
			alert('주문할 상품을 선택해주세요.');
			return;
		}

		try {
			// 선택된 상품들 필터링
			const selectedCartItems = cartList.filter(item => selectedItems.has(item.caid));

			// 재고 확인 및 예약
			for (const item of selectedCartItems) {
				const { data: currentSku, error: skuError } = await supabase
					.from('product_skus')
					.select('stock_qty, reserved_qty, is_active')
					.eq('skid', item.skid)
					.single();

				if (skuError) throw new Error(`재고 확인 실패: ${skuError.message}`);

				if (!currentSku.is_active) {
					alert(`판매가 중지된 상품입니다. (상품: ${item.products?.name || '알 수 없음'})`);
					return;
				}

				const availableStock = currentSku.stock_qty - (currentSku.reserved_qty || 0);
				if (availableStock < item.quantity) {
					alert(`재고가 부족합니다. (상품: ${item.products?.name || '알 수 없음'})`);
					return;
				}

				// 재고 예약
				await supabase
					.from('product_skus')
					.update({
						reserved_qty: (currentSku.reserved_qty || 0) + item.quantity
					})
					.eq('skid', item.skid);
			}

			// Checkout 페이지로 전달할 데이터 포맷
			const orderItems = selectedCartItems.map(item => ({
				caid: item.caid,
				pid: item.pid,
				skid: item.skid,
				quantity: item.quantity,
				product: {
					...item.products,
					brands: item.products.brands
				},
				sku: item.product_skus,
				itemPrice: item.products.price + (item.product_skus?.additional_price || 0),
				itemTotal: (item.products.price + (item.product_skus?.additional_price || 0)) * item.quantity
			}));

			// 세션스토리지에 저장
			sessionStorage.setItem('checkoutItems', JSON.stringify(orderItems));

			// 10분 타이머 설정
			const endTime = Date.now() + (10 * 60 * 1000);
			localStorage.setItem('orderTimer', endTime.toString());

			// Checkout 페이지로 이동
			navigate('/order/checkout', { state: { orderItems } });

		} catch (error) {
			console.error('주문 처리 오류:', error);
			alert(error.message || '주문 처리 중 오류가 발생했습니다.');
		}
	};

	if (loading) {
		return <div id='cart'><p>로딩 중...</p></div>;
	}

	const activeItemsCount = cartList.filter(item => isItemActive(item)).length;
	const isAllSelected = activeItemsCount > 0 && selectedItems.size === activeItemsCount;

	return (
		<div id='cart'>
			<h2>장바구니</h2>

			{cartList.length === 0 ? (
				<div className="empty-cart">
					<p>장바구니가 비어있습니다.</p>
				</div>
			) : (
				<>
					<div className="cart-header">
						<label className="checkbox-label">
							<input
								type="checkbox"
								checked={isAllSelected}
								onChange={(e) => handleSelectAll(e.target.checked)}
								disabled={activeItemsCount === 0}
							/>
							<span>전체선택 ({selectedItems.size}/{activeItemsCount})</span>
						</label>
						<button
							className="btn-delete-selected"
							onClick={handleDeleteSelected}
							disabled={selectedItems.size === 0}
						>
							선택삭제
						</button>
					</div>

					<div className="cart-list">
						{cartList.map((item) => {
							const isActive = isItemActive(item);

							return (
								<div
									key={item.caid}
									className={`cart-item ${!isActive ? 'inactive' : ''}`}
								>
									<label className="checkbox-label">
										<input
											type="checkbox"
											checked={selectedItems.has(item.caid)}
											onChange={(e) => handleSelectItem(item.caid, e.target.checked)}
											disabled={!isActive}
										/>
									</label>

									<img
										src={getThumbnailSrc(item.products?.thumbnail_url)}
										alt={item.products?.name || '상품'}
										className="item-image"
									/>

									<div className="item-info">
										{!isActive && (
											<p className="item-status-inactive">
												⚠ 판매중지 상품
											</p>
										)}
										<h3>{item.products?.name || '상품명'}</h3>
										{item.product_skus?.options && (
											<p className="item-options">{formatOptions(item.product_skus.options)}</p>
										)}
										<p className="item-price">{item.products?.price?.toLocaleString() || 0}원</p>

									</div>

									<div className="item-quantity">
										<button
											onClick={() => handleQuantityChange(item.caid, item.quantity - 1)}
											disabled={item.quantity <= 1 || !isActive}
										>
											-
										</button>
										<span>{item.quantity}</span>
										<button
											onClick={() => handleQuantityChange(item.caid, item.quantity + 1)}
											disabled={!isActive}
										>
											+
										</button>
									</div>

									<div className="item-total">
										<strong>
											{((item.products?.price || 0) * item.quantity).toLocaleString()}원
										</strong>
									</div>

									<button
										className="btn-delete-item"
										onClick={() => handleDeleteItem(item.caid)}
									>
										✕
									</button>
								</div>
							);
						})}
					</div>

					<div className="cart-summary">
						<div className="summary-row">
							<span>선택 상품 금액</span>
							<strong>{calculateTotal().toLocaleString()}원</strong>
						</div>
						<div className="summary-row total">
							<span>총 결제금액</span>
							<strong className="total-price">{calculateTotal().toLocaleString()}원</strong>
						</div>
						<button
							className="btn-order"
							disabled={selectedItems.size === 0}
							onClick={handleCheckout}
						>
							주문하기 ({selectedItems.size}개)
						</button>
					</div>
				</>
			)}
		</div>
	);
};

export default Cart;