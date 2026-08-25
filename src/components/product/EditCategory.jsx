import { forwardRef, useImperativeHandle, useState } from 'react';
import { Modal, Input, Button, App, Empty, Spin } from 'antd';
import { MinusOutlined } from '@ant-design/icons';
import { ProductCategory } from '../../api/products';
import './EditCategory.css';

const EditCategory = forwardRef(function EditCategory({ onUpdated, onClose }, ref) {
  const { notification, modal } = App.useApp();
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await ProductCategory.List();
      setCategories(res.data.data);
    } catch (err) {
      console.error('fetch categories error', err);
    } finally {
      setIsLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    open: () => {
      setVisible(true);
      fetchCategories();
    },
    close: () => setVisible(false),
  }));

  const addCategory = async () => {
    setIsLoading(true);
    try {
      await ProductCategory.Create({ name: newCategoryName });
      notification.success({ message: '成功', description: '已新增種類' });
      setNewCategoryName('');
      await fetchCategories();
      onUpdated?.();
    } catch (error) {
      console.error('save category error', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeCategory = (id) => {
    modal.confirm({
      title: '警告',
      content: '確定要刪除這個種類嗎？',
      okText: '確定',
      cancelText: '取消',
      onOk: async () => {
        setIsLoading(true);
        try {
          await ProductCategory.Delete(id);
          notification.success({ message: '成功', description: '已刪除種類' });
          await fetchCategories();
          onUpdated?.();
        } catch (error) {
          console.error('delete category error', error);
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  return (
    <Modal
      title="編輯商品種類"
      width={800}
      open={visible}
      onCancel={handleClose}
      destroyOnHidden
      mask={{ closable: false }}
      footer={
        <Button onClick={handleClose}>返回</Button>
      }
    >
      <div className="edit-category-layout">
        <Spin spinning={isLoading}>
          <section className="list">
            <header>
              <h3>現有種類</h3>
              <small>若種類被移除，原已存在的商品將被歸類為「未分類」</small>
            </header>
            {categories.length ? (
              <div className="chips">
                {categories.map((item) => (
                  <div className="chip" key={item.id}>
                    <div className="chip__title">{item.name}</div>
                    <Button size="small" icon={<MinusOutlined />} shape="circle" onClick={() => removeCategory(item.id)} />
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="目前沒有種類" />
            )}
          </section>
        </Spin>

        <section className="form">
          <header>
            <h3>新增種類</h3>
          </header>
          <div className="field">
            <label>名稱</label>
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="輸入種類名稱"
            />
          </div>
          <Button type="primary" onClick={addCategory} disabled={!newCategoryName.trim()}>
            新增
          </Button>
        </section>
      </div>
    </Modal>
  );
});

export default EditCategory;
