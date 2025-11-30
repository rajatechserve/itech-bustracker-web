import React, { useEffect, useState } from 'react';
import api, { getAuthUser, SERVER_URL, setAuthUser } from '../services/api';
import { useTheme } from '../context/ThemeContext';

function ColorPicker({ schoolId, schoolName }) {
  const user = getAuthUser();
  const [headerColors, setHeaderColors] = useState({
    from: localStorage.getItem('schoolHeaderFrom') || '',
    to: localStorage.getItem('schoolHeaderTo') || ''
  });
  const [sidebarColors, setSidebarColors] = useState({
    from: localStorage.getItem('schoolSidebarFrom') || '',
    to: localStorage.getItem('schoolSidebarTo') || ''
  });
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const colorOptions = [
    { name: 'White', value: 'white' },
    { name: 'Blue', value: 'blue-500' },
    { name: 'Indigo', value: 'indigo-600' },
    { name: 'Purple', value: 'purple-600' },
    { name: 'Pink', value: 'pink-500' },
    { name: 'Red', value: 'red-500' },
    { name: 'Orange', value: 'orange-500' },
    { name: 'Amber', value: 'amber-500' },
    { name: 'Yellow', value: 'yellow-500' },
    { name: 'Lime', value: 'lime-500' },
    { name: 'Green', value: 'green-600' },
    { name: 'Emerald', value: 'emerald-600' },
    { name: 'Teal', value: 'teal-600' },
    { name: 'Cyan', value: 'cyan-500' },
    { name: 'Sky', value: 'sky-500' },
    { name: 'Violet', value: 'violet-600' },
    { name: 'Fuchsia', value: 'fuchsia-600' },
    { name: 'Rose', value: 'rose-500' },
    { name: 'Slate', value: 'slate-700' }
  ];

  const getColorPreview = (colorClass) => {
    const colorMap = {
      'white': '#ffffff',
      'blue-500': '#3b82f6', 'indigo-600': '#4f46e5', 'purple-600': '#9333ea',
      'pink-500': '#ec4899', 'red-500': '#ef4444', 'orange-500': '#f97316',
      'amber-500': '#f59e0b', 'yellow-500': '#eab308', 'lime-500': '#84cc16',
      'green-600': '#16a34a', 'emerald-600': '#059669', 'teal-600': '#0d9488',
      'cyan-500': '#06b6d4', 'sky-500': '#0ea5e9', 'violet-600': '#7c3aed',
      'fuchsia-600': '#c026d3', 'rose-500': '#f43f5e', 'slate-700': '#334155'
    };
    return colorMap[colorClass] || '#6b7280';
  };

  const saveColors = async () => {
    if (!schoolId) {
      alert('Failed to save colors: School not loaded');
      return;
    }
    setLoading(true);
    
    try {
      // Fetch current school fields to avoid clearing existing data (logo/photo/address...)
      const res = await api.get('/schools');
      const current = (res.data?.data || []).find(s => String(s.id) === String(schoolId)) || (res.data?.data || [])[0] || {};
      const payload = {
        name: (schoolName || current.name || '').trim() || 'School',
        address: current.address || null,
        city: current.city || null,
        state: current.state || null,
        county: current.county || null,
        phone: current.phone || null,
        mobile: current.mobile || null,
        logo: current.logo || null,
        photo: current.photo || null,
        headerColorFrom: headerColors.from || null,
        headerColorTo: headerColors.to || null,
        sidebarColorFrom: sidebarColors.from || null,
        sidebarColorTo: sidebarColors.to || null
      };
      await api.put(`/schools/${schoolId}`, payload);
      
      // Update localStorage for immediate effect
      if (headerColors.from && headerColors.to) {
        localStorage.setItem('schoolHeaderFrom', headerColors.from);
        localStorage.setItem('schoolHeaderTo', headerColors.to);
      } else {
        localStorage.removeItem('schoolHeaderFrom');
        localStorage.removeItem('schoolHeaderTo');
      }
      
      if (sidebarColors.from && sidebarColors.to) {
        localStorage.setItem('schoolSidebarFrom', sidebarColors.from);
        localStorage.setItem('schoolSidebarTo', sidebarColors.to);
      } else {
        localStorage.removeItem('schoolSidebarFrom');
        localStorage.removeItem('schoolSidebarTo');
      }
      
      // Re-fetch the updated school and merge into auth user so header/sidebar update without reload
      const refreshed = await api.get('/schools');
      const list = refreshed.data?.data || [];
      const updatedSchool = list.find(s => String(s.id) === String(schoolId)) || list[0];
      const currentUser = getAuthUser();
      if(currentUser && updatedSchool){
        const mergedUser = {
          ...currentUser,
          name: updatedSchool.name || currentUser.name,
          schoolName: updatedSchool.name || currentUser.schoolName || currentUser.name,
          logo: updatedSchool.logo || currentUser.logo || null,
          photo: updatedSchool.photo || currentUser.photo || null,
          address: updatedSchool.address || currentUser.address || null,
          city: updatedSchool.city || currentUser.city || null,
          state: updatedSchool.state || currentUser.state || null,
          county: updatedSchool.county || currentUser.county || null,
          phone: updatedSchool.phone || currentUser.phone || null,
          mobile: updatedSchool.mobile || currentUser.mobile || null,
          headerColorFrom: updatedSchool.headerColorFrom || null,
          headerColorTo: updatedSchool.headerColorTo || null,
          sidebarColorFrom: updatedSchool.sidebarColorFrom || null,
          sidebarColorTo: updatedSchool.sidebarColorTo || null,
        };
        setAuthUser(mergedUser);
      }
      setSuccess('Colors saved and applied');
    } catch (err) {
      setSuccess('');
      alert('Failed to save colors: ' + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const resetColors = async () => {
    if (!schoolId) {
      alert('Failed to reset colors: School not loaded');
      return;
    }
    setLoading(true);
    
    try {
      // Keep existing base fields; only clear color fields
      const res = await api.get('/schools');
      const current = (res.data?.data || []).find(s => String(s.id) === String(schoolId)) || (res.data?.data || [])[0] || {};
      const payload = {
        name: (schoolName || current.name || '').trim() || 'School',
        address: current.address || null,
        city: current.city || null,
        state: current.state || null,
        county: current.county || null,
        phone: current.phone || null,
        mobile: current.mobile || null,
        logo: current.logo || null,
        photo: current.photo || null,
        headerColorFrom: null,
        headerColorTo: null,
        sidebarColorFrom: null,
        sidebarColorTo: null
      };
      await api.put(`/schools/${schoolId}`, payload);
      
      setHeaderColors({ from: '', to: '' });
      setSidebarColors({ from: '', to: '' });
      localStorage.removeItem('schoolHeaderFrom');
      localStorage.removeItem('schoolHeaderTo');
      localStorage.removeItem('schoolSidebarFrom');
      localStorage.removeItem('schoolSidebarTo');
      
      // Update auth user with cleared colors without reload
      const refreshed = await api.get('/schools');
      const list = refreshed.data?.data || [];
      const updatedSchool = list.find(s => String(s.id) === String(schoolId)) || list[0];
      const currentUser = getAuthUser();
      if(currentUser && updatedSchool){
        const mergedUser = {
          ...currentUser,
          headerColorFrom: null,
          headerColorTo: null,
          sidebarColorFrom: null,
          sidebarColorTo: null,
          name: updatedSchool?.name || currentUser.name,
          schoolName: updatedSchool?.name || currentUser.schoolName || currentUser.name,
        };
        setAuthUser(mergedUser);
      }
      setSuccess('Colors reset and defaults applied');
    } catch (err) {
      setSuccess('');
      alert('Failed to reset colors: ' + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded border border-green-200 dark:border-green-800">
          {success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Top Header Colors</label>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Start Color</p>
            <div className="grid grid-cols-6 gap-2">
              {colorOptions.map((color) => (
                <button key={color.value} type="button" onClick={() => setHeaderColors({ ...headerColors, from: color.value })}
                  className={`p-3 rounded-lg border-2 transition ${
                    headerColors.from === color.value
                      ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                  }`}
                  style={{ backgroundColor: getColorPreview(color.value) }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">End Color</p>
            <div className="grid grid-cols-6 gap-2">
              {colorOptions.map((color) => (
                <button key={color.value} type="button" onClick={() => setHeaderColors({ ...headerColors, to: color.value })}
                  className={`p-3 rounded-lg border-2 transition ${
                    headerColors.to === color.value
                      ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                  }`}
                  style={{ backgroundColor: getColorPreview(color.value) }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{
            background: `linear-gradient(to right, ${getColorPreview(headerColors.from)}, ${getColorPreview(headerColors.to)})`
          }}>
            <p className="text-white text-center font-semibold">Header Preview</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Side Menu Colors</label>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Start Color</p>
            <div className="grid grid-cols-6 gap-2">
              {colorOptions.map((color) => (
                <button key={color.value} type="button" onClick={() => setSidebarColors({ ...sidebarColors, from: color.value })}
                  className={`p-3 rounded-lg border-2 transition ${
                    sidebarColors.from === color.value
                      ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                  }`}
                  style={{ backgroundColor: getColorPreview(color.value) }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">End Color</p>
            <div className="grid grid-cols-6 gap-2">
              {colorOptions.map((color) => (
                <button key={color.value} type="button" onClick={() => setSidebarColors({ ...sidebarColors, to: color.value })}
                  className={`p-3 rounded-lg border-2 transition ${
                    sidebarColors.to === color.value
                      ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                  }`}
                  style={{ backgroundColor: getColorPreview(color.value) }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{
            background: `linear-gradient(to bottom, ${getColorPreview(sidebarColors.from)}, ${getColorPreview(sidebarColors.to)})`
          }}>
            <p className="text-white text-center font-semibold">Sidebar Preview</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={saveColors} disabled={loading}
          className={`px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {loading ? 'Saving...' : 'Save & Apply'}
        </button>
        <button type="button" onClick={resetColors} disabled={loading}
          className={`px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          Reset to Default
        </button>
      </div>
    </div>
  );
}

export default function SchoolProfile() {
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    county: '',
    phone: '',
    mobile: '',
    logo: '',
    photo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const user = getAuthUser();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get('/schools');
      if (res.data?.data && res.data.data.length > 0) {
        // Prefer the admin's assigned school if available
        const allSchools = res.data.data;
        const currentUser = getAuthUser();
        const preferredId = currentUser?.schoolId || currentUser?.school?.id || currentUser?.id;
        const school = (preferredId && allSchools.find(s => String(s.id) === String(preferredId))) || allSchools[0];
        setSchoolId(school.id);
        setForm({
          name: school.name || '',
          address: school.address || '',
          city: school.city || '',
          state: school.state || '',
          county: school.county || '',
          phone: school.phone || '',
          mobile: school.mobile || '',
          logo: school.logo || '',
          photo: school.photo || ''
        });
        
        // Load colors from database and update localStorage
        if (school.headerColorFrom && school.headerColorTo) {
          localStorage.setItem('schoolHeaderFrom', school.headerColorFrom);
          localStorage.setItem('schoolHeaderTo', school.headerColorTo);
        }
        if (school.sidebarColorFrom && school.sidebarColorTo) {
          localStorage.setItem('schoolSidebarFrom', school.sidebarColorFrom);
          localStorage.setItem('schoolSidebarTo', school.sidebarColorTo);
        }
      }
    } catch (e) {
      setError('Failed to load profile');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!form.name.trim()) {
      setError('School name is required');
      return;
    }

    setLoading(true);
    try {
      await api.put(`/schools/${schoolId}`, form);
      setSuccess('Profile updated successfully');
      // Refresh user session data without full page reload
      const schoolRes = await api.get('/schools');
      const list = schoolRes.data?.data || [];
      const updatedSchool = list.find(s => String(s.id) === String(schoolId)) || list[0];
      const currentUser = getAuthUser();
      if (currentUser && updatedSchool) {
        const updatedUser = {
          ...currentUser,
          name: updatedSchool.name || currentUser.name,
          schoolName: updatedSchool.name || currentUser.schoolName || currentUser.name,
          logo: updatedSchool.logo || currentUser.logo || null,
          photo: updatedSchool.photo || currentUser.photo || null,
          address: updatedSchool.address || currentUser.address || null,
          city: updatedSchool.city || currentUser.city || null,
          state: updatedSchool.state || currentUser.state || null,
          county: updatedSchool.county || currentUser.county || null,
          phone: updatedSchool.phone || currentUser.phone || null,
          mobile: updatedSchool.mobile || currentUser.mobile || null,
        };
        setAuthUser(updatedUser);
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 500 * 1024) {
      setError('Logo file size must be less than 500KB');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await api.post('/upload/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setForm({ ...form, logo: response.data.path });
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to upload logo');
    } finally {
      setLoading(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      setError('Banner file size must be less than 2MB');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('banner', file);
      
      const response = await api.post('/upload/banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setForm({ ...form, photo: response.data.path });
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to upload banner');
    } finally {
      setLoading(false);
    }
  };

  const getContractAlert = () => {
    if (!form.contractEndDate) return null;
    
    const endDate = new Date(form.contractEndDate);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) {
      return (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 rounded">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">Contract Expired</h3>
              <p className="mt-1 text-sm">Your contract expired on {endDate.toLocaleDateString()}. Please contact the administrator to renew your subscription.</p>
            </div>
          </div>
        </div>
      );
    } else if (daysRemaining <= 30) {
      return (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 rounded">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">Contract Expiring Soon</h3>
              <p className="mt-1 text-sm">Your contract will expire in {daysRemaining} days on {endDate.toLocaleDateString()}. Please contact the administrator for renewal.</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-slate-800 dark:text-slate-200">School Profile</h2>

      {/* Contract Status Alert */}
      {getContractAlert()}

      {/* Contract Information Card */}
      {form.contractStartDate || form.contractEndDate && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg shadow p-6 mb-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <span>📅</span> Contract Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {form.contractStartDate && (
              <div>
                <span className="text-slate-600 dark:text-slate-400">Start Date:</span>
                <span className="ml-2 font-medium text-slate-800 dark:text-slate-200">
                  {new Date(form.contractStartDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {form.contractEndDate && (
              <div>
                <span className="text-slate-600 dark:text-slate-400">End Date:</span>
                <span className="ml-2 font-medium text-slate-800 dark:text-slate-200">
                  {new Date(form.contractEndDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Welcome Banner with School Info */}
      {form.name && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8 mb-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            {form.logo && (
              <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <img 
                  src={form.logo.startsWith('/uploads') ? `${SERVER_URL}${form.logo}` : form.logo} 
                  alt="School Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
            )}
            <div>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                Welcome to {form.name}
              </h3>
              {(form.address || form.city || form.state) && (
                <div className="text-slate-600 dark:text-slate-400 space-y-1">
                  {form.address && <p>{form.address}</p>}
                  {(form.city || form.state) && (
                    <p>{[form.city, form.state].filter(Boolean).join(', ')}</p>
                  )}
                  {(form.phone || form.mobile) && (
                    <p className="text-sm">
                      {form.phone && <span>📞 {form.phone}</span>}
                      {form.phone && form.mobile && <span className="mx-2">•</span>}
                      {form.mobile && <span>📱 {form.mobile}</span>}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded border border-green-200 dark:border-green-800">
          {success}
        </div>
      )}

      {/* Theme Preference */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Appearance</h3>
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Theme Preference
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition ${
                theme === 'light'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="font-medium">Light</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition ${
                theme === 'dark'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span className="font-medium">Dark</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('auto')}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition ${
                theme === 'auto'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Auto</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {theme === 'auto' ? 'Theme follows your system preference' : `Currently using ${theme} mode`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 space-y-6">
        {/* School Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            School Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter school name"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Address
          </label>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Enter full address"
          />
        </div>

        {/* City, State, County */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              City
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="City"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              State
            </label>
            <input
              type="text"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="State"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              County
            </label>
            <input
              type="text"
              value={form.county}
              onChange={(e) => setForm({ ...form, county: e.target.value })}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="County"
            />
          </div>
        </div>

        {/* Phone, Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+1234567890"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Mobile
            </label>
            <input
              type="tel"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+1234567890"
            />
          </div>
        </div>

        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 text-center">
            School Logo
          </label>
          <div className="flex flex-col items-center gap-4">
            {form.logo && (
              <div className="w-32 h-32 border border-slate-300 dark:border-slate-600 rounded-full overflow-hidden bg-slate-50 dark:bg-slate-700">
                <img 
                  src={form.logo.startsWith('/uploads') ? `${SERVER_URL}${form.logo}` : form.logo} 
                  alt="Logo preview" 
                  className="w-full h-full object-contain" 
                />
              </div>
            )}
            <div className="w-full max-w-md">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded p-2 text-sm"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">Max size: 500KB. Recommended: square aspect ratio</p>
            </div>
          </div>
        </div>

        {/* Banner Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Banner Image
          </label>
          <div className="space-y-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleBannerUpload}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded p-2 text-sm"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">Max size: 2MB. Recommended: wide aspect ratio (16:4)</p>
            {form.photo && (
              <div className="w-full h-64 border border-slate-300 dark:border-slate-600 rounded overflow-hidden bg-slate-50 dark:bg-slate-700">
                <img 
                  src={form.photo.startsWith('/uploads') ? `${SERVER_URL}${form.photo}` : form.photo} 
                  alt="Banner preview" 
                  className="w-full h-full object-cover" 
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={loadProfile}
            className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Color Customization */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Color Customization</h3>
        <ColorPicker schoolId={schoolId} schoolName={form.name} />
      </div>
    </div>
  );
}
