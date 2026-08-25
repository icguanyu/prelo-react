import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { Select, Button } from 'antd';
import { ProductCategory } from '../../api/products';

// forwardRef：讓父層可以用 ref 拿到這個元件內部暴露的方法
// Vue3 等同：defineExpose() + <SelectCategory ref="xxx" />
const SelectCategory = forwardRef(function SelectCategory(
  // Props 解構，含預設值與其餘展開
  // Vue3 等同：defineProps({ value, onChange, placeholder: { default: '...' }, onManage }) + defineProps 的 ...rest 不存在，需用 $attrs
  { value, onChange, placeholder = '請選擇種類', onManage, ...rest },
  ref, // 父層傳進來的 ref，配合 forwardRef 使用
) {
  // useState：宣告響應式狀態，回傳 [目前值, 修改函式]
  // Vue3 等同：const categories = ref([])
  const [categories, setCategories] = useState([]);
  // Vue3 等同：const isLoading = ref(false)
  const [isLoading, setIsLoading] = useState(false);

  // useCallback：記憶化函式，依賴陣列為空代表只建立一次，不會因為重新渲染而變成新函式
  // Vue3 等同：普通的 async function，Vue3 不需要特別記憶化函式
  const fetchCategories = useCallback(async () => {
    setIsLoading(true); // 等同：isLoading.value = true
    try {
      const res = await ProductCategory.List();
      setCategories(res.data.data); // 等同：categories.value = res.data.data
    } catch (err) {
      console.error('fetch categories error', err);
    } finally {
      setIsLoading(false); // 等同：isLoading.value = false
    }
  }, []); // 依賴陣列：這裡為空，代表 fetchCategories 永遠是同一個函式參考

  // useEffect：副作用，第二個參數是依賴陣列
  // Vue3 等同：onMounted(() => fetchCategories())
  // 這裡依賴 fetchCategories，但因為 useCallback 保證它不變，實際上只執行一次
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // useImperativeHandle：決定 ref 對外暴露什麼方法給父層
  // Vue3 等同：defineExpose({ refresh: fetchCategories })
  useImperativeHandle(ref, () => ({ refresh: fetchCategories }), [fetchCategories]);

  // JSX return：元件的模板區塊
  // Vue3 等同：<template> ... </template>
  return (
    <Select
      // value ?? undefined：null 轉成 undefined，讓 antd Select 正確顯示 placeholder
      // Vue3 等同：:value="value ?? undefined"
      value={value ?? undefined}
      // 事件直接傳 prop 函式，不用 emit
      // Vue3 等同：@change="onChange" + defineEmits(['update:value'])
      onChange={onChange}
      // onClear：?.() 是可選鏈呼叫，onChange 可能是 undefined 時不會報錯
      // Vue3 等同：@clear="onChange?.(null)"
      onClear={() => onChange?.(null)}
      allowClear
      placeholder={placeholder}
      loading={isLoading}
      // 直接在 JSX 內 .map() 轉換資料為選項格式
      // Vue3 等同：:options="categories.map(c => ({ label: c.name, value: c.id }))"
      options={categories.map((c) => ({ label: c.name, value: c.id }))}
      // notFoundContent：無資料時顯示的自訂內容，直接放 JSX
      // Vue3 等同：antd 的 #notFoundContent slot
      notFoundContent={
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 0' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>尚無種類</p>
          {/* onManage?.()：可選鏈，onManage 沒傳就什麼都不做 */}
          {/* Vue3 等同：@click="onManage?.()" */}
          <Button size="small" type="primary" onClick={() => onManage?.()}>
            立即建立種類
          </Button>
        </div>
      }
      // ...rest：把剩餘 props 全部傳給 Select（如 style、className 等）
      // Vue3 等同：v-bind="$attrs"（需設定 inheritAttrs: false）
      {...rest}
    />
  );
});

export default SelectCategory;
