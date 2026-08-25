import { useEffect, useMemo, useState } from 'react';
import { Modal, Form, Input, Select, Switch, Button, App, Grid } from 'antd';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Orders } from '../../api/orders';
import SelectPaymentMethod from '../select/SelectPaymentMethod';
import SelectPickupMethod from '../select/SelectPickupMethod';
import { generateTimeOptions } from '../../utils/time';
import { formatPrice } from '../../utils/format';
import './OrderDetail.scss';

const pickupTimeOptions = generateTimeOptions('09:00', '22:00', 30);

function buildForm(order) {
  return {
    items: order?.items ? order.items.map((i) => ({ ...i })) : [],
    customer_name: order?.customer_name || '',
    customer_phone: order?.customer_phone || '',
    customer_address: order?.customer_address || '',
    pickup_time: order?.pickup_time || '',
    pickup_method: order?.pickup_method || 'pickup',
    bring_own_bag: Boolean(order?.bring_own_bag),
    note: order?.note || '',
    payment_method: order?.payment_method || '',
  };
}

export default function OrderDetail({ open, order, availableItems, onClose, onDeleted, onUpdated }) {
  const { message, notification, modal } = App.useApp();
  const screens = Grid.useBreakpoint();
  const [form] = Form.useForm();
  const [items, setItems] = useState(() => buildForm(order).items);
  const [pickupMethod, setPickupMethod] = useState(() => buildForm(order).pickup_method);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const initial = buildForm(order);
      form.setFieldsValue(initial);
      setItems(initial.items);
      setPickupMethod(initial.pickup_method);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const getItemQuantity = (productId) => items.find((i) => i.product_id === productId)?.quantity || 0;

  const updateProductQuantity = (productId, delta) => {
    setItems((prev) => {
      const item = prev.find((i) => i.product_id === productId);
      if (!item) return prev;
      const newQuantity = item.quantity + delta;
      if (newQuantity > 0) {
        return prev.map((i) => (i.product_id === productId ? { ...i, quantity: newQuantity } : i));
      }
      if (newQuantity === 0) {
        return prev.filter((i) => i.product_id !== productId);
      }
      return prev;
    });
  };

  const toggleProduct = (productId) => {
    const product = availableItems.find((i) => i.product_id === productId);
    if (!product) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === productId);
      if (existing) {
        return prev.map((i) => (i.product_id === productId ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          product_id: product.product_id,
          product_name: product.product_name,
          unit_price: product.unit_price,
          image_url: product.image_url,
          quantity: 1,
          is_sliced: false,
        },
      ];
    });
  };

  const updateItemSliced = (productId, is_sliced) => {
    setItems((prev) => prev.map((i) => (i.product_id === productId ? { ...i, is_sliced } : i)));
  };

  const totalAmount = useMemo(() => {
    return items.reduce((total, item) => {
      const product = availableItems.find((p) => p.product_id === item.product_id);
      const price = item.is_sliced && product?.slice_price ? product.slice_price : item.unit_price;
      return total + price * item.quantity;
    }, 0);
  }, [items, availableItems]);

  const handleConfirm = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      message.error('請填寫所有必填項');
      return;
    }
    if (!items.some((item) => item.quantity > 0)) {
      message.error('請至少選擇一個產品');
      return;
    }

    const payload = { ...values, items };
    setUpdateLoading(true);
    try {
      await Orders.Update(order.id, payload);
      notification.success({ message: '成功', description: '訂單已更新' });
      onUpdated?.(payload);
      onClose?.();
    } catch (err) {
      console.error('update order error', err);
      notification.error({ message: '錯誤', description: err.response?.data?.message || '更新訂單失敗，請稍後再試' });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteOrder = () => {
    modal.confirm({
      title: '刪除確認',
      content: '確定要刪除訂單嗎？此操作無法恢復。',
      okText: '確定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        setDeleteLoading(true);
        try {
          await Orders.Delete(order.id);
          notification.success({ message: '成功', description: '訂單已刪除' });
          onDeleted?.();
          onClose?.();
        } catch (err) {
          console.error('delete order error', err);
          notification.error({ message: '錯誤', description: err.response?.data?.message || '刪除訂單失敗，請稍後再試' });
        } finally {
          setDeleteLoading(false);
        }
      },
    });
  };

  return (
    <Modal
      centered
      title="訂購明細"
      width={screens.sm ? '70%' : '90%'}
      open={open}
      onCancel={onClose}
      className="order-detail-dialog"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button danger onClick={handleDeleteOrder} loading={deleteLoading}>
            刪除訂單
          </Button>
          <div>
            <Button onClick={onClose} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" onClick={handleConfirm} loading={updateLoading}>
              確認
            </Button>
          </div>
        </div>
      }
    >
      <div className="order-detail">
        <div className="order-info-section">
          <div className="section-header">
            <h3>客戶資訊</h3>
          </div>
          <Form form={form} className="form-group" labelCol={{ flex: '120px' }} labelAlign="left">
            <div className="form-row">
              <Form.Item
                label="客戶名稱"
                name="customer_name"
                className="form-item"
                rules={[{ required: true, message: '請輸入客戶名稱' }]}
              >
                <Input placeholder="請輸入客戶名稱" />
              </Form.Item>
              <Form.Item
                label="客戶電話"
                name="customer_phone"
                className="form-item"
                rules={[{ required: true, message: '請輸入客戶電話' }]}
              >
                <Input placeholder="請輸入客戶電話" />
              </Form.Item>
            </div>
            <div className="form-row">
              <Form.Item
                label="取件時間"
                name="pickup_time"
                className="form-item"
                rules={[{ required: true, message: '請選擇取件時間' }]}
              >
                <Select placeholder="選擇時間" options={pickupTimeOptions} />
              </Form.Item>
              <Form.Item
                label="付款方式"
                name="payment_method"
                className="form-item"
                rules={[{ required: true, message: '請選擇付款方式' }]}
              >
                <SelectPaymentMethod placeholder="請選擇付款方式" />
              </Form.Item>
            </div>
            <div className="form-row full-width">
              <Form.Item label="取貨方式" name="pickup_method" className="form-item">
                <SelectPickupMethod
                  placeholder="請選擇取貨方式"
                  onChange={(v) => {
                    setPickupMethod(v);
                    form.setFieldsValue({ pickup_method: v });
                  }}
                />
              </Form.Item>
              <Form.Item label="自備購物袋" name="bring_own_bag" className="form-item" valuePropName="checked">
                <Switch />
              </Form.Item>
            </div>
            {pickupMethod === 'delivery' && (
              <div className="form-row full-width">
                <Form.Item label="宅配地址" name="customer_address" className="form-item full-width">
                  <Input placeholder="請輸入宅配地址" />
                </Form.Item>
              </div>
            )}
            <div className="form-row full-width">
              <Form.Item label="備註" name="note" className="form-item full-width">
                <Input.TextArea rows={3} placeholder="請輸入備註" />
              </Form.Item>
            </div>
          </Form>
        </div>

        <div className="items-section">
          <div className="section-header">
            <h3>請選擇當天出爐產品</h3>
          </div>

          <div className="items-list">
            {availableItems.map((product) => (
              <div
                key={product.product_id}
                className={`item-card${!getItemQuantity(product.product_id) ? ' not-selected' : ''}`}
              >
                <div className="item-thumb">
                  {product.image_url && <img src={product.image_url} alt={product.product_name} />}
                </div>
                <div className="item-info">
                  <div className="item-name">{product.product_name}</div>
                  <div className="item-price">
                    <span>{formatPrice(product.unit_price)}</span>
                    {product.is_sliceable && product.slice_price && (
                      <span className="slice-price-hint">切片 {formatPrice(product.slice_price)}</span>
                    )}
                  </div>
                </div>

                <div className="item-actions">
                  {getItemQuantity(product.product_id) > 0 ? (
                    <>
                      {product.is_sliceable && (
                        <div className="slice-control">
                          <span>切</span>
                          <Switch
                            size="small"
                            checked={items.find((i) => i.product_id === product.product_id)?.is_sliced || false}
                            onChange={(checked) => updateItemSliced(product.product_id, checked)}
                          />
                        </div>
                      )}
                      <div className="quantity-control">
                        <Button
                          icon={<MinusOutlined />}
                          shape="circle"
                          onClick={() => updateProductQuantity(product.product_id, -1)}
                        />
                        <span className="quantity-display">{getItemQuantity(product.product_id)}</span>
                        <Button
                          icon={<PlusOutlined />}
                          shape="circle"
                          type="primary"
                          ghost
                          onClick={() => updateProductQuantity(product.product_id, 1)}
                        />
                      </div>
                    </>
                  ) : (
                    <Button type="primary" size="small" onClick={() => toggleProduct(product.product_id)}>
                      新增
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {availableItems.length === 0 && <div className="no-items">沒有可訂購的產品</div>}
        </div>

        <div className="total-section">
          <div className="total-row">
            <span className="label">訂單總計：</span>
            <span className="amount">${totalAmount}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
