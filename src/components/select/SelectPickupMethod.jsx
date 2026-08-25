import { useMemo } from 'react';
import { Select } from 'antd';
import { useAuthStore } from '../../stores/authStore';

const PICKUP_METHOD_LABELS = {
  pickup: '自取',
  delivery: '宅配',
};

export default function SelectPickupMethod({ value, onChange, placeholder = '請選擇取貨方式' }) {
  const pickupMethods = useAuthStore((s) => s.user?.pickupMethods);

  const options = useMemo(
    () =>
      (pickupMethods || []).map((method) => ({
        label: PICKUP_METHOD_LABELS[method] || method,
        value: method,
      })),
    [pickupMethods],
  );

  return (
    <Select
      value={value ?? undefined}
      onChange={onChange}
      placeholder={placeholder}
      options={options}
    />
  );
}
