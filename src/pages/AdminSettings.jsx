import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function AdminSettings() {
  const { theme, setTheme } = useTheme();
  const [headerColors, setHeaderColors] = useState({
    from: localStorage.getItem('adminHeaderFrom') || 'blue-500',
    to: localStorage.getItem('adminHeaderTo') || 'purple-600'
  });
  const [sidebarColors, setSidebarColors] = useState({
    from: localStorage.getItem('adminSidebarFrom') || 'indigo-600',
    to: localStorage.getItem('adminSidebarTo') || 'indigo-800'
  });
  const [success, setSuccess] = useState('');

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

  const saveColors = () => {
    localStorage.setItem('adminHeaderFrom', headerColors.from);
    localStorage.setItem('adminHeaderTo', headerColors.to);
    localStorage.setItem('adminSidebarFrom', sidebarColors.from);
    localStorage.setItem('adminSidebarTo', sidebarColors.to);
    setSuccess('Colors saved! Refreshing page...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const resetColors = () => {
    const defaultHeader = { from: 'blue-500', to: 'purple-600' };
    const defaultSidebar = { from: 'indigo-600', to: 'indigo-800' };
    setHeaderColors(defaultHeader);
    setSidebarColors(defaultSidebar);
    localStorage.removeItem('adminHeaderFrom');
    localStorage.removeItem('adminHeaderTo');
    localStorage.removeItem('adminSidebarFrom');
    localStorage.removeItem('adminSidebarTo');
    setSuccess('Colors reset to defaults! Refreshing page...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const getColorPreview = (colorClass) => {
    const colorMap = {
      'white': '#ffffff',
      'blue-500': '#3b82f6',
      'indigo-600': '#4f46e5',
      'purple-600': '#9333ea',
      'pink-500': '#ec4899',
      'red-500': '#ef4444',
      'orange-500': '#f97316',
      'amber-500': '#f59e0b',
      'yellow-500': '#eab308',
      'lime-500': '#84cc16',
      'green-600': '#16a34a',
      'emerald-600': '#059669',
      'teal-600': '#0d9488',
      'cyan-500': '#06b6d4',
      'sky-500': '#0ea5e9',
      'violet-600': '#7c3aed',
      'fuchsia-600': '#c026d3',
      'rose-500': '#f43f5e',
      'slate-700': '#334155'
    };
    return colorMap[colorClass] || '#6b7280';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-slate-800 dark:text-slate-200">Admin Settings</h2>

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
        </div>
      </div>

      {/* Color Customization */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Color Customization</h3>

        {/* Header Colors */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Top Header Colors
          </label>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Start Color</p>
              <div className="grid grid-cols-6 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setHeaderColors({ ...headerColors, from: color.value })}
                    className={`p-3 rounded-lg border-2 transition ${
                      headerColors.from === color.value
                        ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
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
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setHeaderColors({ ...headerColors, to: color.value })}
                    className={`p-3 rounded-lg border-2 transition ${
                      headerColors.to === color.value
                        ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
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

        {/* Sidebar Colors */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Side Menu Colors
          </label>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Start Color</p>
              <div className="grid grid-cols-6 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSidebarColors({ ...sidebarColors, from: color.value })}
                    className={`p-3 rounded-lg border-2 transition ${
                      sidebarColors.from === color.value
                        ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
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
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSidebarColors({ ...sidebarColors, to: color.value })}
                    className={`p-3 rounded-lg border-2 transition ${
                      sidebarColors.to === color.value
                        ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
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

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={saveColors}
            className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition"
          >
            Save & Apply
          </button>
          <button
            type="button"
            onClick={resetColors}
            className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}
