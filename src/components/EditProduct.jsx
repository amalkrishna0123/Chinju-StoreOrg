import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { db } from "../Firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { ArrowLeft, Save, X, Upload, AlertCircle, Image } from "lucide-react";
import {
  FiArrowLeft,
  FiImage,
  FiUpload,
  FiX,
  FiAlertCircle,
  FiMenu,
  FiLogOut,
  FiUser,
  FiShoppingBag,
  FiLayers,
  FiGrid,
  FiBell,
  FiSearch,
  FiUsers,
  FiShoppingCart,
  FiStar
} from "react-icons/fi";
import { MdDeliveryDining, MdReviews } from "react-icons/md";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { query, where } from "firebase/firestore";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [unreadOrderCount, setUnreadOrderCount] = useState(0);

  const [product, setProduct] = useState({
    name: "",
    imageBase64: "",
    subImagesBase64: [],
    originalPrice: "",
    offer: "",
    salePrice: "",
    brand: "",
    description: "",
    packedDate: "",
    expiryDate: "",
    imported: false,
    organic: false,
    stock: '',
    weight: '',
    shelfLife: "",
    category: "",
  });

  const [categories, setCategories] = useState([]);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, "categories"));
        const allCats = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const mainCats = allCats.filter((cat) => cat.type === "main");
        const subCats = allCats.filter((cat) => cat.type === "sub");

        const subWithMainLabel = subCats.map((sub) => {
          const parent = mainCats.find((main) => main.id === sub.parentId);
          return {
            id: sub.id,
            name: sub.name,
            label: parent ? `${parent.name} → ${sub.name}` : sub.name,
          };
        });

        setCategories(subWithMainLabel);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories. Please try again.");
      }
    };

    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({
            ...data,
            subImagesBase64: data.subImagesBase64 || [],
            packedDate: data.packedDate || "",
            expiryDate: data.expiryDate || "",
            imported: data.imported || false,
            organic: data.organic === true || data.organic === "Yes",
            shelfLife: data.shelfLife || "",
          });
          setPreview(data.imageBase64 || null);
        } else {
          setError("Product not found.");
        }
      } catch (err) {
        setError("Failed to fetch product: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    fetchProduct();
  }, [id]);
  const handleNotificationClick = () => {
    navigate('/dashboard/orderdetails');
  };
  const fetchProductsByCategory = async (categoryName) => {
    const q = query(
      collection(db, "products"),
      where("category", "==", categoryName)
    );
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return products;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setProduct((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setProduct((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (name === "originalPrice" || name === "offer") {
      const originalPrice = parseFloat(
        name === "originalPrice" ? value : product.originalPrice
      );
      const offer = parseFloat(name === "offer" ? value : product.offer);
      if (!isNaN(originalPrice) && !isNaN(offer)) {
        const discounted = originalPrice - (originalPrice * offer) / 100;
        setProduct((prev) => ({ ...prev, salePrice: discounted.toFixed(2) }));
      }
    }

    // Clear any previous error/success messages when user makes changes
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProduct((prev) => ({ ...prev, imageBase64: reader.result }));
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProduct((prev) => ({
          ...prev,
          subImagesBase64: [...prev.subImagesBase64, reader.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeSubImage = (index) => {
    setProduct((prev) => ({
      ...prev,
      subImagesBase64: prev.subImagesBase64.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!product.name || !product.imageBase64 || !product.originalPrice) {
      setError("Please fill all required fields.");
      window.scrollTo(0, 0);
      return;
    }

    try {
      setSaving(true);
      const docRef = doc(db, "products", id);
      await updateDoc(docRef, product);
      setSuccess("Product updated successfully!");

      // Show success message briefly before navigating
      setTimeout(() => {
        navigate("/dashboard/view-product");
      }, 1500);
    } catch (err) {
      setError("Failed to update product: " + err.message);
      window.scrollTo(0, 0);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    navigate("/login");
  };

  const menuItems = [
    { label: "Dashboard", path: "/dashboard", icon: <FiGrid /> },
    {
      label: "Categories",
      path: "/dashboard/view-category",
      icon: <FiLayers />,
    },
    {
      label: "Products",
      path: "/dashboard/view-product",
      icon: <FiShoppingBag />,
    },
    { label: "Banners", path: "/dashboard/view-banner", icon: <FiImage /> },
    {
      label: "Orders",
      path: "/dashboard/orderdetails",
      icon: <FiShoppingCart />,
    },
    { label: "Users", path: "/dashboard/users", icon: <FiUsers /> },
    {
      label: "Delivery Boys",
      path: "/dashboard/delivery-boys",
      icon: <MdDeliveryDining />,
    },
    { label: "Reviews", path: "/dashboard/reviewmanagement", icon: <FiStar /> },
  ];

  const isActive = (path) => path === '/dashboard/view-product';

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Sidebar */}
        <div 
      className={`fixed z-40 inset-y-0 left-0 transform transition-all duration-300 ease-in-out 
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        w-64 bg-white shadow-2xl flex flex-col border-r border-gray-100`}
    >
      {/* Brand Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="text-xl font-bold text-white">AdminPanel</div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 text-white transition-colors"
        >
          <FiX size={20} />
        </button>
      </div>
  
      {/* Menu */}
      <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center p-3 rounded-xl transition-all duration-200 group ${
              isActive(item.path)
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <div className={`text-lg ${isActive(item.path) ? "text-white" : "text-gray-500 group-hover:text-gray-700"}`}>
              {item.icon}
            </div>
            <span className="ml-3 text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
  
      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center w-full p-3 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <FiLogOut size={18} />
          <span className="ml-3 text-sm">Logout</span>
        </button>
      </div>
    </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top header */}
          <header className="flex items-center justify-between px-4 sm:px-6 h-16 bg-white shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-4">
          {/* Menu Button - Now always visible to open the sidebar */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <FiMenu size={20} />
          </button>
          <h2 className="text-base sm:text-xl font-bold text-gray-800 hidden sm:block">Categories</h2>
        </div>
  
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Search input */}
      {/* <div className="relative w-full sm:w-80">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search anything..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
        />
        <FiSearch className="absolute left-3 top-2.5 text-gray-400" size={16} />
      </div> */}
  
          {/* Notifications */}
          <div className="relative">
            <button onClick={handleNotificationClick} className="p-2 rounded-xl hover:bg-gray-50 transition-colors">
              <FiBell size={20} className="text-gray-600" />
              {unreadOrderCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full flex items-center justify-center">
                  {unreadOrderCount}
                </span>
              )}
            </button>
          </div>
  
          {/* Profile */}
          <div className="hidden sm:flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <FiUser size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-800">Admin User</span>
              <span className="text-xs text-gray-500">Administrator</span>
            </div>
          </div>
        </div>
      </header>

          {/* Loading Content */}
          <div className="flex-1 bg-gray-50 p-6 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <div className="text-lg text-gray-600">Loading product...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Enhanced Sidebar */}
      <div
        className={`fixed top-0 left-0 h-[calc(100vh-4rem)] bg-white shadow-xl border-r border-slate-200 overflow-auto transition-all duration-300 ease-in-out z-20 ${
          sidebarOpen ? "translate-x-0 w-80 sm:w-80" : "-translate-x-full w-0"
        } lg:translate-x-0 lg:w-80 lg:top-0 lg:h-screen lg:block`}
      >
        {/* Brand Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="text-xl font-bold text-white">AdminPanel</div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 text-white transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center p-3 rounded-xl transition-all duration-200 group ${
                isActive(item.path)
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div
                className={`text-lg ${
                  isActive(item.path)
                    ? "text-white"
                    : "text-gray-500 group-hover:text-gray-700"
                }`}
              >
                {item.icon}
              </div>
              <span className="ml-3 text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-3 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <FiLogOut size={18} />
            <span className="ml-3 text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* Enhanced Main content */}
      <div className="flex flex-col flex-1 overflow-hidden md:ml-[300px]">
        {/* Enhanced Top header */}
        <header className="flex items-center justify-between px-4 sm:px-6 h-16 bg-white shadow-sm border-b border-gray-100">
          <div className="flex items-center gap-4">
            {/* Menu Button - Now always visible to open the sidebar */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
            >
              <FiMenu size={20} />
            </button>
            <h2 className="text-base sm:text-xl font-bold text-gray-800 hidden sm:block">
              Products
            </h2>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            {/* Search input */}
            {/* <div className="relative w-full sm:w-80">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search anything..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
        />
        <FiSearch className="absolute left-3 top-2.5 text-gray-400" size={16} />
      </div> */}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={handleNotificationClick}
                className="p-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <FiBell size={20} className="text-gray-600" />
                {unreadOrderCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full flex items-center justify-center">
                    {unreadOrderCount}
                  </span>
                )}
              </button>
            </div>

            {/* Profile */}
            <div className="hidden sm:flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <FiUser size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800">
                  Admin User
                </span>
                <span className="text-xs text-gray-500">Administrator</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 p-6 overflow-y-auto">
          {/* Header */}
          {/* <div className="flex items-center mb-6">
            <Link
              to="/dashboard/view-product"
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              <FiArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Edit Product</h1>
          </div> */}

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiAlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiAlertCircle className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm">{success}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Card */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">
                  Basic Information
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Product Name & Brand */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={product.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      name="brand"
                      value={product.brand}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight
                    </label>
                    <input
                      type="text"
                      name="weight"
                      value={product.weight}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="stock"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Stock
                    </label>
                    <select
                      id="stock"
                      name="stock"
                      value={product.stock || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={saving}
                    >
                      <option value="Available">Available</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={product.category || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={saving}
                  >
                    <option value="">Select Subcategory</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={product.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Enter product description..."
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {/* Images Card */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">
                  Product Images
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Main Product Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Main Product Image <span className="text-red-500">*</span>
                  </label>

                  <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
                    {preview ? (
                      <div className="relative mb-4 md:mb-0">
                        <div className="h-48 w-48 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                          <img
                            src={preview}
                            alt="Preview"
                            className="h-full w-full object-cover cursor-pointer"
                            onClick={() => setPreviewImage(preview)}
                          />
                        </div>
                        <button
                          type="button"
                          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                          onClick={() => {
                            setPreview(null);
                            setProduct((prev) => ({
                              ...prev,
                              imageBase64: "",
                            }));
                          }}
                          disabled={saving}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="h-48 w-48 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center mb-4 md:mb-0">
                        <div className="text-center">
                          <FiImage
                            size={36}
                            className="mx-auto text-gray-400"
                          />
                          <p className="mt-2 text-sm text-gray-500">
                            No image selected
                          </p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="main-image"
                        className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                      >
                        <FiUpload size={16} className="mr-2" />
                        {preview ? "Change Image" : "Upload Image"}
                      </label>
                      <input
                        id="main-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="sr-only"
                        disabled={saving}
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Recommended size: 800x800 pixels
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sub Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Additional Images
                  </label>

                  <div>
                    <label
                      htmlFor="sub-images"
                      className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer inline-block"
                    >
                      <FiUpload size={16} className="mr-2" />
                      Add More Images
                    </label>
                    <input
                      id="sub-images"
                      type="file"
                      accept="image/*"
                      onChange={handleSubImagesChange}
                      multiple
                      className="sr-only"
                      disabled={saving}
                    />
                  </div>

                  {product.subImagesBase64.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-3">
                        Additional Images ({product.subImagesBase64.length}):
                      </p>
                      <div className="flex flex-wrap gap-4">
                        {product.subImagesBase64.map((subImg, idx) => (
                          <div key={idx} className="relative">
                            <div className="h-24 w-24 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                              <img
                                src={subImg}
                                alt={`Sub image ${idx + 1}`}
                                className="h-full w-full object-cover cursor-pointer"
                                onClick={() => setPreviewImage(subImg)}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSubImage(idx)}
                              className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                              disabled={saving}
                            >
                              <FiX size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">Pricing</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Original Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="number"
                        name="originalPrice"
                        value={product.originalPrice}
                        onChange={handleInputChange}
                        className="w-full pl-7 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        min="0"
                        step="0.01"
                        disabled={saving}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="offer"
                        value={product.offer}
                        onChange={handleInputChange}
                        className="w-full pr-9 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        max="100"
                        step="0.01"
                        disabled={saving}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sale Price (₹)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="number"
                        name="salePrice"
                        value={product.salePrice}
                        readOnly
                        className="w-full pl-7 px-4 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Card */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">
                  Additional Details
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Date Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Packed Date
                    </label>
                    <input
                      type="date"
                      name="packedDate"
                      value={product.packedDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={product.expiryDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shelf Life (days)
                    </label>
                    <input
                      type="number"
                      name="shelfLife"
                      value={product.shelfLife}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Product Attributes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Product Attributes
                  </label>
                  <div className="flex flex-wrap gap-x-6 gap-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="organic"
                        name="organic"
                        checked={product.organic}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={saving}
                      />
                      <label
                        htmlFor="organic"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Organic
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="imported"
                        name="imported"
                        checked={product.imported}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={saving}
                      />
                      <label
                        htmlFor="imported"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Imported
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Link
                to="/dashboard/view-product"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  "Update Product"
                )}
              </button>
            </div>
          </form>

          {/* Image Preview Modal */}
          {previewImage && (
            <div
              className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center"
              onClick={() => setPreviewImage(null)}
            >
              <div
                className="relative bg-white p-4 rounded-lg max-w-3xl max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-2 right-2 text-gray-600 hover:text-red-600 text-lg font-bold"
                >
                  ✕
                </button>
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-auto rounded"
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EditProduct;
