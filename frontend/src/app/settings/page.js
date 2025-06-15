"use client";
import { useState } from "react";
import { FiUser, FiLock, FiEye, FiBell, FiSettings, FiGlobe, FiShield, FiLogOut, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import AccountSettings from "../components/settings/AccountSettings";
import PrivacySettings from "../components/settings/PrivacySettings";
import NotificationSettings from "../components/settings/NotificationSettings";
import AppearanceSettings from "../components/settings/AppearanceSettings";
import SecuritySettings from "../components/settings/SecuritySettings";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return <AccountSettings />;
      case "privacy":
        return <PrivacySettings />;
      case "notifications":
        return <NotificationSettings />;
      case "appearance":
        return <AppearanceSettings />;
      case "security":
        return <SecuritySettings />;
      default:
        return <AccountSettings />;
    }
  };

  const getTabName = () => {
    switch (activeTab) {
      case "account": return "Account";
      case "privacy": return "Privacy";
      case "notifications": return "Notifications";
      case "appearance": return "Appearance";
      case "security": return "Security";
      default: return "Account";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
      <div className="md:hidden flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <button 
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
        >
          {showMobileMenu ? <FiChevronLeft size={20} /> : <FiChevronRight size={20} />}
        </button>
      </div>
      
      <div className="hidden md:block mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar - Hidden on mobile unless toggled */}
        <div className={`${showMobileMenu ? 'block' : 'hidden'} md:block w-full md:w-64 bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 md:mb-0`}>
          <div className="space-y-1">
            <button
              onClick={() => {
                setActiveTab("account");
                setShowMobileMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                activeTab === "account" 
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <FiUser className="text-lg" />
              <span>Account</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("privacy");
                setShowMobileMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                activeTab === "privacy" 
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <FiEye className="text-lg" />
              <span>Privacy</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("notifications");
                setShowMobileMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                activeTab === "notifications" 
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <FiBell className="text-lg" />
              <span>Notifications</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("appearance");
                setShowMobileMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                activeTab === "appearance" 
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <FiSettings className="text-lg" />
              <span>Appearance</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("security");
                setShowMobileMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                activeTab === "security" 
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <FiShield className="text-lg" />
              <span>Security</span>
            </button>

            <hr className="my-4 border-gray-200 dark:border-gray-700" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <FiLogOut className="text-lg" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
          {/* Mobile Tab Title */}
          <div className="md:hidden mb-4">
            <h2 className="text-xl font-semibold">{getTabName()} Settings</h2>
          </div>
          
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
} 