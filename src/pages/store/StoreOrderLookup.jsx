import { useParams } from 'react-router-dom';

export default function StoreOrderLookup() {
  const { slug } = useParams();
  return <div style={{ padding: 24 }}>Store {slug} order lookup（待實作）</div>;
}
