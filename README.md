# WEBsaleAI — ML-Powered E-Commerce Platform

> Nền tảng thương mại điện tử tích hợp AI gợi ý sản phẩm thông minh với hệ thống Hybrid Recommendation (CF + CB + NCF).

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue)](https://docker.com)

---

## 📋 Tổng quan

WEBsaleAI là một nền tảng e-commerce đầy đủ tính năng với:

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: Node.js + Express + Prisma ORM + PostgreSQL
- **ML Service**: Python FastAPI + Hybrid Recommendation Engine (CF/CB/NCF)
- **Cache**: Redis
- **Monitoring**: Prometheus + Grafana

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API   │────▶│   ML Service    │
│  (Next.js 14)   │     │  (Express/Node) │     │  (FastAPI/Py)   │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌──────────┐ ┌─────────┐ ┌──────────┐
              │PostgreSQL│ │  Redis  │ │ MongoDB  │
              └──────────┘ └─────────┘ └──────────┘
```

---

## 🚀 Tính năng

### 🛍️ Shop
- Trang chủ với Hero Slider và AI Recommendations
- Danh sách sản phẩm với filter, sort, phân trang
- Chi tiết sản phẩm với gallery ảnh, tabs mô tả/thông số/đánh giá
- Giỏ hàng (CartDrawer + trang /cart)
- Thanh toán đầy đủ với địa chỉ giao hàng và phương thức thanh toán
- Flash Sale với countdown timer
- Danh sách yêu thích (Wishlist)
- Tìm kiếm sản phẩm
- Danh mục sản phẩm

### 👤 Người dùng
- Đăng ký / Đăng nhập với JWT + Refresh Token
- Quên mật khẩu
- Quản lý hồ sơ cá nhân
- Lịch sử đơn hàng với tracking
- Danh sách yêu thích

### 🤖 AI Recommendations
- **Collaborative Filtering (ALS)**: Gợi ý dựa trên hành vi người dùng tương tự
- **Content-Based (TF-IDF)**: Gợi ý dựa trên đặc điểm sản phẩm
- **Neural Collaborative Filtering (NCF)**: Deep learning recommendation
- **Hybrid Engine**: Kết hợp CF (50%) + CB (30%) + NCF (20%)
- Tracking click và conversion
- MLflow experiment tracking

### 🔧 Admin
- Dashboard với thống kê doanh thu, đơn hàng, người dùng
- Quản lý sản phẩm (CRUD)
- Quản lý đơn hàng
- Kích hoạt retrain AI model
- Xem metrics và logs

### 🌐 UX/UI
- Responsive design (mobile-first)
- Dark/Light mode
- Đa ngôn ngữ: Tiếng Việt / English
- Toast notifications
- Skeleton loading states
- Smooth animations (Framer Motion)
- Scroll-snap product carousel

---

## 📁 Cấu trúc dự án

```
WEBsaleAI/
├── frontend/                    # Next.js 14 App
│   └── src/
│       ├── app/
│       │   ├── (auth)/          # Login, Register, Forgot Password
│       │   ├── (shop)/          # Shop pages
│       │   │   ├── page.tsx     # Home
│       │   │   ├── products/    # Product listing
│       │   │   ├── product/[slug]/ # Product detail
│       │   │   ├── cart/        # Cart page
│       │   │   ├── checkout/    # Checkout
│       │   │   ├── orders/      # Order history + detail
│       │   │   ├── profile/     # User profile
│       │   │   ├── wishlist/    # Wishlist
│       │   │   ├── search/      # Search results
│       │   │   ├── category/[slug]/ # Category products
│       │   │   ├── categories/  # All categories
│       │   │   ├── recommendations/ # AI recommendations
│       │   │   ├── flash-sale/  # Flash sale
│       │   │   └── admin/       # Admin dashboard
│       │   └── not-found.tsx    # 404 page
│       ├── components/
│       │   ├── common/          # Header, Footer, Toast
│       │   └── shop/            # ProductCard, CartDrawer, HeroSection, RecommendationSection
│       ├── lib/
│       │   ├── api.ts           # API client (axios)
│       │   ├── i18n.ts          # Internationalization (vi/en)
│       │   └── utils.ts         # Utility functions
│       └── store/
│           ├── authStore.ts     # Auth state (Zustand)
│           └── cartStore.ts     # Cart state (Zustand)
│
├── backend/                     # Node.js Express API
│   └── src/
│       ├── controllers/         # Business logic
│       ├── routes/              # API routes
│       ├── middleware/          # Auth, error handling, rate limiting
│       ├── lib/                 # Prisma, Redis, MongoDB, Logger
│       └── types/               # TypeScript types
│
├── ml-service/                  # Python FastAPI ML Service
│   ├── models/                  # CF, CB, NCF, Hybrid models
│   ├── routers/                 # API routers
│   ├── training/                # Training pipeline
│   ├── evaluation/              # Metrics
│   └── tests/                   # Test suite
│
├── monitoring/                  # Prometheus config
├── scripts/                     # Setup scripts
└── docker-compose.yml           # Docker orchestration
```

---

## 🛠️ Cài đặt & Chạy

### Yêu cầu
- Docker & Docker Compose
- Node.js 20+ (cho development)
- Python 3.11+ (cho ML service development)

### Chạy với Docker (Khuyến nghị)

```bash
# Clone repo
git clone https://github.com/in4SECxMinDandy/WEBsaleAI.git
cd WEBsaleAI

# Copy env files
cp .env.example .env
cp backend/.env.example backend/.env
cp ml-service/.env.example ml-service/.env

# Chỉnh sửa các file .env theo môi trường của bạn

# Khởi động tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f
```

### Chạy Development

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev

# ML Service
cd ml-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/logout` | Đăng xuất |
| POST | `/api/auth/refresh-token` | Làm mới token |
| GET | `/api/auth/me` | Thông tin user |
| PUT | `/api/auth/me` | Cập nhật profile |
| POST | `/api/auth/forgot-password` | Quên mật khẩu |

### Products
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/products` | Danh sách sản phẩm (filter, sort, search) |
| GET | `/api/products/:slug` | Chi tiết sản phẩm |
| GET | `/api/products/:id/reviews` | Đánh giá sản phẩm |
| POST | `/api/products/:id/reviews` | Tạo đánh giá |

### Cart & Orders
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/cart` | Xem giỏ hàng |
| POST | `/api/cart/items` | Thêm vào giỏ |
| PUT | `/api/cart/items/:id` | Cập nhật số lượng |
| DELETE | `/api/cart/items/:id` | Xóa khỏi giỏ |
| POST | `/api/orders` | Tạo đơn hàng |
| GET | `/api/orders` | Lịch sử đơn hàng |
| GET | `/api/orders/:id` | Chi tiết đơn hàng |
| PUT | `/api/orders/:id/cancel` | Hủy đơn hàng |

### Wishlist
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/wishlist` | Danh sách yêu thích |
| POST | `/api/wishlist/:productId` | Thêm vào yêu thích |
| DELETE | `/api/wishlist/:productId` | Xóa khỏi yêu thích |

### Recommendations
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/recommendations/for-you` | Gợi ý cá nhân hóa |
| GET | `/api/recommendations/trending` | Sản phẩm trending |
| GET | `/api/recommendations/similar/:id` | Sản phẩm tương tự |
| POST | `/api/recommendations/click` | Track click |

### ML Service (Port 8001)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/health` | Health check |
| POST | `/recommendations/for-you` | Gợi ý cá nhân |
| POST | `/recommendations/similar` | Sản phẩm tương tự |
| GET | `/recommendations/trending` | Trending |
| POST | `/admin/train` | Kích hoạt training |
| GET | `/admin/models` | Danh sách models |

---

## 🤖 ML Architecture

### Hybrid Recommendation Engine

```
User Request
     │
     ▼
┌─────────────────────────────────────┐
│         Hybrid Engine               │
│                                     │
│  CF (50%) + CB (30%) + NCF (20%)   │
│                                     │
│  ┌──────────┐  ┌──────────────────┐ │
│  │   ALS    │  │   TF-IDF         │ │
│  │ (Matrix  │  │ (Content-Based)  │ │
│  │ Factor.) │  └──────────────────┘ │
│  └──────────┘  ┌──────────────────┐ │
│                │   NCF (Neural)   │ │
│                │  Deep Learning   │ │
│                └──────────────────┘ │
└─────────────────────────────────────┘
     │
     ▼
  Ranked Results (with Redis cache)
```

### Training Pipeline
1. Load events + products từ PostgreSQL
2. Time-based train/test split (80/20)
3. Train CF (ALS) model
4. Train CB (TF-IDF) model
5. Train NCF (Neural CF) nếu đủ data (≥50 events)
6. Evaluate với Precision@K, Recall@K, NDCG@K
7. Save artifacts + log to MLflow
8. Persist model metadata to DB

---

## 🔒 Bảo mật

- JWT Access Token (15 phút) + Refresh Token (7 ngày) với rotation
- Bcrypt password hashing (cost factor 12)
- Rate limiting: 20 req/15min (auth), 200 req/min (API)
- Helmet.js security headers
- CORS configuration
- Input validation với Zod (frontend) và express-validator (backend)
- SQL injection prevention via Prisma ORM
- XSS protection

---

## 📊 Monitoring

- **Prometheus**: Metrics collection (port 9090)
- **Grafana**: Visualization dashboard (port 3001)
- **MLflow**: ML experiment tracking (port 5000)
- **Health checks**: `/health` endpoint trên tất cả services

---

## 🌐 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/mlshop
REDIS_URL=redis://localhost:6379
MONGODB_URI=mongodb://localhost:27017/mlshop
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=http://localhost:3000
ML_SERVICE_URL=http://localhost:8001
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_ML_URL=http://localhost:8001
```

### ML Service (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/mlshop
REDIS_URL=redis://localhost:6379
MLFLOW_TRACKING_URI=http://localhost:5000
MODEL_DIR=/app/models
```

---

## 📝 License

MIT License — © 2024 WEBsaleAI Team
