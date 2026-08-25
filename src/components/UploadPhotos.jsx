import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import imageCompression from 'browser-image-compression';
import { UploadFile } from '../api/products';
import './UploadPhotos.scss';

const UploadPhotos = forwardRef(function UploadPhotos(
  { value = [], onChange, onUpload, onLoadingChange, disabled = false, max = 3 },
  ref,
) {
  const [isLoading, setIsLoading] = useState(false);

  useImperativeHandle(ref, () => ({ isLoading }), [isLoading]);

  useEffect(() => {
    onLoadingChange?.(isLoading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const canUpload = value.length < max;

  const handleImageUpload = async (event) => {
    const imageFile = event.target.files[0];
    setIsLoading(true);
    try {
      const compressedFile = await imageCompression(imageFile, { maxSizeMB: 0.2 });
      const formData = new FormData();
      formData.append('file', compressedFile);
      const res = await UploadFile.Upload(formData);
      const url = res.data.url;
      if (url) {
        const next = [...value, url];
        onChange?.(next);
        onUpload?.(next);
      }
    } catch (error) {
      console.error('upload photo error', error);
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  const handleDelete = (index) => {
    const next = value.filter((_, i) => i !== index);
    onChange?.(next);
  };

  return (
    <div className="images-uploader">
      <div className={`gallery${value.length > 0 ? ' has-images' : ''}`}>
        {value.map((url, index) => (
          <div key={index} className="image-item">
            <img src={url} alt={`圖片 ${index + 1}`} />
            <DeleteOutlined className="delete-btn" onClick={() => handleDelete(index)} />
          </div>
        ))}

        {canUpload && (
          <label htmlFor="image-upload" className={`upload-box${isLoading || disabled ? ' disabled' : ''}`}>
            <div className="upload-text">{isLoading ? '上傳中...' : '上傳圖片'}</div>
            <small>
              {value.length}/{max}
            </small>
          </label>
        )}
      </div>
      <small className="hint">
        第一張圖片即為封面圖；建議尺寸 600x400，檔案小於 1MB，最多 {max} 張
      </small>
      <input
        type="file"
        id="image-upload"
        accept=".png,.jpg,.jpeg,.webp"
        multiple
        onChange={handleImageUpload}
        disabled={isLoading || disabled}
      />
    </div>
  );
});

export default UploadPhotos;
