import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { Select, Button } from 'antd';
import { ProductCategory } from '../../api/products';

const SelectCategory = forwardRef(function SelectCategory(
  { value, onChange, placeholder = '請選擇種類', onManage, ...rest },
  ref,
) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await ProductCategory.List();
      setCategories(res.data.data);
    } catch (err) {
      console.error('fetch categories error', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useImperativeHandle(ref, () => ({ refresh: fetchCategories }), [fetchCategories]);

  return (
    <Select
      value={value ?? undefined}
      onChange={onChange}
      onClear={() => onChange?.(null)}
      allowClear
      placeholder={placeholder}
      loading={isLoading}
      options={categories.map((c) => ({ label: c.name, value: c.id }))}
      notFoundContent={
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 0' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>尚無種類</p>
          <Button size="small" type="primary" onClick={() => onManage?.()}>
            立即建立種類
          </Button>
        </div>
      }
      {...rest}
    />
  );
});

export default SelectCategory;
