import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Modal, Form, Input, Select, Switch, Button, App } from 'antd';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Orders } from '../../api/orders';
import SelectPaymentMethod from '../select/SelectPaymentMethod';
import SelectPickupMethod from '../select/SelectPickupMethod';
import { generateTimeOptions } from '../../utils/time';
import { formatPrice } from '../../utils/format';
import './OrderCreate.scss';

const defaultFormValues = {
  customer_name: '',
  customer_phone: '',
  pickup_time: '',
  pickup_method: 'pickup',
  bring_own_bag: false,
  note: '',
  payment_method: 'cash',
};

const OrderCreate = forwardRef(function OrderCreate({ onCreated }, ref) {
  const { message, notification } = App.useApp();
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [shopInfo, setShopInfo] = useState(null);
  const [pickupMethod, setPickupMethod] = useState('pickup');
  const [quantities, setQuantities] = useState({});
  const [isSliced, setIsSliced] = useState({});

  const availableProducts = useMemo(() => {
    if (!currentSchedule?.items) return [];
    return currentSchedule.items.map((item) => ({
      schedule_item_id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      unit_price: item.unit_price,
      slice_price: item.slice_price ?? null,
      sales_limit: item.sales_limit,
      image_url: item.image_url,
      is_sliceable: item.is_sliceable ?? false,
    }));
  }, [currentSchedule]);

  const findProduct = (productId) => availableProducts.find((item) => item.product_id === productId);

  const pickupTimeStart = shopInfo?.orderPickupTime || '09:00';
  const pickupTimeEnd = useMemo(() => {
    const date = currentSchedule?.schedule_date;
    if (!date || !shopInfo?.businessHours) return '20:00';
    const dow = dayjs(date).day();
    const hours = shopInfo.businessHours.find((h) => h.day === dow && h.enabled);
    return hours?.time?.[1] || '20:00';
  }, [currentSchedule, shopInfo]);

  const pickupTimeOptions = useMemo(
    () => generateTimeOptions(pickupTimeStart, pickupTimeEnd, 30),
    [pickupTimeStart, pickupTimeEnd],
  );

  useImperativeHandle(ref, () => ({
    open: (schedule, shop = null) => {
      if (!schedule || !schedule.items || schedule.items.length === 0) {
        message.warning('此排程尚無可訂購的產品');
        return;
      }
      setCurrentSchedule(schedule);
      setShopInfo(shop);
      form.resetFields();
      form.setFieldsValue(defaultFormValues);
      setPickupMethod('pickup');
      const nextQuantities = {};
      const nextSliced = {};
      schedule.items.forEach((item) => {
        nextQuantities[item.product_id] = 0;
        nextSliced[item.product_id] = false;
      });
      setQuantities(nextQuantities);
      setIsSliced(nextSliced);
      setVisible(true);
    },
    close: () => setVisible(false),
  }));

  const incrementQuantity = (productId) => setQuantities((q) => ({ ...q, [productId]: (q[productId] || 0) + 1 }));
  const decrementQuantity = (productId) =>
    setQuantities((q) => ({ ...q, [productId]: Math.max(0, (q[productId] || 0) - 1) }));

  const selectedItemsCount = useMemo(
    () => Object.values(quantities).reduce((sum, qty) => sum + qty, 0),
    [quantities],
  );

  const totalAmount = useMemo(() => {
    let total = 0;
    Object.keys(quantities).forEach((productId) => {
      const quantity = quantities[productId];
      if (quantity > 0) {
        const product = findProduct(productId);
        if (product) {
          const sliced = isSliced[productId];
          const price = sliced && product.slice_price != null ? product.slice_price : product.unit_price;
          total += price * quantity;
        }
      }
    });
    return total;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantities, isSliced, availableProducts]);

  const close = () => setVisible(false);

  const handleSubmit = async () => {
    if (selectedItemsCount === 0) {
      message.warning('請至少選擇一個產品');
      return;
    }
    let values;
    try {
      values = await form.validateFields();
    } catch {
      message.warning('請完整填寫必填欄位');
      return;
    }

    const items = [];
    Object.keys(quantities).forEach((productId) => {
      const quantity = quantities[productId];
      if (quantity > 0) {
        const product = findProduct(productId);
        if (product) {
          items.push({
            schedule_item_id: product.schedule_item_id,
            product_id: productId,
            quantity,
            is_sliced: Boolean(isSliced[productId]),
          });
        }
      }
    });

    setIsLoading(true);
    try {
      const res = await Orders.Create({ ...values, items });
      notification.success({ message: '成功', description: '訂單已建立成功' });
      onCreated?.(res.data);
      close();
    } catch (err) {
      console.error('create order error', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title="建立訂單"
      width="70%"
      open={visible}
      onCancel={close}
      mask={{ closable: false }}
      footer={
        <div className="dialog-footer">
          <Button onClick={close} disabled={isLoading}>
            取消
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={isLoading}>
            {isLoading ? '建立中...' : '建立訂單'}
          </Button>
        </div>
      }
    >
      <Form form={form} labelCol={{ flex: '100px' }} labelAlign="left">
        <div className="form-row">
          <Form.Item label="姓名" name="customer_name" rules={[{ required: true, message: '請輸入顧客姓名' }]}>
            <Input placeholder="請輸入顧客姓名" allowClear />
          </Form.Item>
          <Form.Item label="電話" name="customer_phone" rules={[{ required: true, message: '請輸入顧客電話' }]}>
            <Input placeholder="顧客電話，例如：0912345678" allowClear maxLength={10} inputMode="numeric" />
          </Form.Item>
        </div>

        <div className="form-row">
          <Form.Item label="取貨時間" name="pickup_time" rules={[{ required: true, message: '請選擇取貨時間' }]}>
            <Select placeholder="選擇時間" options={pickupTimeOptions} />
          </Form.Item>
          <Form.Item label="付款方式" name="payment_method" rules={[{ required: true, message: '請選擇付款方式' }]}>
            <SelectPaymentMethod placeholder="選擇付款方式" />
          </Form.Item>
        </div>

        <div className="form-row">
          <Form.Item label="取貨方式" name="pickup_method" rules={[{ required: true, message: '請選擇取貨方式' }]}>
            <SelectPickupMethod
              placeholder="請選擇取貨方式"
              onChange={(v) => {
                setPickupMethod(v);
                form.setFieldsValue({ pickup_method: v });
              }}
            />
          </Form.Item>
          <Form.Item label="自備購物袋" name="bring_own_bag" valuePropName="checked">
            <Switch />
          </Form.Item>
        </div>

        {pickupMethod === 'DELIVERY' && (
          <Form.Item label="宅配地址" name="customer_address">
            <Input placeholder="請輸入宅配地址" />
          </Form.Item>
        )}

        <Form.Item label="訂單備註" name="note">
          <Input.TextArea rows={3} placeholder="請輸入訂單備註（選填）" />
        </Form.Item>

        <div className="items-divider">
          訂單項目
          {selectedItemsCount > 0 && (
            <span style={{ marginLeft: 8 }}>
              (已選 {selectedItemsCount} 項 | 小計 {formatPrice(totalAmount)})
            </span>
          )}
        </div>

        <div className="products-list">
          {availableProducts.map((product) => (
            <div
              key={product.product_id}
              className={`product-item${(quantities[product.product_id] || 0) > 0 ? ' product-selected' : ''}`}
            >
              <div className="product-thumb">
                {product.image_url && <img src={product.image_url} alt={product.product_name} />}
              </div>
              <div className="product-info">
                <div className="product-name">{product.product_name}</div>
                <div className="product-price">
                  {product.is_sliceable && product.slice_price != null ? (
                    <>
                      <span className={isSliced[product.product_id] ? 'price-inactive' : ''}>
                        {formatPrice(product.unit_price)}
                      </span>
                      <span className="price-slash">／切片 {formatPrice(product.slice_price)}</span>
                    </>
                  ) : (
                    formatPrice(product.unit_price)
                  )}
                </div>
              </div>
              {(quantities[product.product_id] || 0) > 0 && product.is_sliceable && (
                <div className="slice-control">
                  <span>切</span>
                  <Switch
                    size="small"
                    checked={!!isSliced[product.product_id]}
                    onChange={(checked) => setIsSliced((s) => ({ ...s, [product.product_id]: checked }))}
                  />
                </div>
              )}
              <div className="quantity-control">
                <Button
                  icon={<MinusOutlined />}
                  shape="circle"
                  disabled={(quantities[product.product_id] || 0) === 0}
                  onClick={() => decrementQuantity(product.product_id)}
                />
                <span className="quantity-display">{quantities[product.product_id] || 0}</span>
                <Button
                  icon={<PlusOutlined />}
                  shape="circle"
                  type="primary"
                  ghost
                  onClick={() => incrementQuantity(product.product_id)}
                />
              </div>
            </div>
          ))}
        </div>
      </Form>
    </Modal>
  );
});

export default OrderCreate;
