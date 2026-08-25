import { Select } from 'antd';

const STATUS_OPTIONS = [
  { value: true, label: '啟用' },
  { value: false, label: '下架' },
];

export default function SelectProductStatus({ value, onChange, placeholder = '請選擇' }) {
  return (
    <Select
      value={value ?? undefined}
      onChange={onChange}
      onClear={() => onChange?.(null)}
      allowClear
      placeholder={placeholder}
      options={STATUS_OPTIONS}
    />
  );
}
