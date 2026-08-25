import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Empty, Alert, Tour, App } from 'antd';
import { PlusOutlined, SettingOutlined, MoreOutlined } from '@ant-design/icons';
import { ProductCategory, Products } from '../../api/products';
import EditCategory from '../../components/product/EditCategory';
import EditProduct from '../../components/product/EditProduct';
import './ShopProducts.scss';

const TOUR_KEY = 'products_category_tour_done';

export default function ShopProducts() {
  const { modal } = App.useApp();
  const editCategoryRef = useRef(null);
  const editProductRef = useRef(null);
  const categoryBtnRef = useRef(null);

  const [categories, setCategories] = useState([{ name: '全部', id: null }]);
  const [products, setProducts] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const hasNoCategory = !isLoading && categories.length <= 1;

  const filteredProducts = useMemo(() => {
    if (currentCategory === null) return products;
    return products.filter((item) => item.category_id === currentCategory);
  }, [products, currentCategory]);

  const initProductCategories = async () => {
    setIsLoading(true);
    try {
      const res = await ProductCategory.List();
      setCategories([{ name: '全部', id: null }, ...res.data.data]);
      if (res.data.data.length === 0 && !localStorage.getItem(TOUR_KEY)) {
        setShowTour(true);
      }
    } catch (error) {
      console.error('fetch product categories error', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initProducts = async () => {
    setIsLoading(true);
    try {
      const res = await Products.List();
      setProducts(res.data.data);
    } catch (error) {
      console.error('fetch products error', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initProductCategories();
    initProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onTourFinish = () => {
    localStorage.setItem(TOUR_KEY, '1');
    setShowTour(false);
  };

  const handleAddProduct = () => {
    if (hasNoCategory) {
      modal.confirm({
        title: '尚未建立種類',
        content: '新增產品前，請先建立至少一個產品種類。',
        okText: '去建立種類',
        cancelText: '取消',
        onOk: () => editCategoryRef.current?.open(),
      });
      return;
    }
    editProductRef.current?.open();
  };

  return (
    <div className="products-manager">
      <div className="page-header">
        <div className="header-top">
          <div>
            <h2>產品管理</h2>
            <p className="subtitle">管理麵包產品資訊，快速編輯與分類</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddProduct}>
            新增產品
          </Button>
        </div>
      </div>

      <EditCategory ref={editCategoryRef} onUpdated={initProductCategories} />
      <EditProduct ref={editProductRef} onUpdate={initProducts} />

      <Tour
        open={showTour}
        onClose={onTourFinish}
        steps={[
          {
            target: () => categoryBtnRef.current,
            title: '先建立產品種類',
            description: '新增產品前，請先點擊這裡建立種類，才能在產品中選擇分類。',
            nextButtonProps: { children: '好，去建立' },
          },
        ]}
      />

      <div className="toolbar">
        <div className="category-tags">
          {isLoading && categories.length <= 1 ? (
            <div className="toolbar-skeleton" aria-hidden="true" />
          ) : (
            categories.map((cat) => (
              <button
                key={cat.id ?? 'all'}
                type="button"
                className={`cat-tag${currentCategory === cat.id ? ' active' : ''}`}
                onClick={() => setCurrentCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))
          )}
        </div>
        <Button
          ref={categoryBtnRef}
          type="text"
          icon={<SettingOutlined />}
          onClick={() => editCategoryRef.current?.open()}
        >
          編輯
        </Button>
      </div>

      {hasNoCategory && (
        <Alert
          type="warning"
          closable={false}
          showIcon
          title="尚未建立任何產品種類"
          description={
            <>
              新增產品前請先建立種類，才能在產品中選擇分類。
              <Button type="link" onClick={() => editCategoryRef.current?.open()}>
                立即建立 →
              </Button>
            </>
          }
        />
      )}

      <div className="columns-2">
        {filteredProducts.map((item) => (
          <div className="card" key={item.id}>
            <div className={`thumb${!item.is_active ? ' disabled' : ''}`}>
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} />
              ) : (
                <div className="image-placeholder">
                  <span>No Image</span>
                </div>
              )}
              {!item.is_active && <div className="overlay">下架</div>}
              <div className="category">{item.category_name}</div>
            </div>
            <div className="info">
              <div className="title">
                <span className="text-ellipsis-2">{item.name}</span>
                <MoreOutlined onClick={() => editProductRef.current?.open(item.id)} />
              </div>
              <p className="description text-ellipsis-2">{item.description}</p>
              <div className="price-row">
                <span className="price">${item.price}</span>
                {item.is_sliceable && item.slice_price && (
                  <span className="slice-price">切片 ${item.slice_price}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {filteredProducts.length === 0 && <Empty description="沒有符合條件的產品" />}
    </div>
  );
}
