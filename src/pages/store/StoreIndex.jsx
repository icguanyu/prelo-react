import { useParams } from 'react-router-dom';

export default function StoreIndex() {
  const { slug } = useParams();
  return <div style={{ padding: 24 }}>Store {slug}（待實作）</div>;
}
