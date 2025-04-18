import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getUsers, deleteUser } from '../../services/adminUserService';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/Pagination';
import { useNotification } from '../../contexts/NotificationContext';
import AdminLayout from '../../components/AdminLayout';
import 'bootstrap-icons/font/bootstrap-icons.css';

const UserRoleBadge = ({ role }) => {
  let bgColor = 'bg-gray-100 text-gray-800';
  
  if (role === 'admin') {
    bgColor = 'bg-red-100 text-red-800';
  } else if (role === 'user') {
    bgColor = 'bg-green-100 text-green-800';
  }
  
  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor}`}>
      {role === 'admin' ? 'Quản trị viên' : 
       role === 'user' ? 'Người dùng' : role}
    </span>
  );
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const searchInputRef = useRef(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  
  // Filter state
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [sortBy, setSortBy] = useState('username');
  const [sortOrder, setSortOrder] = useState('asc');
  
  const { showNotification } = useNotification();
  
  const fetchUsers = useCallback(async () => {
    try {
      if (initialLoading) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const result = await getUsers({
        search,
        role,
        page,
        limit,
        sortBy,
        sortOrder
      });
      
      if (result.success) {
        setUsers(result.users);
        setTotalPages(result.pagination.totalPages);
      } else {
        setError(result.message || 'Không thể tải danh sách người dùng');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi tải danh sách người dùng');
      console.error('Error fetching users:', err);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  }, [search, role, page, limit, sortBy, sortOrder, initialLoading]);
  
  // Gọi API khi tham số tìm kiếm hoặc lọc thay đổi
  useEffect(() => {
    fetchUsers();
  }, [search, role, sortBy, sortOrder, page, fetchUsers]);
  
  const handleSearchChange = (e) => {
    // Sanitize input by removing special characters
    const rawValue = e.target.value;
    const sanitizedValue = rawValue.replace(/[+\-.,/\\[\]{}()*^%$#@!~`|<>?=&]/g, '');
    
    // Update input field with sanitized value
    e.target.value = sanitizedValue;
    setSearch(sanitizedValue);
    setPage(1); // Reset về trang 1 khi tìm kiếm
  };
  
  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setPage(1); // Reset về trang 1 khi thay đổi bộ lọc
  };
  
  const handleSortChange = (e) => {
    const value = e.target.value;
    
    if (value === 'username-asc') {
      setSortBy('username');
      setSortOrder('asc');
    } else if (value === 'username-desc') {
      setSortBy('username');
      setSortOrder('desc');
    }
    
    setPage(1); // Reset về trang 1 khi thay đổi sắp xếp
  };
  
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };
  
  const handleDeleteClick = (user) => {
    setConfirmDelete(user);
  };
  
  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    
    try {
      setDeletingUser(confirmDelete._id);
      const result = await deleteUser(confirmDelete._id);
      
      if (result.success) {
        showNotification(result.message || 'Đã xóa người dùng thành công', 'success');
        // Cập nhật lại danh sách người dùng
        fetchUsers();
      } else {
        showNotification(result.message || 'Không thể xóa người dùng', 'error');
      }
    } catch (err) {
      showNotification('Đã xảy ra lỗi khi xóa người dùng', 'error');
      console.error('Error deleting user:', err);
    } finally {
      setDeletingUser(null);
      setConfirmDelete(null);
    }
  };
  
  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };
  
  if (initialLoading) {
    return <Spinner />;
  }
  
  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý người dùng</h1>
        <Link 
          to="/admin/users/add" 
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center"
        >
          <i className="bi bi-plus-lg mr-2"></i>
          Thêm người dùng
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <span className="font-bold">Lỗi:</span> {error}
        </div>
      )}
      
      {/* Filter and Search */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="flex-1">
            <div className="flex">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Tìm kiếm theo tên người dùng (username)..."
                className="w-full px-4 py-2 border rounded-l-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                value={search}
                onChange={handleSearchChange}
              />
              <button 
                className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 flex items-center justify-center"
              >
                <i className="bi bi-search"></i>
              </button>
            </div>
          </div>
          
          <div>
            <select
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              value={role}
              onChange={handleRoleChange}
            >
              <option value="">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="user">Người dùng</option>
            </select>
          </div>
          
          <div>
            <select
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={`${sortBy}-${sortOrder}`}
              onChange={handleSortChange}
            >
              <option value="username-asc">Tên tài khoản (A-Z)</option>
              <option value="username-desc">Tên tài khoản (Z-A)</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* User Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-4">
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-sm text-gray-500">Đang tải...</span>
            </div>
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên tài khoản
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <UserRoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/admin/users/${user._id}`} 
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Chỉnh sửa
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(user)}
                        disabled={deletingUser === user._id}
                        className="text-red-600 hover:text-red-900"
                      >
                        {deletingUser === user._id ? 'Đang xóa...' : 'Xóa'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>Không tìm thấy người dùng nào.</p>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination 
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Xác nhận xóa</h3>
            <p className="mb-6">
              Bạn có chắc chắn muốn xóa người dùng <span className="font-semibold">{confirmDelete.username}</span>? 
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Users;
