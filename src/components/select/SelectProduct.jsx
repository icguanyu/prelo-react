import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Select } from 'antd';
import { Products } from '../../api/products';

const SelectProduct = forwardRef(function SelectProduct(
  { value, onChange, placeholder = '請選擇產品', excludeIds = [], disabled = false, ...rest },
  ref,
) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await Products.List({});
      setProducts(res.data.data.filter((p) => p.is_active) || []);
    } catch (err) {
      console.error('fetch data error', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const availableProducts = useMemo(() => {
    const excludeSet = new Set(excludeIds);
    return products.filter((p) => !excludeSet.has(p.id));
  }, [products, excludeIds]);

  const groupedOptions = useMemo(() => {
    const groups = {};
    availableProducts.forEach((product) => {
      const categoryId = product.category_id;
      const categoryName = product.category?.name || product.category_name || '未分類';
      if (!groups[categoryId]) {
        groups[categoryId] = { label: categoryName, options: [] };
      }
      groups[categoryId].options.push({ value: product.id, label: product.name });
    });
    return Object.values(groups);
  }, [availableProducts]);

  useImperativeHandle(
    ref,
    () => ({
      getProductById: (id) => products.find((p) => p.id === id),
    }),
    [products],
  );

  return (
    <Select
      value={value ?? undefined}
      onChange={onChange}
      onClear={() => onChange?.(null)}
      allowClear
      placeholder={placeholder}
      loading={isLoading}
      disabled={disabled || availableProducts.length === 0}
      options={groupedOptions}
      {...rest}
    />
  );
});

export default SelectProduct;
