import React, { useState, useEffect } from 'react';
import { storage } from '@/lib/utils';
import { toast } from 'sonner';
import { PackageConfig } from '@/lib/types';
import { generateId } from '@/lib/utils';

export default function AdminPackageManagement() {
  const [packages, setPackages] = useState<PackageConfig[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PackageConfig>>({
    name: '',
    totalSessions: 10,
    priceAmount: 99,
    validDays: 180,
    applicableStoreScope: 'all',
    isStackable: true,
    isActive: true,
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = () => {
    const pkgs = storage.get<PackageConfig[]>('packageConfigs') || [];
    setPackages(pkgs);
  };

  const handleOpenModal = (pkg?: PackageConfig) => {
    if (pkg) {
      setEditingId(pkg.id);
      setFormData(pkg);
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        totalSessions: 10,
        priceAmount: 99,
        validDays: 180,
        applicableStoreScope: 'all',
        isStackable: true,
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      name: '',
      totalSessions: 10,
      priceAmount: 99,
      validDays: 180,
      applicableStoreScope: 'all',
      isStackable: true,
      isActive: true,
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.totalSessions || !formData.priceAmount) {
      toast.error('请填写所有必填字段');
      return;
    }

    if (editingId) {
      // 编辑现有套餐
      const updated = packages.map((p) =>
        p.id === editingId
          ? {
              ...formData,
              id: editingId,
              createdAt: p.createdAt,
            } as PackageConfig
          : p
      );
      setPackages(updated);
      storage.set('packageConfigs', updated);
      toast.success('套餐已更新');
    } else {
      // 创建新套餐
      const newPackage: PackageConfig = {
        id: `PKG${generateId()}`,
        name: formData.name || '',
        totalSessions: formData.totalSessions || 10,
        priceAmount: formData.priceAmount || 99,
        validDays: formData.validDays || 180,
        applicableStoreScope: formData.applicableStoreScope || 'all',
        isStackable: formData.isStackable ?? true,
        isActive: formData.isActive ?? true,
        createdAt: new Date().toISOString(),
      };
      const updated = [newPackage, ...packages];
      setPackages(updated);
      storage.set('packageConfigs', updated);
      toast.success('套餐已创建');
    }

    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此套餐吗？')) {
      const updated = packages.filter((p) => p.id !== id);
      setPackages(updated);
      storage.set('packageConfigs', updated);
      toast.success('套餐已删除');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">套餐管理</h1>
        <p className="text-gray-600 mt-1">配置和管理汗蒸次卡套餐</p>
      </div>

      {/* 创建按钮 */}
      <div className="mb-6">
        <button
          onClick={() => handleOpenModal()}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition inline-flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i>
          新建套餐
        </button>
      </div>

      {/* 套餐列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {packages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    套餐名称
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    包含次数
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    售价
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    有效期
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    门店范围
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {pkg.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {pkg.totalSessions} 次
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ¥{pkg.priceAmount}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {pkg.validDays} 天
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {pkg.applicableStoreScope === 'all' ? '全部门店' : '指定门店'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          pkg.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {pkg.isActive ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-3">
                      <button
                        onClick={() => handleOpenModal(pkg)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <i className="fa-solid fa-box text-4xl text-gray-300 mb-4 block"></i>
            <p className="text-gray-600 mb-6">还没有创建任何套餐</p>
            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition inline-flex items-center gap-2"
            >
              <i className="fa-solid fa-plus"></i>
              创建第一个套餐
            </button>
          </div>
        )}
      </div>

      {/* 编辑/创建模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingId ? '编辑套餐' : '新建套餐'}
            </h2>

            <div className="space-y-4">
              {/* 套餐名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  套餐名称 *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：10次卡"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>

              {/* 包含次数 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  包含次数 *
                </label>
                <input
                  type="number"
                  value={formData.totalSessions || 10}
                  onChange={(e) =>
                    setFormData({ ...formData, totalSessions: parseInt(e.target.value) || 10 })
                  }
                  min="1"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>

              {/* 售价 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  售价（¥）*
                </label>
                <input
                  type="number"
                  value={formData.priceAmount || 99}
                  onChange={(e) =>
                    setFormData({ ...formData, priceAmount: parseFloat(e.target.value) || 99 })
                  }
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>

              {/* 有效期 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  有效期（天）
                </label>
                <input
                  type="number"
                  value={formData.validDays || 180}
                  onChange={(e) =>
                    setFormData({ ...formData, validDays: parseInt(e.target.value) || 180 })
                  }
                  min="1"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>

              {/* 启用状态 */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive ?? true}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  id="isActive"
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  启用此套餐
                </label>
              </div>
            </div>

            {/* 按钮 */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
