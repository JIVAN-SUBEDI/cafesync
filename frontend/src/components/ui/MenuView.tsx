
"use client";

import React, { useRef, useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/index";
import {
  fetchMenuItems,
  fetchCategories,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "@/store/slices/dashboardSlice";
import {
  Plus,
  Download,
  Edit,
  Trash2,
  Eye,
  UtensilsCrossed,
  Star,
  Image as ImageIcon,
} from "lucide-react";
import MenuItemModal from "./MenuItemModal";
import ConfirmModal from "./ConfirmModal";
import toast from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";
import ImageViewModal from "./ImageViewModal";
import { set } from "lodash";

interface MenuViewProps {
  hotelSlug: string;
  currencySymbol:string;
}

export default function MenuView({ hotelSlug,currencySymbol }: MenuViewProps) {
  const dispatch = useDispatch<AppDispatch>();

  const { menuItemsList, categoriesList, loading, error } = useSelector(
    (state: RootState) => state.dashboard,
  );

  const [showMenuItemModal, setShowMenuItemModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageViewModal, setShowImageViewModal] = useState(false);

  const [selectedMenuItem, setSelectedMenuItem] = useState<any>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<any>(null);
  const [viewingImageItem, setViewingImageItem] = useState<any>(null);

  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterAvailability, setFilterAvailability] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);


  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hotelSlug) return;
    if (fetchedRef.current === hotelSlug) return;
    fetchedRef.current = hotelSlug;

    dispatch(fetchMenuItems(hotelSlug));
    dispatch(fetchCategories());
  }, [hotelSlug, dispatch]);


  // In your MenuItemView component, update the handlers:

const handleCreateMenuItem = async (menuItemData: any) => {
  try {
    setIsSubmitting(true);
    const formData = new FormData()

    formData.append('name', menuItemData.name)
    if (menuItemData.description) formData.append('description', menuItemData.description)
    formData.append('category_id', menuItemData.category_id)
    formData.append('price', `${Number(menuItemData.price)}`)

    if (menuItemData.cost_price !== undefined && menuItemData.cost_price !== null) {
      formData.append('cost_price', `${Number(menuItemData.cost_price)}`)
    }

    formData.append('tax_rate', `${Number(menuItemData.tax_rate ?? 0)}`)

    if (
      menuItemData.preparation_time !== undefined &&
      menuItemData.preparation_time !== null &&
      menuItemData.preparation_time !== ''
    ) {
      formData.append('preparation_time', `${Number(menuItemData.preparation_time)}`)
    }

    formData.append('is_available', String(!!menuItemData.is_available))
    formData.append('is_popular', String(!!menuItemData.is_popular))
    formData.append('is_vegetarian', String(!!menuItemData.is_vegetarian))

    if (menuItemData.dietary_info) {
      formData.append('dietary_info', menuItemData.dietary_info)
    }

    if (menuItemData.image && menuItemData.image instanceof File) {
      formData.append('image', menuItemData.image)
    } else if (menuItemData.image_url) {
      formData.append('image_url', menuItemData.image_url)
    }

    await dispatch(createMenuItem({ hotelSlug, menuItemData: formData })).unwrap()
    toast.success('Menu item created successfully')
    setShowMenuItemModal(false)
  } catch (error: any) {
    console.error('Create menu item error:', error)
    toast.error(error?.message || 'Failed to create menu item')
  } finally{
    setIsSubmitting(false);
  }
}



