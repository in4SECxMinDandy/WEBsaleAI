'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Search, User, Menu, X, ChevronDown,
  Sparkles, Bell, Heart, LogOut, Settings, Package,
  Sun, Moon, Zap, Globe,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Trang chủ', href: '/' },
  {
    label: 'Sản phẩm',
    href: '/products',
    children: [
      { label: 'Điện tử', href: '/category/dien-tu' },
      { label: 'Thời trang', href: '/category/thoi-trang' },
      { label: 'Thực phẩm', href: '/category/thuc-pham' },
      { label: 'Tất cả danh mục', href: '/categories' },
    ],
  },
  { label: 'Flash Sale', href: '/flash-sale', badge: 'HOT' },
  { label: 'Gợi ý AI', href: '/recommendations', badge: 'AI' },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { totalItems, openCart } = useCartStore();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { locale, setLocale } = useTranslation();

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const cartCount = totalItems();

  return (
    <>
      {/* Top announcement bar */}
      <motion.div
        initial={{ y: -40 }}
        animate={{ y: 0 }}
        className="bg-gradient-to-r from-primary-600 via-accent-600 to-primary-600 animated-gradient text-white text-center py-2 text-xs sm:text-sm font-medium"
      >
        <span className="flex items-center justify-center gap-2">
          <Zap className="w-3.5 h-3.5 animate-bounce-subtle" />
          Miễn phí vận chuyển cho đơn hàng trên 500.000đ — Gợi ý AI cá nhân hóa cho bạn!
          <Zap className="w-3.5 h-3.5 animate-bounce-subtle" />
        </span>
      </motion.div>

      {/* Main header */}
      <motion.header
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-300',
          isScrolled
            ? 'bg-background/95 backdrop-blur-xl shadow-md border-b border-border/50'
            : 'bg-background border-b border-border/30'
        )}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="section-container">
          <div className="flex h-16 items-center justify-between gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <motion.div
                className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow-sm"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg gradient-text">ML</span>
                <span className="font-bold text-lg text-foreground">Shop</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <div
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => link.children && setActiveDropdown(link.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium',
                      'text-muted-foreground hover:text-foreground hover:bg-accent',
                      'transition-all duration-200 relative group'
                    )}
                  >
                    {link.label}
                    {link.badge && (
                      <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                        link.badge === 'HOT' ? 'bg-red-500 text-white' : 'bg-primary-500 text-white'
                      )}>
                        {link.badge}
                      </span>
                    )}
                    {link.children && (
                      <ChevronDown className={cn(
                        'w-3.5 h-3.5 transition-transform duration-200',
                        activeDropdown === link.label && 'rotate-180'
                      )} />
                    )}
                  </Link>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {link.children && activeDropdown === link.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute top-full left-0 mt-1 w-52 bg-card border border-border rounded-xl shadow-card-hover overflow-hidden z-50"
                      >
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="flex items-center px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1 sm:gap-2">

              {/* Search */}
              <motion.button
                onClick={() => setIsSearchOpen(true)}
                className="btn-ghost p-2 rounded-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Tìm kiếm"
              >
                <Search className="w-5 h-5" />
              </motion.button>

              {/* Language toggle */}
              <motion.button
                onClick={() => setLocale(locale === 'vi' ? 'en' : 'vi')}
                className="btn-ghost p-2 rounded-lg hidden sm:flex items-center gap-1 text-xs font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Đổi ngôn ngữ"
                title={locale === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
              >
                <Globe className="w-4 h-4" />
                <span className="uppercase">{locale}</span>
              </motion.button>

              {/* Theme toggle */}
              <motion.button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="btn-ghost p-2 rounded-lg hidden sm:flex"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Đổi theme"
              >
                <AnimatePresence mode="wait">
                  {theme === 'dark' ? (
                    <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Sun className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Moon className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Wishlist */}
              {isAuthenticated && (
                <Link href="/wishlist">
                  <motion.button
                    className="btn-ghost p-2 rounded-lg hidden sm:flex"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Yêu thích"
                  >
                    <Heart className="w-5 h-5" />
                  </motion.button>
                </Link>
              )}

              {/* Cart */}
              <motion.button
                onClick={openCart}
                className="btn-ghost p-2 rounded-lg relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Giỏ hàng"
              >
                <ShoppingCart className="w-5 h-5" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key="cart-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                    >
                      {cartCount > 99 ? '99+' : cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* User menu */}
              {isAuthenticated ? (
                <div className="relative group">
                  <motion.button
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-xs font-bold">
                      {user?.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
                      {user?.fullName || 'Tài khoản'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 hidden sm:block" />
                  </motion.button>

                  {/* User dropdown */}
                  <div className="absolute right-0 top-full mt-1 w-52 bg-card border border-border rounded-xl shadow-card-hover overflow-hidden z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium truncate">{user?.fullName || 'Người dùng'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <Link href="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors">
                      <Package className="w-4 h-4" /> Đơn hàng của tôi
                    </Link>
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors">
                      <Settings className="w-4 h-4" /> Cài đặt tài khoản
                    </Link>
                    {(user?.role === 'admin' || user?.role === 'superadmin') && (
                      <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors text-primary-600">
                        <Sparkles className="w-4 h-4" /> Admin Dashboard
                      </Link>
                    )}
                    <div className="border-t border-border">
                      <button
                        onClick={clearAuth}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" /> Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <motion.button
                      className="btn-ghost px-3 py-2 text-sm hidden sm:flex"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Đăng nhập
                    </motion.button>
                  </Link>
                  <Link href="/register">
                    <motion.button
                      className="btn-primary px-4 py-2 text-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Đăng ký
                    </motion.button>
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="btn-ghost p-2 rounded-lg lg:hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait">
                  {isMobileMenuOpen ? (
                    <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="lg:hidden border-t border-border overflow-hidden bg-background"
            >
              <div className="section-container py-4 space-y-1">
                {navLinks.map((link) => (
                  <div key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                    >
                      <span>{link.label}</span>
                      {link.badge && (
                        <span className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                          link.badge === 'HOT' ? 'bg-red-500 text-white' : 'bg-primary-500 text-white'
                        )}>
                          {link.badge}
                        </span>
                      )}
                    </Link>
                    {link.children && (
                      <div className="ml-4 space-y-1">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Search overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="section-container pt-20"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm, thương hiệu..."
                  className="w-full h-14 pl-12 pr-16 text-lg bg-card border-2 border-primary-300 rounded-2xl shadow-glow-sm focus:outline-none focus:border-primary-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-accent transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Nhấn <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd> để tìm kiếm
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
