import { useParams } from 'react-router-dom';
import { CartProvider } from '../context/CartContext';
import CustomerMenu from '../components/menu/CustomerMenu.jsx';

export default function MenuPage() {
  const { tableId } = useParams();
  return (
    <CartProvider tableId={tableId}>
      <CustomerMenu tableId={tableId} />
    </CartProvider>
  );
}
