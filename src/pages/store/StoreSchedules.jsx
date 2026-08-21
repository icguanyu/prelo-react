import { useParams } from 'react-router-dom';

export default function StoreSchedules() {
  const { slug } = useParams();
  return <div style={{ padding: 24 }}>Store {slug} schedules（待實作）</div>;
}
