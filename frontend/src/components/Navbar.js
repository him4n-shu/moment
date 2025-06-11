import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiHome, FiPlusSquare, FiUser, FiLogOut } from 'react-icons/fi';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
            Instagram Clone
          </Link>

          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              <FiHome className="w-6 h-6" />
            </Link>
            <Link href="/create" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              <FiPlusSquare className="w-6 h-6" />
            </Link>
            <NotificationBell />
            <Link href="/profile" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              <FiUser className="w-6 h-6" />
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <FiLogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 