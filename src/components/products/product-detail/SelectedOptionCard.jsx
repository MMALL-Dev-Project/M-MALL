import React from 'react';

const SelectedOptionCard = ({ sku, quantity, onQuantityChange, onRemove }) => {
    // SKU 옵션 데이터 파싱
    let skuOptions = {};
    if (sku.options) {
        if (typeof sku.options === 'string') {
            try {
                skuOptions = JSON.parse(sku.options);
            } catch (e) {
                console.error('SKU 옵션 파싱 에러:', e);
            }
        } else {
            skuOptions = sku.options;
        }
    }

    // 수량 변경 핸들러
    const handleQuantityChange = (e) => {
        const inputValue = e.target.value;
        const numericValue = parseInt(inputValue) || 1;

        // 1과 재고 수량 사이의 값으로 제한
        const validQuantity = Math.max(1, Math.min(numericValue, sku.stock_qty));

        onQuantityChange(validQuantity);
    };

    return (
        <div className='selected-option-card'>
            {/* 선택된 옵션 정보 표시 */}
            <p className='option-name'>
                {Object.keys(skuOptions).length > 0 ?
                    Object.values(skuOptions).join(' / ')
                    :
                    'FREE'
                }
                {/* 재고 임박 표시 */}
                {
                    sku.stock_qty <= 5 ?
                        <span className='low-stock'>재고임박</span>
                        : ''
                }
            </p>
            {/* 수량 선택 및 제거 버튼 */}
            <div className='option-controls'>
                <div className='option-quantity'>
                    <label htmlFor={`quantity-${sku.skid}`}></label>
                    <input
                        id={`quantity-${sku.skid}`}
                        type="number"
                        min="1"
                        max={sku.stock_qty}
                        value={quantity}
                        onChange={handleQuantityChange}

                    />
                </div>
                {Object.keys(skuOptions).length > 0 && onRemove && (
                    // 옵션 카드 삭제 버튼
                    <button onClick={onRemove} className='btn-remove'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
                            <line x1="1" y1="1" x2="11" y2="11" stroke="#999" strokeWidth="1.5" />
                            <line x1="11" y1="1" x2="1" y2="11" stroke="#999" strokeWidth="1.5" />
                        </svg>
                    </button>

                )}
            </div>
        </div>
    );
};

export default SelectedOptionCard;