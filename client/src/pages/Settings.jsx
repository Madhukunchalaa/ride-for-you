import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { FiSettings, FiSave, FiInfo, FiUsers, FiTrash2, FiUserPlus } from 'react-icons/fi';

const Settings = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState({ WEEKLY_RENTAL_AMOUNT: 2000 });

  // Employee management state
  const [employees, setEmployees] = useState([]);
  const [empForm, setEmpForm] = useState({ name: '', email: '', password: '' });
  const [empSaving, setEmpSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/employees');
      if (data.success) setEmployees(data.employees);
    } catch {}
  };

  const createEmployee = async () => {
    if (!empForm.name || !empForm.email || !empForm.password) {
      return toast.error('All fields are required');
    }
    setEmpSaving(true);
    try {
      const { data } = await api.post('/employees', empForm);
      if (data.success) {
        toast.success('Employee created');
        setEmpForm({ name: '', email: '', password: '' });
        fetchEmployees();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create employee');
    } finally {
      setEmpSaving(false);
    }
  };

  const deleteEmployee = async (id) => {
    if (!confirm('Remove this employee?')) return;
    try {
      await api.delete(`/employees/${id}`);
      toast.success('Employee removed');
      fetchEmployees();
    } catch {
      toast.error('Failed to remove employee');
    }
  };

  const fetchConfig = async () => {
    try {
      const { data } = await api.get('/config');
      if (data.success) {
        setConfigs(data.data);
        const rentConfig = data.fullConfigs?.find(c => c.key === 'WEEKLY_RENTAL_AMOUNT');
        if (rentConfig) setHistory(rentConfig.history || []);
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
        fetchConfig(); // Refresh history
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
                    Changing this will **only affect new riders** added from now on. Existing riders will keep their original rental rate.
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

            {/* Price Change History */}
            {history.length > 0 && (
              <div className="mt-6 border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <FiSave size={14} /> Price Change History
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-2">Date</th>
                        <th className="px-4 py-2">Previous Rate</th>
                        <th className="px-4 py-2">Updated By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[...history].reverse().map((entry, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="px-4 py-2 font-medium">{new Date(entry.updatedAt).toLocaleDateString()}</td>
                          <td className="px-4 py-2 text-indigo-600 font-semibold">₹{entry.value}</td>
                          <td className="px-4 py-2 capitalize">{entry.updatedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              Security Settings
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100">
              <div className="flex gap-4 mb-4 md:mb-0">
                <div className="p-2 bg-white rounded-lg shadow-sm h-fit">
                  <FiSave className="text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Change Password</h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    Update your account password. This applies to your Admin Email Login.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 min-w-[250px]">
                <input
                  type="password"
                  placeholder="Current Password"
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  id="currentPassword"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  id="newPassword"
                />
                <button
                  onClick={async () => {
                    const currentPassword = document.getElementById('currentPassword').value;
                    const newPassword = document.getElementById('newPassword').value;
                    if (!currentPassword || !newPassword) return toast.error('Please enter both passwords');
                    try {
                      const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
                      toast.success(data.message || 'Password updated');
                      document.getElementById('currentPassword').value = '';
                      document.getElementById('newPassword').value = '';
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Update failed');
                    }
                  }}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Management */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
            <FiUsers className="text-indigo-600" />
            <h2 className="font-semibold text-gray-900">Employee Management</h2>
          </div>
          <div className="p-6 space-y-6">

            {/* Create Employee Form */}
            <div className="p-4 rounded-xl bg-indigo-50/30 border border-indigo-100">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2"><FiUserPlus /> Add New Employee</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={empForm.name}
                  onChange={e => setEmpForm({ ...empForm, name: e.target.value })}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={empForm.email}
                  onChange={e => setEmpForm({ ...empForm, email: e.target.value })}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={empForm.password}
                  onChange={e => setEmpForm({ ...empForm, password: e.target.value })}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <button
                onClick={createEmployee}
                disabled={empSaving}
                className="mt-3 flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm"
              >
                <FiUserPlus /> {empSaving ? 'Creating...' : 'Create Employee'}
              </button>
              <p className="text-xs text-gray-400 mt-2">Employees can only view Riders tab — change status, send reminders, view & download rider info.</p>
            </div>

            {/* Employee List */}
            {employees.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Created</th>
                      <th className="px-4 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {employees.map(emp => (
                      <tr key={emp.id} className="bg-white">
                        <td className="px-4 py-3 font-medium text-gray-900">{emp.name}</td>
                        <td className="px-4 py-3">{emp.email}</td>
                        <td className="px-4 py-3">{new Date(emp.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => deleteEmployee(emp._id)}
                            className="text-red-500 hover:text-red-700 flex items-center gap-1 text-xs font-medium"
                          >
                            <FiTrash2 size={14} /> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {employees.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No employees added yet.</p>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-amber-800 text-sm">
          <FiInfo className="shrink-0 mt-0.5" />
          <p>
            <strong>Professional Mode:</strong> Your system now uses **Immutability Protection**. Changing the rate above will only apply to new riders. Existing active riders will continue to be billed at their original rates to avoid confusion.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
