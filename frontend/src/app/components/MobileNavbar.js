"use client";
import Link from "next/link";
import { FiMenu, FiX, FiHome, FiUser, FiSettings, FiLogIn, FiLogOut, FiPlusSquare, FiMessageCircle, FiUsers, FiBell } from "react-icons/fi";
import OptimizedImage from './OptimizedImage';

export default function MobileNavbar({ user, toggleMenu, isOpen }) {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-10 shadow-md transition-colors duration-300" style={{ backgroundColor: 'var(--navbar-bg)', color: 'var(--navbar-text)', borderBottom: '1px solid var(--navbar-border)' }}>
        <div className="flex justify-between items-center px-3 py-3">
          <Link href="/" className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
            Moment
          </Link>
          <div className="flex items-center space-x-2">
            {user && (
              <Link href="/notifications" className="relative p-1 mr-1">
                <FiBell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                {Math.random() > 0.5 && (
                  <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500"></span>
                )}
              </Link>
            )}
            <button onClick={toggleMenu} className="p-2 text-gray-900 dark:text-white rounded-full hover:bg-gray-100">
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-50 bg-white dark:bg-gray-900 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{ top: '60px' }}>
        <div className="flex flex-col h-full p-4 overflow-y-auto pb-20">
          <div className="flex-1 space-y-4">
            {user ? (
              <>
                <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <OptimizedImage
                      src={user.profilePic || `https://ui-avatars.com/api/?name=${user.username}&background=random`} 
                      alt={user.username} 
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{user.username}</div>
                    <Link href="/profile" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
                      View profile
                    </Link>
                  </div>
                </div>
                
                <Link href="/" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <FiHome size={20} />
                  <span>Home</span>
                </Link>
                
                <Link href="/profile" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <FiUser size={20} />
                  <span>Profile</span>
                </Link>
                
                <Link href="/feed" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <FiUsers size={20} />
                  <span>Feed</span>
                </Link>
                
                <Link href="/messages" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <FiMessageCircle size={20} />
                  <span>Messages</span>
                </Link>
                
                <Link href="/notifications" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <FiBell size={20} />
                  <span>Notifications</span>
                </Link>
                
                <Link href="/post/new" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <FiPlusSquare size={20} />
                  <span>Create Post</span>
                </Link>
                
                <Link href="/settings" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <FiSettings size={20} />
                  <span>Settings</span>
                </Link>
                
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left"
                >
                  <FiLogOut size={20} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <FiHome size={20} />
                  <span>Home</span>
                </Link>
                
                <Link href="/login" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <FiLogIn size={20} />
                  <span>Login</span>
                </Link>
                
                <Link href="/register" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <FiUser size={20} />
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation Bar for quick access */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden z-10">
        <div className="flex justify-around items-center h-16">
          <Link href="/" className="flex flex-col items-center justify-center text-gray-600 dark:text-gray-400 p-2">
            <FiHome size={20} />
            <span className="text-xs mt-1">Home</span>
          </Link>
          
          <Link href="/feed" className="flex flex-col items-center justify-center text-gray-600 dark:text-gray-400 p-2">
            <FiUsers size={20} />
            <span className="text-xs mt-1">Feed</span>
          </Link>
          
          <Link href="/post/new" className="flex flex-col items-center justify-center text-gray-600 dark:text-gray-400 p-2">
            <div className="flex items-center justify-center h-10 w-10 rounded-full text-white" style={{ backgroundColor: 'var(--primary)' }}>
              <FiPlusSquare size={20} />
            </div>
          </Link>
          
          <Link href="/notifications" className="flex flex-col items-center justify-center text-gray-600 dark:text-gray-400 p-2">
            <FiBell size={20} />
            <span className="text-xs mt-1">Alerts</span>
          </Link>
          
          <Link href="/profile" className="flex flex-col items-center justify-center text-gray-600 dark:text-gray-400 p-2">
            {user ? (
              <div className="flex flex-col items-center">
                <div className="h-7 w-7 rounded-full overflow-hidden">
                  <OptimizedImage
                    src={user.profilePic || `https://ui-avatars.com/api/?name=${user.username}&background=random`} 
                    alt={user.username}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="text-xs mt-1">Profile</span>
              </div>
            ) : (
              <>
                <FiUser size={20} />
                <span className="text-xs mt-1">Profile</span>
              </>
            )}
          </Link>
        </div>
      </div>
      
      {/* Add padding to bottom of main content on mobile to account for bottom nav */}
      <div className="md:hidden h-16"></div>
    </>
  );
} 