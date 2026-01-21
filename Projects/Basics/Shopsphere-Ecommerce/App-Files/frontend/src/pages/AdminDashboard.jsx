// frontend/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, u, p] = await Promise.all([
          api.get('/admin/stats', { withCredentials: true }),
          api.get('/admin/users', { withCredentials: true }),
          api.get('/admin/products', { withCredentials: true })
        ]);
        setStats(s.data);
        setUsers(u.data);
        setProducts(p.data);
      } catch (err) {
        alert('Failed to load data: ' + (err.response?.data?.message || 'Unknown error'));
      }
    };
    fetchData();
  }, []);

  // Handle user deletion
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`, { withCredentials: true });
      alert('User deleted successfully');
      // Refresh user list
      const res = await api.get('/admin/users', { withCredentials: true });
      setUsers(res.data);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'Failed to delete user'));
    }
  };



const [newProduct, setNewProduct] = useState({
  name: '',
  description: '',
  price: '',
  category: '',
  image: '',
  stock: ''
});

const [editingProduct, setEditingProduct] = useState(null);

// Add new product
const handleAddProduct = async (e) => {
  e.preventDefault();

  try {
    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('description', newProduct.description);
    formData.append('price', newProduct.price);
    formData.append('category', newProduct.category);
    formData.append('stock', newProduct.stock || 0);

    // We can't append file here because we're not uploading file in frontend
    // Instead, we'll keep using image URL for preview, but backend will handle actual upload

    alert('Image upload must be done through direct form submission with file input.');
  } catch (err) {
    alert('Error: ' + (err.response?.data?.message || 'Failed to add product'));
  }
};




// Edit product
const handleEditProduct = (product) => {
  setEditingProduct(product);
  setNewProduct({ ...product });
};

// Update product
const handleUpdateProduct = async () => {
  try {
    await api.put(`/products/${editingProduct._id}`, newProduct, { withCredentials: true });
    alert('Product updated!');
    setEditingProduct(null);
    setNewProduct({
      name: '',
      description: '',
      price: '',
      category: '',
      image: '',
      stock: ''
    });
    const res = await api.get('/admin/products', { withCredentials: true });
    setProducts(res.data);
  } catch (err) {
    alert('Error: ' + (err.response?.data?.message || 'Failed to update'));
  }
};

// Delete product
const handleDeleteProduct = async (id, name) => {
  if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
  try {
    await api.delete(`/products/${id}`, { withCredentials: true });
    alert('Product deleted');
    const res = await api.get('/admin/products', { withCredentials: true });
    setProducts(res.data);
  } catch (err) {
    alert('Error: ' + (err.response?.data?.message || 'Failed to delete'));
  }
};



return (
  <div>
    <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Add New Product Form */}
      <div className="bg-indigo-50 p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4 text-indigo-800">Add New Product</h2>

        <form
          onSubmit={async (e) => {
            e.preventDefault();

            const formData = new FormData();
            formData.append('name', newProduct.name);
            formData.append('description', newProduct.description);
            formData.append('price', newProduct.price);
            formData.append('category', newProduct.category);
            formData.append('stock', newProduct.stock || 0);

            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput?.files[0]) {
              formData.append('image', fileInput.files[0]);
            }

            try {
              const url = editingProduct
                ? `/api/products/${editingProduct._id}`
                : '/api/products';

              const res = await fetch(url, {
                method: editingProduct ? 'PUT' : 'POST',
                body: formData,
                credentials: 'include'
              });

              if (res.ok) {
                const data = await res.json();
                alert(`Product ${editingProduct ? 'updated' : 'added'}!`);
                setEditingProduct(null);
                setNewProduct({
                  name: '', description: '', price: '', category: '', image: '', stock: ''
                });
                const prodRes = await api.get('/admin/products', { withCredentials: true });
                setProducts(prodRes.data);
              } else {
                const err = await res.json();
                alert('Error: ' + (err.message || 'Failed'));
              }
            } catch (err) {
              alert('Network error: ' + err.message);
            }
          }}
          encType="multipart/form-data"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Product Name */}
          <input
            type="text"
            placeholder="Product Name"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            required
            className="border p-2 rounded"
          />

          {/* Price */}
          <input
            type="number"
            placeholder="Price"
            step="0.01"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            required
            className="border p-2 rounded"
          />

          {/* Category */}
            <select
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              required
              className="border p-2 rounded w-full"
            >
              <option value="" disabled>Select Category</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Books">Books</option>
              <option value="Home & Garden">Home & Garden</option>
              <option value="Toys">Toys</option>
              <option value="Other">Other</option>
              {/* Allow any existing category */}
              {newProduct.category && ![
                'Electronics', 'Clothing', 'Books', 'Home & Garden', 'Toys', 'Other'
              ].includes(newProduct.category) && (
                <option value={newProduct.category} selected>
                  {newProduct.category}
                </option>
              )}
            </select>
          {/* <select
            value={newProduct.category}
            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
            required
            className="border p-2 rounded w-full"
          >
            <option value="" disabled>Select Category</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Books">Books</option>
            <option value="Home & Garden">Home & Garden</option>
            <option value="Toys">Toys</option>
            <option value="Other">Other</option>
          </select> */}

          {/* Stock */}
          <input
            type="number"
            placeholder="Stock"
            value={newProduct.stock}
            onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
            className="border p-2 rounded"
          />

          {/* Description */}
          <textarea
            placeholder="Description"
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            required
            className="border p-2 rounded md:col-span-2"
            rows="3"
          />

          {/* Image Upload */}
          <div className="md:col-span-2 space-y-2">
            <label className="block mb-1 font-medium">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files[0]) {
                  const file = e.target.files[0];
                  const reader = new FileReader();
                  reader.onload = () => {
                    setNewProduct({ ...newProduct, image: reader.result });
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="border p-2 rounded w-full"
            />
            {newProduct.image && newProduct.image.startsWith('data:') && (
              <div className="mt-2">
                <img
                  src={newProduct.image}
                  alt="Preview"
                  className="w-32 h-32 object-cover border rounded"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 md:col-span-2"
          >
            {editingProduct ? 'Update Product' : 'Add Product'}
          </button>
        </form>
      </div>


    {/* Stats */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-4 rounded shadow text-center">
        <h3 className="text-gray-500">Total Users</h3>
        <p className="text-2xl font-bold">{stats.totalUsers}</p>
      </div>
      <div className="bg-white p-4 rounded shadow text-center">
        <h3 className="text-gray-500">Products</h3>
        <p className="text-2xl font-bold">{stats.totalProducts}</p>
      </div>
      <div className="bg-white p-4 rounded shadow text-center">
        <h3 className="text-gray-500">Orders</h3>
        <p className="text-2xl font-bold">{stats.totalOrders}</p>
      </div>
      <div className="bg-white p-4 rounded shadow text-center">
        <h3 className="text-gray-500">Revenue</h3>
        <p className="text-2xl font-bold">${stats.revenue?.toFixed(2) || '0.00'}</p>
      </div>
    </div>

    {/* Users Table */}
    <div className="bg-white p-6 rounded-lg shadow mb-8">
      <h2 className="text-xl font-bold mb-4">Users</h2>
      {users.length === 0 ? (
        <p className="text-gray-500">No users found.</p>
      ) : (
        <table className="min-w-full border rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 border-b text-left">Name</th>
              <th className="py-2 px-4 border-b text-left">Email</th>
              <th className="py-2 px-4 border-b text-left">Role</th>
              <th className="py-2 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{u.name}</td>
                <td className="py-2 px-4 border-b">{u.email}</td>
                <td className="py-2 px-4 border-b">
                  {u.isAdmin ? (
                    <span className="text-red-600 font-medium">Admin</span>
                  ) : (
                    <span className="text-green-600">User</span>
                  )}
                </td>
                <td className="py-2 px-4 border-b">
                  {!u.isAdmin ? (
                    <button
                      onClick={() => handleDeleteUser(u._id, u.name)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                  ) : (
                    <span className="text-gray-400 text-sm">Cannot delete</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>

    {/* Products Table */}
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Products</h2>
      {products.length === 0 ? (
        <p className="text-gray-500">No products found.</p>
      ) : (
        <table className="min-w-full border rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 border-b text-left">Name</th>
              <th className="py-2 px-4 border-b text-left">Price</th>
              <th className="py-2 px-4 border-b text-left">Stock</th>
              <th className="py-2 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{p.name}</td>
                <td className="py-2 px-4 border-b">${p.price}</td>
                <td className="py-2 px-4 border-b">{p.stock}</td>
                <td className="py-2 px-4 border-b space-x-2">
                  <Link to={`/product/${p._id}`} className="text-blue-600 hover:underline text-sm">View</Link>
                  <button
                    onClick={() => handleEditProduct(p)}
                    className="text-yellow-600 hover:underline text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p._id, p.name)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);

};

export default AdminDashboard;