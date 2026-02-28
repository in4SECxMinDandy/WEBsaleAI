// ============================================================
// Simple i18n — Vietnamese / English
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'vi' | 'en';

// ─── Translations ─────────────────────────────────────────

const translations = {
  vi: {
    // Navigation
    'nav.home': 'Trang chủ',
    'nav.products': 'Sản phẩm',
    'nav.flashSale': 'Flash Sale',
    'nav.recommendations': 'Gợi ý AI',
    'nav.login': 'Đăng nhập',
    'nav.register': 'Đăng ký',
    'nav.profile': 'Tài khoản',
    'nav.orders': 'Đơn hàng',
    'nav.wishlist': 'Yêu thích',
    'nav.logout': 'Đăng xuất',
    'nav.search': 'Tìm kiếm',
    'nav.cart': 'Giỏ hàng',

    // Common
    'common.loading': 'Đang tải...',
    'common.error': 'Đã có lỗi xảy ra',
    'common.retry': 'Thử lại',
    'common.save': 'Lưu',
    'common.cancel': 'Hủy',
    'common.delete': 'Xóa',
    'common.edit': 'Chỉnh sửa',
    'common.close': 'Đóng',
    'common.back': 'Quay lại',
    'common.next': 'Tiếp theo',
    'common.previous': 'Trước',
    'common.viewAll': 'Xem tất cả',
    'common.noData': 'Không có dữ liệu',
    'common.search': 'Tìm kiếm',
    'common.filter': 'Bộ lọc',
    'common.sort': 'Sắp xếp',

    // Product
    'product.addToCart': 'Thêm vào giỏ',
    'product.buyNow': 'Mua ngay',
    'product.outOfStock': 'Hết hàng',
    'product.inStock': 'Còn hàng',
    'product.reviews': 'đánh giá',
    'product.sold': 'đã bán',
    'product.discount': 'Giảm',
    'product.featured': 'Nổi bật',
    'product.aiPick': 'AI Pick',
    'product.relevance': 'Độ phù hợp AI',

    // Cart
    'cart.title': 'Giỏ hàng',
    'cart.empty': 'Giỏ hàng trống',
    'cart.emptyDesc': 'Thêm sản phẩm vào giỏ để tiếp tục mua sắm',
    'cart.subtotal': 'Tạm tính',
    'cart.shipping': 'Phí vận chuyển',
    'cart.total': 'Tổng cộng',
    'cart.freeShipping': 'Miễn phí',
    'cart.checkout': 'Tiến hành thanh toán',
    'cart.continueShopping': 'Tiếp tục mua sắm',

    // Auth
    'auth.login': 'Đăng nhập',
    'auth.register': 'Đăng ký',
    'auth.email': 'Email',
    'auth.password': 'Mật khẩu',
    'auth.confirmPassword': 'Xác nhận mật khẩu',
    'auth.fullName': 'Họ và tên',
    'auth.phone': 'Số điện thoại',
    'auth.forgotPassword': 'Quên mật khẩu?',
    'auth.noAccount': 'Chưa có tài khoản?',
    'auth.hasAccount': 'Đã có tài khoản?',
    'auth.loginSuccess': 'Đăng nhập thành công!',
    'auth.registerSuccess': 'Đăng ký thành công!',
    'auth.loginFailed': 'Đăng nhập thất bại',
    'auth.registerFailed': 'Đăng ký thất bại',

    // Orders
    'orders.title': 'Đơn hàng của tôi',
    'orders.empty': 'Chưa có đơn hàng nào',
    'orders.status.pending': 'Chờ xác nhận',
    'orders.status.confirmed': 'Đã xác nhận',
    'orders.status.processing': 'Đang xử lý',
    'orders.status.shipped': 'Đang giao',
    'orders.status.delivered': 'Đã giao',
    'orders.status.cancelled': 'Đã hủy',
    'orders.status.refunded': 'Đã hoàn tiền',

    // Recommendations
    'rec.forYou': 'Gợi ý cho bạn',
    'rec.trending': 'Đang thịnh hành',
    'rec.similar': 'Sản phẩm tương tự',
    'rec.forYouDesc': 'Được cá nhân hóa bởi AI dựa trên hành vi của bạn',
    'rec.trendingDesc': 'Được mua nhiều nhất trong thời gian gần đây',
    'rec.similarDesc': 'Sản phẩm có đặc điểm tương tự',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.flashSale': 'Flash Sale',
    'nav.recommendations': 'AI Picks',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.profile': 'Account',
    'nav.orders': 'Orders',
    'nav.wishlist': 'Wishlist',
    'nav.logout': 'Logout',
    'nav.search': 'Search',
    'nav.cart': 'Cart',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.retry': 'Retry',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.viewAll': 'View all',
    'common.noData': 'No data',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',

    // Product
    'product.addToCart': 'Add to cart',
    'product.buyNow': 'Buy now',
    'product.outOfStock': 'Out of stock',
    'product.inStock': 'In stock',
    'product.reviews': 'reviews',
    'product.sold': 'sold',
    'product.discount': 'Off',
    'product.featured': 'Featured',
    'product.aiPick': 'AI Pick',
    'product.relevance': 'AI Relevance',

    // Cart
    'cart.title': 'Shopping Cart',
    'cart.empty': 'Your cart is empty',
    'cart.emptyDesc': 'Add products to your cart to continue shopping',
    'cart.subtotal': 'Subtotal',
    'cart.shipping': 'Shipping',
    'cart.total': 'Total',
    'cart.freeShipping': 'Free',
    'cart.checkout': 'Proceed to checkout',
    'cart.continueShopping': 'Continue shopping',

    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm password',
    'auth.fullName': 'Full name',
    'auth.phone': 'Phone number',
    'auth.forgotPassword': 'Forgot password?',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.loginSuccess': 'Login successful!',
    'auth.registerSuccess': 'Registration successful!',
    'auth.loginFailed': 'Login failed',
    'auth.registerFailed': 'Registration failed',

    // Orders
    'orders.title': 'My Orders',
    'orders.empty': 'No orders yet',
    'orders.status.pending': 'Pending',
    'orders.status.confirmed': 'Confirmed',
    'orders.status.processing': 'Processing',
    'orders.status.shipped': 'Shipped',
    'orders.status.delivered': 'Delivered',
    'orders.status.cancelled': 'Cancelled',
    'orders.status.refunded': 'Refunded',

    // Recommendations
    'rec.forYou': 'For You',
    'rec.trending': 'Trending',
    'rec.similar': 'Similar Products',
    'rec.forYouDesc': 'Personalized by AI based on your behavior',
    'rec.trendingDesc': 'Most purchased recently',
    'rec.similarDesc': 'Products with similar characteristics',
  },
} as const;

type TranslationKey = keyof typeof translations.vi;

// ─── i18n Store ───────────────────────────────────────────

interface I18nStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

export const useI18n = create<I18nStore>()(
  persist(
    (set, get) => ({
      locale: 'vi',
      setLocale: (locale) => set({ locale }),
      t: (key) => {
        const { locale } = get();
        return (translations[locale] as Record<string, string>)[key] || key;
      },
    }),
    {
      name: 'i18n-locale',
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);

// Convenience hook
export function useTranslation() {
  const { t, locale, setLocale } = useI18n();
  return { t, locale, setLocale };
}