const handleUpdateMenuItem = async (menuItemData: any) => {
  try {
    setIsSubmitting(true);
    const formData = new FormData()

    if (menuItemData.name !== undefined) formData.append('name', menuItemData.name)
    if (menuItemData.description !== undefined) {
      formData.append('description', menuItemData.description || '')
    }
    if (menuItemData.category_id !== undefined) {
      formData.append('category_id', menuItemData.category_id)
    }
    if (menuItemData.price !== undefined) {
      formData.append('price', `${Number(menuItemData.price)}`)
    }

    if (menuItemData.cost_price !== undefined) {
      if (menuItemData.cost_price === null || menuItemData.cost_price === '') {
        formData.append('cost_price', 'null')
      } else {
        formData.append('cost_price', `${Number(menuItemData.cost_price)}`)
      }
    }

    if (menuItemData.tax_rate !== undefined) {
      formData.append('tax_rate', `${Number(menuItemData.tax_rate)}`)
    }

    if (menuItemData.preparation_time !== undefined) {
      if (menuItemData.preparation_time === null || menuItemData.preparation_time === '') {
        formData.append('preparation_time', 'null')
      } else {
        formData.append('preparation_time', `${Number(menuItemData.preparation_time)}`)
      }
    }

    if (menuItemData.is_available !== undefined) {
      formData.append('is_available', String(!!menuItemData.is_available))
    }

    if (menuItemData.is_popular !== undefined) {
      formData.append('is_popular', String(!!menuItemData.is_popular))
    }

    if (menuItemData.is_vegetarian !== undefined) {
      formData.append('is_vegetarian', String(!!menuItemData.is_vegetarian))
    }

    if (menuItemData.dietary_info !== undefined) {
      formData.append('dietary_info', menuItemData.dietary_info || '')
    }

    if (menuItemData.image && menuItemData.image instanceof File) {
      formData.append('image', menuItemData.image)
    } else if (menuItemData.image_url === null) {
      formData.append('image_url', 'null')
    } else if (menuItemData.image_url) {
      formData.append('image_url', menuItemData.image_url)
    }

    await dispatch(
      updateMenuItem({
        hotelSlug,
        menuItemId: editingMenuItem.id,
        menuItemData: formData,
      })
    ).unwrap()

    toast.success('Menu item updated successfully')
    setShowMenuItemModal(false)
    setEditingMenuItem(null)
  } catch (error: any) {
    console.error('Update menu item error:', error)
    toast.error(error?.message || 'Failed to update menu item')
  } finally {
    setIsSubmitting(false);
  }
}




  const handleDeleteMenuItem = async () => {
    if (!selectedMenuItem) return;

    try {
      await dispatch(
        deleteMenuItem({ hotelSlug, menuItemId: selectedMenuItem.id }),
      ).unwrap();
      toast.success("Menu item deleted successfully");
      setShowDeleteModal(false);
      setSelectedMenuItem(null);
    } catch (error: any) {
      toast.error(error || "Failed to delete menu item");
    }
  };

  const handleImageError = (itemId: string) => {
    setImageErrors((prev) => ({ ...prev, [itemId]: true }));
  };

  const getAvailabilityColor = (isAvailable: boolean) => {
    return isAvailable
      ? "bg-emerald-100 text-emerald-800"
      : "bg-red-100 text-red-800";
  };

  const categoryOptions = useMemo(() => {
    return (Array.isArray(categoriesList) ? categoriesList : [])
      .filter((c) => c?.name?.trim())
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }, [categoriesList]);

  const filteredMenuItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return (Array.isArray(menuItemsList) ? menuItemsList : []).filter(
      (item) => {
        const matchesCategory =
          filterCategory === "all" || item.category === filterCategory;

        const matchesAvailability =
          filterAvailability === "all" ||
          (filterAvailability === "available" && item.is_available) ||
          (filterAvailability === "unavailable" && !item.is_available);

        const matchesSearch =
          !q ||
          item.name?.toLowerCase().includes(q) ||
          item.item_code?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q);

        return matchesCategory && matchesAvailability && matchesSearch;
      },
    );
  }, [menuItemsList, filterCategory, filterAvailability, searchTerm]);

  const availableCount = menuItemsList.filter(
    (item) => item.is_available,
  ).length;
  const popularCount = menuItemsList.filter((item) => item.is_popular).length;
  const itemsWithImages = menuItemsList.filter((item) => item.image_url).length;

  if (loading && menuItemsList.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold mb-2">Menu Items</h1>
            <p className="text-blue-100">
              Manage your hotel's menu items and pricing
            </p>
          </div>
          <button
            onClick={() => {
              setEditingMenuItem(null);
              setShowMenuItemModal(true);
            }}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Menu Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <UtensilsCrossed className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">
                {menuItemsList.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <UtensilsCrossed className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-gray-900">
                {availableCount}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Popular</p>
              <p className="text-2xl font-bold text-gray-900">{popularCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <ImageIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">With Images</p>
              <p className="text-2xl font-bold text-gray-900">
                {itemsWithImages}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-semibold text-gray-900">All Menu Items</h3>

            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                <option value="all">All Categories</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={filterAvailability}
                onChange={(e) => setFilterAvailability(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>

  
            </div>
          </div>
        </div>

        {/* Table with Image Column */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Image</th>
                <th className="px-4 py-3 font-semibold">Item</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Popular</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {filteredMenuItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  {/* Image Cell - Single, correct version */}
                  <td className="px-4 py-3">
                    {item.image_url && !imageErrors[item.id] ? (
                      <div
                        className="relative w-12 h-12 cursor-pointer group"
                        onClick={() => {
                          setViewingImageItem(item);
                          setShowImageViewModal(true);
                        }}
                      >
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-ful rounded-lg object-cover border border-gray-200 "
                          onError={() => handleImageError(item.id)}
                        />

                        <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center">
                          <Eye className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-black" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                        <ImageIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </td>

                  {/* Item Details - All inside <td> tags */}
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      Code: {item.item_code || "—"}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-gray-700">
                      {item.category || "—"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">
                      {currencySymbol} {Number(item.price ?? 0).toFixed(2)}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getAvailabilityColor(
                        !!item.is_available,
                      )}`}
                    >
                      {item.is_available ? "Available" : "Unavailable"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {item.is_popular ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                        <Star className="h-4 w-4 fill-amber-500" />
                        Yes
                      </span>
                    ) : (
                      <span className="text-gray-500">No</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
             

                      <button
                        type="button"
                        onClick={() => {
                          setEditingMenuItem(item);
                          setShowMenuItemModal(true);
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 text-blue-700"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMenuItem(item);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image View Modal */}
      <ImageViewModal
        isOpen={showImageViewModal}
        onClose={() => {
          setShowImageViewModal(false);
          setViewingImageItem(null);
        }}
        item={viewingImageItem}
      />

      <MenuItemModal
        isOpen={showMenuItemModal}
        onClose={() => {
          setShowMenuItemModal(false);
          setEditingMenuItem(null);
        }}
        onSubmit={editingMenuItem ? handleUpdateMenuItem : handleCreateMenuItem}
        initialData={editingMenuItem}
        hotelSlug={hotelSlug}
        categories={categoryOptions}
        error={error}
        isSubmitting={isSubmitting}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedMenuItem(null);
        }}
        onConfirm={handleDeleteMenuItem}
        title="Delete Menu Item"
        message={`Are you sure you want to delete "${selectedMenuItem?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}







// // components/dashboard/views/MenuView.tsx
// "use client";

// import React, { useRef, useEffect, useMemo, useState, useCallback } from "react";
// import { useSelector, useDispatch } from "react-redux";
// import { RootState, AppDispatch } from "@/store/index";
// import {
//   fetchMenuItems,
//   fetchCategories,
//   createMenuItem,
//   updateMenuItem,
//   deleteMenuItem,
// } from "@/store/slices/dashboardSlice";
// import {
//   Plus,
//   Download,
//   Edit,
//   Trash2,
//   Eye,
//   UtensilsCrossed,
//   Star,
//   Image as ImageIcon,
// } from "lucide-react";
// import MenuItemModal from "./MenuItemModal";
// import ConfirmModal from "./ConfirmModal";
// import toast from "react-hot-toast";
// import LoadingSpinner from "./LoadingSpinner";
// import ImageViewModal from "./ImageViewModal";

// interface MenuViewProps {
//   hotelSlug: string;
// }

// export default function MenuView({ hotelSlug }: MenuViewProps) {
//   const dispatch = useDispatch<AppDispatch>();

//   const { menuItemsList, categoriesList, loading, error } = useSelector(
//     (state: RootState) => state.dashboard,
//   );

//   const [showMenuItemModal, setShowMenuItemModal] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [showImageViewModal, setShowImageViewModal] = useState(false);

//   const [selectedMenuItem, setSelectedMenuItem] = useState<any>(null);
//   const [editingMenuItem, setEditingMenuItem] = useState<any>(null);
//   const [viewingImageItem, setViewingImageItem] = useState<any>(null);

//   const [filterCategory, setFilterCategory] = useState<string>("all");
//   const [filterAvailability, setFilterAvailability] = useState<string>("all");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const fetchedRef = useRef<string | null>(null);

//   useEffect(() => {
//     if (!hotelSlug) return;
//     if (fetchedRef.current === hotelSlug) return;
//     fetchedRef.current = hotelSlug;

//     dispatch(fetchMenuItems(hotelSlug));
//     dispatch(fetchCategories());
//   }, [hotelSlug, dispatch]);

//   const createFormData = useCallback((data: any, isUpdate: boolean = false): FormData => {
//     const formData = new FormData();

//     const appendIfExists = (key: string, value: any) => {
//       if (value !== undefined && value !== null) {
//         formData.append(key, String(value));
//       }
//     };

//     if (data.name !== undefined) appendIfExists('name', data.name);
//     if (data.description !== undefined) appendIfExists('description', data.description || '');
//     if (data.category_id !== undefined) appendIfExists('category_id', data.category_id);
//     if (data.price !== undefined) appendIfExists('price', String(Number(data.price)));

//     if (data.cost_price !== undefined) {
//       if (data.cost_price === null || data.cost_price === '') {
//         appendIfExists('cost_price', 'null');
//       } else {
//         appendIfExists('cost_price', String(Number(data.cost_price)));
//       }
//     }

//     if (data.tax_rate !== undefined) appendIfExists('tax_rate', String(Number(data.tax_rate)));

//     if (data.preparation_time !== undefined) {
//       if (data.preparation_time === null || data.preparation_time === '') {
//         appendIfExists('preparation_time', 'null');
//       } else {
//         appendIfExists('preparation_time', String(Number(data.preparation_time)));
//       }
//     }

//     if (data.is_available !== undefined) appendIfExists('is_available', String(!!data.is_available));
//     if (data.is_popular !== undefined) appendIfExists('is_popular', String(!!data.is_popular));
//     if (data.is_vegetarian !== undefined) appendIfExists('is_vegetarian', String(!!data.is_vegetarian));
//     if (data.dietary_info !== undefined) appendIfExists('dietary_info', data.dietary_info || '');

//     // Handle image
//     if (data.image && data.image instanceof File) {
//       formData.append('image', data.image);
//     } else if (data.image_url === null) {
//       appendIfExists('image_url', 'null');
//     } else if (data.image_url) {
//       appendIfExists('image_url', data.image_url);
//     }

//     return formData;
//   }, []);

//   const handleCreateMenuItem = useCallback(async (menuItemData: any) => {
//     try {
//       setIsSubmitting(true);
//       const formData = createFormData(menuItemData, false);
//       await dispatch(createMenuItem({ hotelSlug, menuItemData: formData })).unwrap();
//       toast.success('Menu item created successfully');
//       setShowMenuItemModal(false);
//     } catch (error: any) {
//       console.error('Create menu item error:', error);
//       // Let the modal handle the error display
//       throw error;
//     } finally {
//       setIsSubmitting(false);
//     }
//   }, [dispatch, hotelSlug, createFormData]);

//   const handleUpdateMenuItem = useCallback(async (menuItemData: any) => {
//     try {
//       setIsSubmitting(true);
//       const formData = createFormData(menuItemData, true);
//       await dispatch(updateMenuItem({
//         hotelSlug,
//         menuItemId: editingMenuItem.id,
//         menuItemData: formData,
//       })).unwrap();
//       toast.success('Menu item updated successfully');
//       setShowMenuItemModal(false);
//       setEditingMenuItem(null);
//     } catch (error: any) {
//       console.error('Update menu item error:', error);
//       throw error;
//     } finally {
//       setIsSubmitting(false);
//     }
//   }, [dispatch, hotelSlug, editingMenuItem, createFormData]);

//   const handleDeleteMenuItem = useCallback(async () => {
//     if (!selectedMenuItem) return;

//     try {
//       await dispatch(deleteMenuItem({ hotelSlug, menuItemId: selectedMenuItem.id })).unwrap();
//       toast.success("Menu item deleted successfully");
//       setShowDeleteModal(false);
//       setSelectedMenuItem(null);
//     } catch (error: any) {
//       toast.error(error?.message || "Failed to delete menu item");
//     }
//   }, [dispatch, hotelSlug, selectedMenuItem]);

//   const handleImageError = useCallback((itemId: string) => {
//     setImageErrors((prev) => ({ ...prev, [itemId]: true }));
//   }, []);

//   const getAvailabilityColor = useCallback((isAvailable: boolean) => {
//     return isAvailable
//       ? "bg-emerald-100 text-emerald-800"
//       : "bg-red-100 text-red-800";
//   }, []);

//   const categoryOptions = useMemo(() => {
//     return (Array.isArray(categoriesList) ? categoriesList : [])
//       .filter((c) => c?.name?.trim())
//       .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
//   }, [categoriesList]);

//   const filteredMenuItems = useMemo(() => {
//     const searchLower = searchTerm.trim().toLowerCase();
//     const items = Array.isArray(menuItemsList) ? menuItemsList : [];

//     return items.filter((item) => {
//       const matchesCategory = filterCategory === "all" || item.category === filterCategory;
//       const matchesAvailability =
//         filterAvailability === "all" ||
//         (filterAvailability === "available" && item.is_available) ||
//         (filterAvailability === "unavailable" && !item.is_available);
//       const matchesSearch =
//         !searchLower ||
//         item.name?.toLowerCase().includes(searchLower) ||
//         item.item_code?.toLowerCase().includes(searchLower) ||
//         item.category?.toLowerCase().includes(searchLower);

//       return matchesCategory && matchesAvailability && matchesSearch;
//     });
//   }, [menuItemsList, filterCategory, filterAvailability, searchTerm]);

//   const stats = useMemo(() => ({
//     total: menuItemsList.length,
//     available: menuItemsList.filter((item) => item.is_available).length,
//     popular: menuItemsList.filter((item) => item.is_popular).length,
//     withImages: menuItemsList.filter((item) => item.image_url).length,
//   }), [menuItemsList]);

//   const handleExport = useCallback(() => {
//     const exportData = filteredMenuItems.map(item => ({
//       'Item Code': item.item_code,
//       'Name': item.name,
//       'Category': item.category,
//       'Price': item.price,
//       'Status': item.is_available ? 'Available' : 'Unavailable',
//       'Popular': item.is_popular ? 'Yes' : 'No',
//       'Vegetarian': item.is_vegetarian ? 'Yes' : 'No',
//       'Tax Rate': `${item.tax_rate}%`,
//       'Preparation Time': item.preparation_time ? `${item.preparation_time} mins` : 'N/A',
//     }));

//     const csv = [
//       Object.keys(exportData[0] || {}).join(','),
//       ...exportData.map(row => Object.values(row).join(','))
//     ].join('\n');

//     const blob = new Blob([csv], { type: 'text/csv' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `menu_items_export_${new Date().toISOString().split('T')[0]}.csv`;
//     a.click();
//     window.URL.revokeObjectURL(url);
//     toast.success('Export completed');
//   }, [filteredMenuItems]);

//   if (loading && menuItemsList.length === 0) {
//     return <LoadingSpinner />;
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
//         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//           <div>
//             <h1 className="text-xl font-bold mb-2">Menu Items</h1>
//             <p className="text-blue-100">Manage your hotel's menu items and pricing</p>
//           </div>
//           <button
//             onClick={() => {
//               setEditingMenuItem(null);
//               setShowMenuItemModal(true);
//             }}
//             className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
//           >
//             <Plus className="h-4 w-4" />
//             Add Item
//           </button>
//         </div>
//       </div>

//       {/* Menu Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <StatCard
//           icon={<UtensilsCrossed className="h-5 w-5 text-blue-600" />}
//           iconBg="bg-blue-50"
//           label="Total Items"
//           value={stats.total}
//         />
//         <StatCard
//           icon={<UtensilsCrossed className="h-5 w-5 text-emerald-600" />}
//           iconBg="bg-emerald-50"
//           label="Available"
//           value={stats.available}
//         />
//         <StatCard
//           icon={<Star className="h-5 w-5 text-amber-600" />}
//           iconBg="bg-amber-50"
//           label="Popular"
//           value={stats.popular}
//         />
//         <StatCard
//           icon={<ImageIcon className="h-5 w-5 text-purple-600" />}
//           iconBg="bg-purple-50"
//           label="With Images"
//           value={stats.withImages}
//         />
//       </div>

//       {/* Menu Items Table */}
//       <div className="bg-white rounded-lg border border-gray-200">
//         <div className="p-4 border-b border-gray-200">
//           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//             <h3 className="font-semibold text-gray-900">All Menu Items</h3>

//             <div className="flex flex-col md:flex-row gap-2">
//               <input
//                 type="text"
//                 placeholder="Search menu items..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               />

//               <select
//                 value={filterCategory}
//                 onChange={(e) => setFilterCategory(e.target.value)}
//                 className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
//               >
//                 <option value="all">All Categories</option>
//                 {categoryOptions.map((c) => (
//                   <option key={c.id} value={c.name}>
//                     {c.name}
//                   </option>
//                 ))}
//               </select>

//               <select
//                 value={filterAvailability}
//                 onChange={(e) => setFilterAvailability(e.target.value)}
//                 className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
//               >
//                 <option value="all">All Status</option>
//                 <option value="available">Available</option>
//                 <option value="unavailable">Unavailable</option>
//               </select>

//               <button
//                 type="button"
//                 onClick={handleExport}
//                 className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1"
//               >
//                 <Download className="h-4 w-4" />
//                 Export
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Table with Image Column */}
//         <div className="w-full overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead className="bg-gray-50 text-gray-700">
//               <tr className="text-left">
//                 <th className="px-4 py-3 font-semibold">Image</th>
//                 <th className="px-4 py-3 font-semibold">Item</th>
//                 <th className="px-4 py-3 font-semibold">Category</th>
//                 <th className="px-4 py-3 font-semibold">Price</th>
//                 <th className="px-4 py-3 font-semibold">Status</th>
//                 <th className="px-4 py-3 font-semibold">Popular</th>
//                 <th className="px-4 py-3 font-semibold text-right">Actions</th>
//               </tr>
//             </thead>

//             <tbody className="divide-y divide-gray-200">
//               {filteredMenuItems.map((item) => (
//                 <tr key={item.id} className="hover:bg-gray-50">
//                   <td className="px-4 py-3">
//                     {item.image_url && !imageErrors[item.id] ? (
//                       <div
//                         className="relative w-12 h-12 cursor-pointer group"
//                         onClick={() => {
//                           setViewingImageItem(item);
//                           setShowImageViewModal(true);
//                         }}
//                       >
//                         <img
                        //   src={item.image_url}
                        //   alt={item.name}
                        //   className="w-full h-ful rounded-lg object-cover border border-gray-200 "
                        //   onError={() => handleImageError(item.id)}
                        // />
//                         <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center">
//                           <Eye className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-white" />
//                         </div>
//                       </div>
//                     ) : (
//                       <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
//                         <ImageIcon className="h-5 w-5 text-gray-400" />
//                       </div>
//                     )}
//                   </td>

//                   <td className="px-4 py-3">
//                     <div className="font-semibold text-gray-900">{item.name}</div>
//                     <div className="text-xs text-gray-500">Code: {item.item_code || "—"}</div>
//                   </td>

//                   <td className="px-4 py-3">
//                     <span className="text-gray-700">{item.category || "—"}</span>
//                   </td>

//                   <td className="px-4 py-3">
//                     <span className="font-medium text-gray-900">
//                       रु {Number(item.price ?? 0).toFixed(2)}
//                     </span>
//                   </td>

//                   <td className="px-4 py-3">
//                     <span
//                       className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getAvailabilityColor(
//                         !!item.is_available,
//                       )}`}
//                     >
//                       {item.is_available ? "Available" : "Unavailable"}
//                     </span>
//                   </td>

//                   <td className="px-4 py-3">
//                     {item.is_popular ? (
//                       <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
//                         <Star className="h-4 w-4 fill-amber-500" />
//                         Yes
//                       </span>
//                     ) : (
//                       <span className="text-gray-500">No</span>
//                     )}
//                   </td>

//                   <td className="px-4 py-3">
//                     <div className="flex justify-end gap-1">
//                       <button
//                         type="button"
//                         onClick={() => setSelectedMenuItem(item)}
//                         className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
//                         title="View Details"
//                       >
//                         <Eye className="h-4 w-4" />
//                       </button>

//                       <button
//                         type="button"
//                         onClick={() => {
//                           setEditingMenuItem(item);
//                           setShowMenuItemModal(true);
//                         }}
//                         className="p-2 rounded-lg hover:bg-gray-100 text-blue-700"
//                         title="Edit"
//                       >
//                         <Edit className="h-4 w-4" />
//                       </button>

//                       <button
//                         type="button"
//                         onClick={() => {
//                           setSelectedMenuItem(item);
//                           setShowDeleteModal(true);
//                         }}
//                         className="p-2 rounded-lg hover:bg-gray-100 text-red-700"
//                         title="Delete"
//                       >
//                         <Trash2 className="h-4 w-4" />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>

//           {filteredMenuItems.length === 0 && (
//             <div className="text-center py-8">
//               <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-2" />
//               <p className="text-gray-600">No menu items found</p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Image View Modal */}
//       <ImageViewModal
//         isOpen={showImageViewModal}
//         onClose={() => {
//           setShowImageViewModal(false);
//           setViewingImageItem(null);
//         }}
//         item={viewingImageItem}
//       />

//       <MenuItemModal
//         isOpen={showMenuItemModal}
//         onClose={() => {
//           setShowMenuItemModal(false);
//           setEditingMenuItem(null);
//         }}
//         onSubmit={editingMenuItem ? handleUpdateMenuItem : handleCreateMenuItem}
//         initialData={editingMenuItem}
//         hotelSlug={hotelSlug}
//         categories={categoryOptions}
//         error={error}
//         isSubmitting={isSubmitting}
//       />

//       <ConfirmModal
//         isOpen={showDeleteModal}
//         onClose={() => {
//           setShowDeleteModal(false);
//           setSelectedMenuItem(null);
//         }}
//         onConfirm={handleDeleteMenuItem}
//         title="Delete Menu Item"
//         message={`Are you sure you want to delete "${selectedMenuItem?.name}"? This action cannot be undone.`}
//       />
//     </div>
//   );
// }

// // Stat Card Component
// const StatCard = ({ icon, iconBg, label, value }: { icon: React.ReactNode; iconBg: string; label: string; value: number }) => (
//   <div className="bg-white rounded-lg border border-gray-200 p-4">
//     <div className="flex items-center gap-3">
//       <div className={`p-2 ${iconBg} rounded-lg`}>{icon}</div>
//       <div>
//         <p className="text-sm text-gray-600">{label}</p>
//         <p className="text-2xl font-bold text-gray-900">{value}</p>
//       </div>
//     </div>
//   </div>
// );