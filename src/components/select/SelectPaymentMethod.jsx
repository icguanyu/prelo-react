import { useEffect, useMemo } from 'react';
import { Select } from 'antd';
import { useAuthStore } from '../../stores/authStore';

const PAYMENT_METHOD_LABELS = {
  cash: '現金',
  linepay: 'Line Pay',
  bank: '匯款',
  card: '信用卡',
};

export default function SelectPaymentMethod({
  value,
  onChange,
  placeholder = '請選擇付款方式',
  disabled = false,
}) {
  const userPaymentMethods = useAuthStore((s) => s.user?.paymentMethods);

  const availablePaymentMethods = useMemo(() => {
    if (!Array.isArray(userPaymentMethods) || userPaymentMethods.length === 0) {
      return [
        { label: '現金', value: 'cash' },
        { label: 'Line Pay', value: 'linepay' },
      ];
    }
    return userPaymentMethods.map((v) => ({
      label: PAYMENT_METHOD_LABELS[v] || v,
      value: v,
    }));
  }, [userPaymentMethods]);

  // 只在初次掛載時預選第一個可用選項，對應 Vue 版的 onMounted（不隨後續選項變動重新觸發）
  useEffect(() => {
    if (!value && availablePaymentMethods.length > 0) {
      onChange?.(availablePaymentMethods[0].value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Select
      value={value || undefined}
      onChange={onChange}
      allowClear
      placeholder={placeholder}
      disabled={disabled || availablePaymentMethods.length === 0}
      options={availablePaymentMethods}
    />
  );
}
