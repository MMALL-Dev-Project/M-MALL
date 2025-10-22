import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@config/supabase';
import { useAdminAuth } from "@hooks/useAdminAuth";
import { getLogoSrc } from '@utils/image';
import './ProductNew.css';

const ProductNew = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 카테고리 및 브랜드 데이터
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // 브랜드 검색
  const [brandSearch, setBrandSearch] = useState('');

  // 상품 기본 정보
  const [product, setProduct] = useState({
    name: '',
    price: '',
    point_rate: 50,
    cid: '',
    scid: '',
    bid: '',
    thumbnail_url: null,
    images: [],
    is_active: true
  });

  // 검색어로 브랜드 필터링
  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  // 옵션 관리
  const [hasOptions, setHasOptions] = useState(false);
  const [optionTypes, setOptionTypes] = useState([]);
  const [currentOptionType, setCurrentOptionType] = useState('');
  const [currentOptionValues, setCurrentOptionValues] = useState('');

  // SKU 관리
  const [skus, setSkus] = useState([]);

  // 썸네일 미리보기
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [detailImagePreviews, setDetailImagePreviews] = useState([]);

  useAdminAuth();
  
  // 카테고리, 브랜드 데이터 로드
  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);



  // 서브카테고리 로드
  useEffect(() => {
    if (product.cid) {
      fetchSubCategories(product.cid);
    } else {
      setSubCategories([]);
      setProduct(prev => ({ ...prev, scid: '' }));
    }
  }, [product.cid]);


  // fetch 로직
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('cid');
    if (!error) setCategories(data || []);
  };

  const fetchSubCategories = async (cid) => {
    const { data, error } = await supabase
      .from('sub_categories')
      .select('*')
      .eq('cid', cid)
      .order('scid');
    if (!error) setSubCategories(data || []);
  };

  const fetchBrands = async () => {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('name');
    if (!error) setBrands(data || []);
  };

  // 기본 정보 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 썸네일 업로드
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProduct(prev => ({ ...prev, thumbnail_url: file }));
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  // 상세 이미지 업로드
  const handleDetailImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setProduct(prev => ({ ...prev, images: files }));
    setDetailImagePreviews(files.map(file => URL.createObjectURL(file)));
  };

  // 옵션 타입 추가
  const handleAddOptionType = () => {
    if (!currentOptionType || !currentOptionValues) {
      alert('옵션명과 옵션값을 입력해주세요.');
      return;
    }

    const values = currentOptionValues.split(',').map(v => v.trim()).filter(v => v);
    if (values.length === 0) {
      alert('옵션값을 쉼표로 구분하여 입력해주세요.');
      return;
    }

    const newOption = {
      type: currentOptionType.toLowerCase(),
      values: values
    };

    setOptionTypes(prev => [...prev, newOption]);
    setCurrentOptionType('');
    setCurrentOptionValues('');

    // 옵션이 추가되면 기존 SKU 초기화
    setSkus([]);
  };

  // 옵션 타입 제거
  const handleRemoveOptionType = (index) => {
    setOptionTypes(prev => prev.filter((_, i) => i !== index));
    // 옵션이 제거되면 SKU도 초기화
    setSkus([]);
  };

  // SKU 자동 생성
  const handleGenerateSkus = () => {
    if (optionTypes.length === 0) {
      alert('옵션을 먼저 추가해주세요.');
      return;
    }

    const combinations = [];
    const generate = (current, depth) => {
      if (depth === optionTypes.length) {
        combinations.push({ ...current });
        return;
      }

      const optionType = optionTypes[depth];
      optionType.values.forEach(value => {
        generate({ ...current, [optionType.type]: value }, depth + 1);
      });
    };

    generate({}, 0);

    const newSkus = combinations.map((options, index) => ({
      id: `temp-${Date.now()}-${index}`,
      options: options,
      sku_code: generateSkuCode(options),
      additional_price: 0,
      stock_qty: 20
    }));

    setSkus(newSkus);
  };

  // SKU 코드 생성
  const generateSkuCode = (options) => {
    const prefix = product.name.substring(0, 3).toUpperCase() || 'PRD';
    const optionStr = Object.entries(options)
      .map(([key, value]) => `${key.toUpperCase()}-${value}`)
      .join('-');
    return `${prefix}-${optionStr}`;
  };

  // SKU 정보 변경
  const handleSkuChange = (skuId, field, value) => {
    setSkus(prev => prev.map(sku =>
      sku.id === skuId ? { ...sku, [field]: value } : sku
    ));
  };

  // SKU 제거
  const handleRemoveSku = (skuId) => {
    setSkus(prev => prev.filter(sku => sku.id !== skuId));
  };

  // 옵션 없는 상품의 기본 SKU 추가
  const handleAddDefaultSku = () => {
    const defaultSku = {
      id: `temp-${Date.now()}`,
      options: {},
      sku_code: `${product.name.substring(0, 3).toUpperCase() || 'PRD'}-DEFAULT`,
      additional_price: 0,
      stock_qty: 20
    };
    setSkus([defaultSku]);
  };

  // 상품 등록 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 유효성 검사
    if (!product.name || !product.price) {
      alert('상품명과 가격은 필수입니다.');
      return;
    }

    if (!product.cid || !product.scid) {
      alert('카테고리를 선택해주세요.');
      return;
    }

    if (skus.length === 0) {
      alert(hasOptions ? 'SKU를 생성해주세요.' : '재고 정보를 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      // 1. 옵션 타입 객체 생성
      const optionTypesObj = {};
      if (hasOptions) {
        optionTypes.forEach(opt => {
          optionTypesObj[opt.type] = opt.values;
        });
      }

      // 2. 상품 먼저 등록 (이미지 없이)
      const allSkusOutOfStock = skus.every(sku => {
        const stockQty = parseInt(sku.stock_qty) || 0;
        return stockQty === 0;
      });

      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert({
          name: product.name,
          price: parseInt(product.price),
          point_rate: parseInt(product.point_rate),
          cid: parseInt(product.cid),
          scid: parseInt(product.scid),
          bid: product.bid ? parseInt(product.bid) : null,
          thumbnail_url: null,
          images: null,
          option_types: hasOptions ? optionTypesObj : null,
          is_active: product.is_active,
          is_soldout: !allSkusOutOfStock,
          like_count: 0
        })
        .select()
        .single();

      if (productError) throw productError;

      const pid = productData.pid;

      // 3. pid를 폴더명으로 사용하여 이미지 업로드
      let thumbnailUrl = null;
      const imageUrls = [];

      // 썸네일 업로드
      if (product.thumbnail_url) {
        const thumbnailPath = `thumbnails/${pid}/${Date.now()}`;
        const { error: thumbError } = await supabase.storage
          .from('products')
          .upload(thumbnailPath, product.thumbnail_url);

        if (thumbError) throw thumbError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(thumbnailPath);

        thumbnailUrl = publicUrl;
      }

      // 상세 이미지 업로드
      if (product.images.length > 0) {
        for (const image of product.images) {
          const imagePath = `details/${pid}/${Date.now()}`;
          const { error: imgError } = await supabase.storage
            .from('products')
            .upload(imagePath, image);

          if (imgError) throw imgError;

          const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(imagePath);

          imageUrls.push(publicUrl);
        }
      }

      // 4. 이미지 URL로 상품 업데이트
      const { error: updateError } = await supabase
        .from('products')
        .update({
          thumbnail_url: thumbnailUrl,
          images: imageUrls.length > 0 ? imageUrls : null
        })
        .eq('pid', pid);

      if (updateError) throw updateError;

      // 5. SKU 등록
      const skuInserts = skus.map(sku => {
        const stockQty = parseInt(sku.stock_qty) || 0;

        return {
          pid: pid,
          options: hasOptions ? sku.options : {},
          sku_code: sku.sku_code,
          additional_price: parseInt(sku.additional_price) || 0,
          stock_qty: stockQty,
          reserved_qty: 0,
          is_active: stockQty > 0
        };
      });

      const { error: skuError } = await supabase
        .from('product_skus')
        .insert(skuInserts);

      if (skuError) throw skuError;

      alert('상품이 성공적으로 등록되었습니다!');
      navigate(`/product/${pid}`);

    } catch (error) {
      console.error('상품 등록 실패:', error);
      alert('상품 등록에 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='admin-wrap product-admin'>
      <h2 className='admin-title'>신규 상품 등록</h2>

      <form onSubmit={handleSubmit}>
        {/* 기본 정보 */}
        <section className="form-section">
          <h2 className="section-title">기본 정보</h2>
          {/* 상품명 입력 */}
          <div className="form-group">
            <label htmlFor='product-name' className="form-label">상품명 *</label>
            <input
              id="product-name"
              type="text"
              name="name"
              value={product.name}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="상품명을 입력하세요"
            />
          </div>
          {/* 가격, 포인트 입력 */}
          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="price" className="form-label">가격 *</label>
              <input
                id="price"
                type="number"
                name="price"
                value={product.price}
                onChange={handleInputChange}
                required
                min="0"
                className="form-input"
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label htmlFor='point-rate' className="form-label">M포인트 할인률 (%)</label>
              <input
                id='point-rate'
                type="number"
                name="point_rate"
                value={product.point_rate}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="form-input"
              />
            </div>
          </div>
          {/* 카테고리 선택 */}
          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="category" className="form-label">카테고리 *</label>
              <select
                id="category"
                name="cid"
                value={product.cid}
                onChange={handleInputChange}
                required
                className="form-select"
              >
                <option value="">선택하세요</option>
                {categories.map(cat => (
                  <option key={cat.cid} value={cat.cid}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="sub-category" className="form-label">서브카테고리 *</label>
              <select
                id="sub-category"
                name="scid"
                value={product.scid}
                onChange={handleInputChange}
                required
                disabled={!product.cid}
                className="form-select"
              >
                <option value="">선택하세요</option>
                {subCategories.map(sub => (
                  <option key={sub.scid} value={sub.scid}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>
          {/* 브랜드 선택 */}
          <div className="form-group">
            <label htmlFor="brand-search" className="form-label">브랜드 (선택)</label>

            {/* 검색 입력창 */}
            <input
              id="brand-search"
              type="text"
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              placeholder="브랜드 검색..."
              className="form-input"
              style={{ marginBottom: '15px' }}
            />

            {/* 라디오 버튼 리스트 */}
            <div className="form-radio">
              <label className={`radio-label ${product.bid === "" ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="bid"
                  value=""
                  checked={product.bid === ""}
                  onChange={handleInputChange}
                  className="radio-input"
                />
                <img src={getLogoSrc(null)} alt="" />
                브랜드 없음
              </label>

              {filteredBrands.length > 0 ? (
                filteredBrands.map(brand => (
                  <label
                    key={brand.bid}
                    className={`radio-label ${product.bid === String(brand.bid) ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="bid"
                      value={brand.bid}
                      checked={product.bid === String(brand.bid)}
                      onChange={handleInputChange}
                      className="radio-input"
                    />
                    <img src={getLogoSrc(brand.logo_url)} alt="" />
                    {brand.name}
                  </label>
                ))
              ) : (
                <p className="text-muted">검색 결과가 없습니다.</p>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_active"
                checked={product.is_active}
                onChange={handleInputChange}
                className="checkbox-input"
              />
              <span>활성화 상태</span>
            </label>
          </div>
        </section>

        {/* 이미지 */}
        <section className="form-section">
          <h2 className="section-title">이미지</h2>

          <div className="form-group">
            <label className="form-label">썸네일 이미지</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
            />
            {thumbnailPreview && (
              <img src={thumbnailPreview} alt="썸네일 미리보기" className="image-preview" />
            )}
          </div>

          <div className="form-group">
            <label className="form-label">상세 이미지 (여러 개 선택 가능)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleDetailImagesChange}
            />
            {detailImagePreviews.length > 0 && (
              <div className="image-preview-grid">
                {detailImagePreviews.map((preview, index) => (
                  <img key={index} src={preview} alt={`상세 이미지 ${index + 1}`} className="image-preview-small" />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 옵션 관리 */}
        <section className="form-section">
          <h2 className="section-title">옵션 설정</h2>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={hasOptions}
                onChange={(e) => {
                  setHasOptions(e.target.checked);
                  if (!e.target.checked) {
                    setOptionTypes([]);
                    setSkus([]);
                  }
                }}
                className="checkbox-input"
              />
              <span>옵션이 있는 상품</span>
            </label>
          </div>

          {hasOptions && (
            <>
              <div className="option-input-area">
                <div className="option-input-grid">
                  <div>
                    <label className="form-label">옵션명</label>
                    <input
                      type="text"
                      value={currentOptionType}
                      onChange={(e) => setCurrentOptionType(e.target.value)}
                      placeholder="예: size, color"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">옵션값 (쉼표로 구분)</label>
                    <input
                      type="text"
                      value={currentOptionValues}
                      onChange={(e) => setCurrentOptionValues(e.target.value)}
                      placeholder="예: S, M, L, XL"
                      className="form-input"
                    />
                  </div>
                  <button type="button" onClick={handleAddOptionType} className="btn-primary">
                    추가
                  </button>
                </div>
              </div>

              {optionTypes.length > 0 && (
                <div className="form-group">
                  <h3>추가된 옵션</h3>
                  {optionTypes.map((opt, index) => (
                    <div key={index} className="option-item">
                      <div>
                        <strong>{opt.type}:</strong> {opt.values.join(', ')}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveOptionType(index)}
                        className="btn-danger"
                      >
                        제거
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleGenerateSkus}
                    className="btn-info"
                  >
                    SKU 자동 생성
                  </button>
                </div>
              )}
            </>
          )}

          {!hasOptions && (
            <div>
              <p className="text-muted">옵션이 없는 상품입니다.</p>
              {skus.length === 0 && (
                <button
                  type="button"
                  onClick={handleAddDefaultSku}
                  className="btn-success"
                >
                  재고 정보 추가
                </button>
              )}
            </div>
          )}
        </section>

        {/* SKU 관리 */}
        {skus.length > 0 && (
          <section className="form-section">
            <h2 className="section-title">재고 관리 (SKU)</h2>

            <div style={{ overflowX: 'auto' }}>
              <table className="sku-table">
                <thead>
                  <tr>
                    {hasOptions && <th>옵션</th>}
                    <th>SKU 코드</th>
                    <th>추가 가격</th>
                    <th>재고 수량</th>
                    <th className="text-center">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {skus.map((sku) => (
                    <tr key={sku.id}>
                      {hasOptions && (
                        <td>
                          {Object.entries(sku.options).map(([key, value]) => (
                            <div key={key}><strong>{key}:</strong> {value}</div>
                          ))}
                        </td>
                      )}
                      <td>
                        <input
                          type="text"
                          value={sku.sku_code}
                          onChange={(e) => handleSkuChange(sku.id, 'sku_code', e.target.value)}
                          className="table-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={sku.additional_price}
                          onChange={(e) => handleSkuChange(sku.id, 'additional_price', e.target.value)}
                          min="0"
                          className="table-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={sku.stock_qty}
                          onChange={(e) => handleSkuChange(sku.id, 'stock_qty', e.target.value)}
                          min="0"
                          className="table-input"
                        />
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSku(sku.id)}
                          className="btn-danger"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 제출 버튼 */}
        <div className="button-group">
          <button type="button" onClick={() => navigate(-1)}
            className="btn-cancel">
            취소
          </button>
          <button
            type="submit"
            className="btn-submit"
          >
            상품 등록
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductNew;