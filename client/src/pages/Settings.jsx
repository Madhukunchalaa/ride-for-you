import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { FiSettings, FiSave, FiInfo } from 'react-icons/fi';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState({
    WEEKLY_RENTAL_AMOUNT: 2000
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await api.get('/config');
      if (data.success) {
        setConfigs(data.data);
      }
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key, value) => {
    setSaving(true);
    try {
      const { data } = await api.post('/config', {
        key,
        value: Number(value),
        description: 'Default weekly rental amount for all payment links'
      });
      if (data.success) {
        toast.success('Settings updated successfully');
        setConfigs(prev => ({ ...prev, [key]: value }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
          <FiSettings size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-500">Manage global configurations for your fleet</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Weekly Rental Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              Payment Configuration
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-indigo-50/30 border border-indigo-100">
              <div className="flex gap-4">
                <div className="p-2 bg-white rounded-lg shadow-sm h-fit">
                  <FiInfo className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Weekly Rental Amount</h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    This amount will be used automatically whenever you create a payment link or send an automated reminder.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                  <input
                    type="number"
                    value={configs.WEEKLY_RENTAL_AMOUNT}
                    onChange={(e) => setConfigs({ ...configs, WEEKLY_RENTAL_AMOUNT: e.target.value })}
                    className="pl-8 pr-4 py-2 w-32 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-semibold"
                  />
                </div>
                <button
                  onClick={() => handleUpdate('WEEKLY_RENTAL_AMOUNT', configs.WEEKLY_RENTAL_AMOUNT)}
                  disabled={saving}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm shadow-indigo-200"
                >
                  {saving ? 'Saving...' : <><FiSave /> Save</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-amber-800 text-sm">
          <FiInfo className="shrink-0 mt-0.5" />
          <p>
            <strong>Note:</strong> Changing the rental amount will not affect already sent payment links. It will only apply to new links generated from now on.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
