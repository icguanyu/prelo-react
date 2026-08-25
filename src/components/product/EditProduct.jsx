import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Modal, Form, Input, InputNumber, Switch, Divider, Button, App } from 'antd';
import { Products } from '../../api/products';
import SelectCategory from '../select/SelectCategory';
import SelectProductStatus from '../select/SelectProductStatus';
import UploadPhotos from '../UploadPhotos';
import EditCategory from './EditCategory';

const defaultValues = {
  name: '',
  category_id: '',
  price: 0,
  description: '',
  ingredients: '',
  is_active: true,
  is_sliceable: false,
  slice_price: null,
};

const EditProduct = forwardRef(function EditProduct({ onUpdate }, ref) {
  const { message, notification, modal } = App.useApp();
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [productId, setProductId] = useState(null);
  const [imageUrls, setImageUrls] = useState([]);
  const editCategoryRef = useRef(null);
  const selectCategoryRef = useRef(null);
  const isSliceable = Form.useWatch('is_sliceable', form);

  const fetchProductById = async (id) => {
    setIsLoading(true);
    try {
      const res = await Products.GetById(id);
      const data = res.data;
      setProductId(data.id);
      setImageUrls(data.image_urls || []);
      form.setFieldsValue(data);
    } catch (err) {
      console.error('get product by id error', err);
      message.error('載入商品資料失敗，請稍後再試');
      setVisible(false);
    } finally {
      setIsLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    open: (id) => {
      form.resetFields();
      form.setFieldsValue(defaultValues);
      setProductId(null);
      setImageUrls([]);
      setVisible(true);
      if (id) fetchProductById(id);
    },
    close: () => setVisible(false),
  }));

  const save = async (values) => {
    setIsLoading(true);
    try {
      const payload = { ...values, image_urls: imageUrls, ingredient_details: [] };
      if (productId) {
        await Products.Update(productId, payload);
        notification.success({ message: '成功', description: '商品已更新' });
      } else {
        const res = await Products.Create(payload);
        setProductId(res.data?.id ?? res.data?.data?.id);
        notification.success({ message: '成功', description: '商品已新增，可繼續上傳圖片' });
      }
      onUpdate?.();
    } catch (err) {
      console.error('save product error', err);
      message.error('儲存失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  const beforeSave = async () => {
    try {
      const values = await form.validateFields();
      await save(values);
    } catch {
      // 驗證失敗，不儲存
    }
  };

  const handleUploadChange = (urls) => {
    setImageUrls(urls);
    beforeSave();
  };

  const handleSliceableChange = (checked) => {
    form.setFieldsValue({ slice_price: checked ? form.getFieldValue('price') : null });
  };

  const deleteProduct = () => {
    modal.confirm({
      title: '刪除確認',
      content: '確定要刪除此商品嗎？此操作無法恢復。',
      okText: '確定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        setIsLoading(true);
        try {
          await Products.Delete(productId);
          notification.success({ message: '成功', description: '商品已刪除' });
          setVisible(false);
          onUpdate?.();
        } catch (err) {
          console.error('delete product error', err);
          message.error('刪除商品失敗，請稍後再試');
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  return (
    <>
      <EditCategory ref={editCategoryRef} onClose={() => selectCategoryRef.current?.refresh()} />
      <Modal
        title={productId ? '編輯商品' : '新增商品'}
        width={640}
        open={visible}
        onCancel={() => setVisible(false)}
        footer={
          <div
            style={{
              display: 'flex',
              justifyContent: productId ? 'space-between' : 'center',
              alignItems: 'center',
              width: '100%',
            }}
          >
            {productId && (
              <Button danger onClick={deleteProduct} loading={isLoading}>
                刪除商品
              </Button>
            )}
            <div>
              <Button onClick={() => setVisible(false)} style={{ marginRight: 8 }}>
                取消
              </Button>
              <Button type="primary" onClick={beforeSave} loading={isLoading || uploadLoading}>
                {uploadLoading ? '上傳中...' : productId ? '儲存' : '新增'}
              </Button>
            </div>
          </div>
        }
      >
        <Form
          form={form}
          disabled={isLoading}
          labelCol={{ flex: '120px' }}
          wrapperCol={{ flex: 'auto' }}
          labelAlign="left"
        >
          <Form.Item label="產品名稱" name="name" rules={[{ required: true, message: '請輸入產品名稱' }]}>
            <Input placeholder="產品名稱（例：原味軟法）" />
          </Form.Item>
          <Form.Item label="產品類別" name="category_id" rules={[{ required: true, message: '請選擇產品類別' }]}>
            <SelectCategory ref={selectCategoryRef} onManage={() => editCategoryRef.current?.open()} />
          </Form.Item>
          <Form.Item label="產品定價" name="price" rules={[{ required: true, message: '請輸入產品定價' }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="產品簡介" name="description">
            <Input.TextArea rows={3} placeholder="產品簡短介紹" />
          </Form.Item>
          <Form.Item label="成分介紹" name="ingredients">
            <Input.TextArea rows={3} placeholder="例如：高筋麵粉、牛奶、酵母、鹽、糖" />
          </Form.Item>
          <Form.Item label="可切片" name="is_sliceable" valuePropName="checked">
            <Switch onChange={handleSliceableChange} />
          </Form.Item>
          {isSliceable && (
            <Form.Item label="切片售價" name="slice_price" required>
              <InputNumber style={{ width: '100%' }} placeholder="切片售價(整份)" />
            </Form.Item>
          )}
          <Form.Item label="狀態" name="is_active" rules={[{ required: true, message: '請選擇產品狀態' }]}>
            <SelectProductStatus placeholder="選擇產品狀態" />
          </Form.Item>
          <Divider />
          <Form.Item label="商品圖片">
            <UploadPhotos value={imageUrls} onChange={handleUploadChange} onLoadingChange={setUploadLoading} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
});

export default EditProduct;
