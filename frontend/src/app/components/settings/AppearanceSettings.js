"use client";
import { useState, useEffect } from "react";
import { FiSave, FiAlertCircle } from "react-icons/fi";

export default function AppearanceSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const [settings, setSettings] = useState({
    fontSize: "medium", // small, medium, large
    reducedMotion: false,
    highContrast: false,
  });

  // Load appearance settings
  useEffect(() => {
    const fetchAppearanceSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          window.location.href = "/login";
          return;
        }

        // In a real app, you would fetch settings from the backend
        // For now, we'll use localStorage to simulate settings persistence
        const savedSettings = localStorage.getItem("appearanceSettings");
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching appearance settings:", error);
        setMessage({
          type: "error",
          text: error.message || "Failed to load appearance settings",
        });
        setLoading(false);
      }
    };

    fetchAppearanceSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggle = (setting) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [setting]: !prevSettings[setting]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      // In a real app, you would send these settings to the backend
      // For now, we'll use localStorage to simulate settings persistence
      localStorage.setItem("appearanceSettings", JSON.stringify(settings));
      
      // Apply font size
      document.documentElement.dataset.fontSize = settings.fontSize;
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setMessage({
        type: "success",
        text: "Appearance settings updated successfully",
      });
    } catch (error) {
      console.error("Error updating appearance settings:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to update appearance settings",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Appearance Settings</h2>

      {message.text && (
        <div
          className={`p-4 mb-6 rounded-lg flex items-center gap-2 ${
            message.type === "error"
              ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
              : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
          }`}
        >
          <FiAlertCircle className="flex-shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Font Size */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">Font Size</h3>
          <div className="flex flex-col space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="fontSize"
                value="small"
                checked={settings.fontSize === "small"}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="ml-2 text-sm">Small</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="fontSize"
                value="medium"
                checked={settings.fontSize === "medium"}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="ml-2 text-base">Medium (Default)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="fontSize"
                value="large"
                checked={settings.fontSize === "large"}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="ml-2 text-lg">Large</span>
            </label>
          </div>
        </div>

        {/* Accessibility */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">Accessibility</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <h4 className="font-medium">Reduced Motion</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Minimize animations and transitions
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.reducedMotion}
                  onChange={() => handleToggle("reducedMotion")}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-500"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <h4 className="font-medium">High Contrast</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Increase contrast for better visibility
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.highContrast}
                  onChange={() => handleToggle("highContrast")}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full md:w-auto flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors"
        >
          {saving ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <FiSave />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
} 