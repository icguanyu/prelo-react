import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Select, Button } from "antd";
import { ProductCategory } from "../../api/products";

// forwardRef：讓父層可以用 ref 拿到這個元件內部暴露的方法
// Vue3 等同：defineExpose() + <SelectCategory ref="xxx" />
const SelectCategory = forwardRef(
  (
    // Props 解構，含預設值與其餘展開
    // Vue3 等同：defineProps({ value, onChange, placeholder: { default: '...' }, onManage }) + defineProps 的 ...rest 不存在，需用 $attrs
    { value, onChange, placeholder = "請選擇種類", onManage, ...rest },
    ref, // 父層傳進來的 ref，配合 forwardRef 使用
  ) => {
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // useCallback：記憶化函式，依賴陣列為空代表只建立一次，不會因為重新渲染而變成新函式
    const fetchCategories = useCallback(async () => {
      setIsLoading(true);
      try {
        const res = await ProductCategory.List();
        setCategories(res.data.data);
      } catch (err) {
        console.error("fetch categories error", err);
      } finally {
        setIsLoading(false);
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
    useImperativeHandle(ref, () => ({ refresh: fetchCategories }), [
      fetchCategories,
    ]);

    // JSX return：元件的模板區塊
    // Vue3 等同：<template> ... </template>
    return (
      <Select
        // value ?? undefined：null 轉成 undefined，讓 antd Select 正確顯示 placeholder
        value={value ?? undefined}
        onChange={onChange}
        onClear={() => onChange?.(null)}
        allowClear
        placeholder={placeholder}
        loading={isLoading}
        options={categories.map((c) => ({ label: c.name, value: c.id }))}
        notFoundContent={
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "12px 0",
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
              尚無種類
            </p>
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
  },
);

export default SelectCategory;
