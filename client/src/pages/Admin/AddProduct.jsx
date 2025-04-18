import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createProduct } from '../../services/adminProductService';
import { getCategories } from '../../services/adminCategoryService';
import AdminSidebar from '../../components/AdminSidebar';
import 'bootstrap-icons/font/bootstrap-icons.css';

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Product form state
  const [productData, setProductData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    rating: ''
  });
  
  // File upload state
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  // Load existing categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        if (response.success) {
          // Make sure we only use the necessary fields from categories
          const simplifiedCategories = response.categories.map(cat => ({
            _id: cat._id,
            name: cat.name
          }));
          setCategories(simplifiedCategories);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductData({
      ...productData,
      [name]: value
    });
  };
  
  // Handle file input change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
      };
      fileReader.readAsDataURL(selectedFile);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Validate form
      if (!productData.name.trim()) {
        setError('Tên sản phẩm là bắt buộc');
        setLoading(false);
        return;
      }
      
      if (!productData.price || isNaN(parseFloat(productData.price)) || parseFloat(productData.price) <= 0) {
        setError('Giá sản phẩm không hợp lệ');
        setLoading(false);
        return;
      }
      
      // Create FormData object
      const formData = new FormData();
      
      // Append product data
      Object.keys(productData).forEach(key => {
        if (productData[key]) {
          formData.append(key, productData[key]);
        }
      });
      
      // Append file if selected
      if (file) {
        formData.append('image', file);
      }
      
      // Submit form
      const response = await createProduct(formData);
      
      if (response.success) {
        setSuccess(true);
        // Reset form
        setProductData({
          name: '',
          price: '',
          description: '',
          category: '',
          rating: ''
        });
        setFile(null);
        setPreviewUrl('');
        
        // Redirect after success
        setTimeout(() => {
          navigate('/admin/products');
        }, 2000);
      } else {
        setError(response.message || 'Có lỗi xảy ra khi thêm sản phẩm');
      }
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err.response?.data?.message || 'Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Thêm Sản Phẩm Mới</h1>
          <Link 
            to="/admin/products" 
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md flex items-center"
          >
            <i className="bi bi-arrow-left mr-2"></i>
            Quay lại
          </Link>
        </div>
        
        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <div className="flex items-center">
              <i className="bi bi-check-circle mr-2"></i>
              <span>Thêm sản phẩm thành công! Đang chuyển hướng...</span>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <div className="flex items-center">
              <i className="bi bi-exclamation-triangle mr-2"></i>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {/* Add Product Form */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Tên sản phẩm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={productData.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                        Giá (VNĐ) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={productData.price}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                        min="0"
                      />
                    </div>
                    <div>
                      <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                        Đánh giá (0-5)
                      </label>
                      <input
                        type="number"
                        id="rating"
                        name="rating"
                        value={productData.rating}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        min="0"
                        max="5"
                        step="0.1"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                        Danh mục sản phẩm
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={productData.category}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Chọn danh mục sản phẩm --</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      {productData.category === 'new' ? (
                        <div>
                          <label htmlFor="newCategory" className="block text-sm font-medium text-gray-700 mb-1">
                            Danh mục mới
                          </label>
                          <input
                            type="text"
                            id="newCategory"
                            name="category"
                            value=""
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Nhập tên danh mục mới"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả sản phẩm
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={productData.description}
                      onChange={handleInputChange}
                      rows="5"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    ></textarea>
                  </div>
                </div>
                
                <div>
                  <div className="mb-4">
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                      Hình ảnh sản phẩm
                    </label>
                    <input
                      type="file"
                      id="image"
                      name="image"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Kích thước tối đa: 5MB. Định dạng: JPG, PNG, WEBP
                    </p>
                  </div>
                  
                  {previewUrl && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Xem trước:</p>
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-auto rounded-md object-cover max-h-48"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-8">
                <button
                  type="submit"
                  className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-circle mr-2"></i>
                      Thêm sản phẩm
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct; 