export const scheduleStatusOptions = [
  { label: '草稿', value: 'DRAFT' },
  { label: '預告', value: 'ANNOUNCED' },
  { label: '收單中', value: 'OPEN' },
  { label: '已結單', value: 'CLOSED' },
];

export const orderStatusOptions = [
  { label: '全部', value: 'all', color: '' },
  { label: '已下單', value: 'PLACED', color: '#FDC43C', count: 0 },
  { label: '已完成', value: 'COMPLETED', color: '#2eaa62', count: 0 },
  { label: '已取消', value: 'CANCELLED', color: '#8C8C8C', count: 0 },
];
