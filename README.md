<div align="center">

# 🛍️ WEBsaleAI

### Nền tảng Thương mại Điện tử tích hợp AI Gợi ý Sản phẩm Thông minh

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript)](https://typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)](https://nodejs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

[Demo](#) · [Tài liệu API](#api-endpoints) · [Báo lỗi](https://github.com/in4SECxMinDandy/WEBsaleAI/issues)

</div>

---

## 📖 Giới thiệu

**WEBsaleAI** là một nền tảng thương mại điện tử full-stack hiện đại, tích hợp hệ thống gợi ý sản phẩm dựa trên AI. Hệ thống sử dụng **Hybrid Recommendation Engine** kết hợp ba thuật toán:

- 🤝 **Collaborative Filtering (ALS)** — Gợi ý dựa trên hành vi người dùng tương tự
- 📝 **Content-Based Filtering (TF-IDF)** — Gợi ý dựa trên đặc điểm sản phẩm
- 🧠 **Neural Collaborative Filtering (NCF)** — Deep learning recommendation

Càng nhiều người dùng tương tác, hệ thống AI càng học và gợi ý chính xác hơn.

---

## ✨ Tính năng nổi bật

### 🛒 Trải nghiệm mua sắm
| Tính năng | Mô tả |
|-----------|-------|
| **Trang chủ thông minh** | Hero slider + AI recommendations cá nhân hóa |
| **Danh sách sản phẩm** | Filter đa chiều, sort, tìm kiếm, phân trang |
| **Chi tiết sản phẩm** | Gallery ảnh, tabs mô tả/thông số/đánh giá, sản phẩm tương tự |
| **Giỏ hàng** | CartDrawer slide-in + trang giỏ hàng đầy đủ |
| **Thanh toán** | Form địa chỉ, 4 phương thức thanh toán, xác nhận đơn |
| **Flash Sale** | Countdown timer realtime, giảm giá sốc |
| **Danh sách yêu thích** | Lưu sản phẩm, bulk add-to-cart |
| **Tìm kiếm** | Full-text search với kết quả tức thì |

### 👤 Quản lý tài khoản
| Tính năng | Mô tả |
|-----------|-------|
| **Xác thực** | JWT + Refresh Token rotation, bcrypt hashing |
| **Đăng ký/Đăng nhập** | Password strength meter, validation đầy đủ |
| **Quên mật khẩu** | Email reset flow bảo mật |
| **Hồ sơ cá nhân** | Cập nhật thông tin, avatar |
| **Lịch sử đơn hàng** | Status tabs, progress tracker, hủy đơn |

### 🤖 AI & Machine Learning
| Tính năng | Mô tả |
|-----------|-------|
| **Gợi ý cá nhân hóa** | Hybrid CF+CB+NCF với trọng số 50/30/20 |
| **Sản phẩm tương tự** | Content-based similarity |
| **Trending** | Sản phẩm được mua nhiều nhất |
| **Event tracking** | Theo dõi view, click, add-to-cart, purchase |
| **MLflow tracking** | Experiment tracking, model versioning |
| **Auto retrain** | Kích hoạt training từ Admin dashboard |

### 🔧 Admin Dashboard
| Tính năng | Mô tả |
|-----------|-------|
| **Thống kê** | Doanh thu, đơn hàng, người dùng, sản phẩm |
| **Biểu đồ** | Revenue chart, top products bar chart |
| **Quản lý AI** | Xem model status, kích hoạt retrain |
| **Đơn hàng** | Xem và cập nhật trạng thái |

### 🌐 UX/UI
| Tính năng | Mô tả |
|-----------|-------|
| **Responsive** | Mobile-first, hoạt động tốt trên mọi thiết bị |
| **Dark/Light mode** | Chuyển đổi theme mượt mà |
| **Đa ngôn ngữ** | Tiếng Việt / English (toggle trong header) |
| **Animations** | Framer Motion, skeleton loading, smooth transitions |
| **Toast notifications** | Success/Error/Warning/Info |
| **Accessibility** | ARIA labels, keyboard navigation |

---

## 🏗️ Kiến trúc hệ thống

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                       │
│              Next.js 14 + TypeScript + Tailwind           │
└─────────────────────────┬────────────────────────────────┘
                          │ HTTP/REST
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
┌─────────────────┐             ┌─────────────────┐
│   Backend API   │◄───────────►│   ML Service    │
│  Express/Node   │   HTTP      │  FastAPI/Python │
│  Port: 4000     │             │  Port: 8001     │
└────────┬────────┘             └────────┬────────┘
         │                               │
    ┌────┴────────────────┐         ┌────┴────┐
    │                     │         │         │
    ▼                     ▼         ▼         ▼
┌──────────┐        ┌──────────┐ ┌──────┐ ┌────────┐
│PostgreSQL│        │  Redis   │ │Model │ │MLflow  │
│  Port:   │        │  Port:   │ │Files │ │Port:   │
│  5432    │        │  6379    │ │(.pkl)│ │  5000  │
└──────────┘        └──────────┘ └──────┘ └────────┘
```

### Stack công nghệ

| Layer | Công nghệ |
|-------|-----------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Zustand, TanStack Query, Zod |
| **Backend** | Node.js 20, Express, Prisma ORM, TypeScript |
| **ML Service** | Python 3.11, FastAPI, scikit-learn, PyTorch, implicit (ALS) |
| **Database** | PostgreSQL 15 (chính), Redis 7 (cache), MongoDB (logs) |
| **DevOps** | Docker Compose, Prometheus, Grafana |
| **ML Tracking** | MLflow |

---

## 📁 Cấu trúc dự án

```
WEBsaleAI/
├── 📂 frontend/                    # Next.js 14 App Router
│   └── src/
│       ├── app/
│       │   ├── (auth)/             # Trang xác thực (không có header/footer)
│       │   │   ├── login/          # Đăng nhập
│       │   │   ├── register/       # Đăng ký
│       │   │   └── forgot-password/ # Quên mật khẩu
│       │   ├── (shop)/             # Trang shop (có header/footer)
│       │   │   ├── page.tsx        # Trang chủ
│       │   │   ├── products/       # Danh sách sản phẩm
│       │   │   ├── product/[slug]/ # Chi tiết sản phẩm
│       │   │   ├── cart/           # Giỏ hàng
│       │   │   ├── checkout/       # Thanh toán
│       │   │   ├── orders/         # Lịch sử đơn hàng
│       │   │   ├── orders/[id]/    # Chi tiết đơn hàng
│       │   │   ├── profile/        # Hồ sơ người dùng
│       │   │   ├── wishlist/       # Danh sách yêu thích
│       │   │   ├── search/         # Tìm kiếm
│       │   │   ├── category/[slug]/ # Sản phẩm theo danh mục
│       │   │   ├── categories/     # Tất cả danh mục
│       │   │   ├── recommendations/ # Gợi ý AI
│       │   │   ├── flash-sale/     # Flash Sale
│       │   │   └── admin/          # Admin Dashboard
│       │   └── not-found.tsx       # Trang 404
│       ├── components/
│       │   ├── common/             # Header, Footer, Toast, QueryProvider
│       │   └── shop/               # ProductCard, CartDrawer, HeroSection, RecommendationSection
│       ├── lib/
│       │   ├── api.ts              # Axios API client + interceptors
│       │   ├── i18n.ts             # Đa ngôn ngữ VI/EN
│       │   └── utils.ts            # Utility functions
│       └── store/
│           ├── authStore.ts        # Auth state (Zustand + persist)
│           └── cartStore.ts        # Cart state (Zustand + persist)
│
├── 📂 backend/                     # Node.js Express API
│   └── src/
│       ├── controllers/            # Business logic
│       │   ├── auth.controller.ts
│       │   ├── product.controller.ts
│       │   ├── event.controller.ts
│       │   ├── review.controller.ts
│       │   └── wishlist.controller.ts
│       ├── routes/                 # API routes
│       │   ├── auth.routes.ts
│       │   ├── product.routes.ts
│       │   ├── cart.routes.ts
│       │   ├── order.routes.ts
│       │   ├── wishlist.routes.ts
│       │   ├── flash-sale.routes.ts
│       │   ├── recommendation.routes.ts
│       │   ├── event.routes.ts
│       │   └── admin.routes.ts
│       ├── middleware/             # Auth, error, rate limiting, validation
│       ├── lib/                    # Prisma, Redis, MongoDB, Logger
│       └── prisma/
│           └── schema.prisma       # Database schema (15 models)
│
├── 📂 ml-service/                  # Python FastAPI ML Service
│   ├── models/
│   │   ├── collaborative.py        # ALS Collaborative Filtering
│   │   ├── content_based.py        # TF-IDF Content-Based
│   │   ├── ncf.py                  # Neural Collaborative Filtering
│   │   └── hybrid.py               # Hybrid Engine (CF+CB+NCF)
│   ├── routers/
│   │   ├── recommendations.py      # Recommendation endpoints
│   │   ├── events.py               # Event tracking
│   │   └── admin.py                # Admin/training endpoints
│   ├── training/
│   │   └── train_pipeline.py       # Full training pipeline
│   ├── evaluation/
│   │   └── metrics.py              # Precision@K, Recall@K, NDCG@K
│   └── tests/                      # pytest test suite
│
├── 📂 monitoring/
│   └── prometheus.yml              # Prometheus scrape config
│
├── 📄 docker-compose.yml           # Docker orchestration
└── 📄 README.md                    # Tài liệu này
```

---

## 🚀 Cài đặt & Chạy

### Yêu cầu hệ thống
- **Docker** >= 24.0 & **Docker Compose** >= 2.0
- **Node.js** >= 20 (cho development)
- **Python** >= 3.11 (cho ML service development)
- RAM tối thiểu: 4GB (8GB khuyến nghị)

### ⚡ Chạy nhanh với Docker

```bash
# 1. Clone repository
git clone https://github.com/in4SECxMinDandy/WEBsaleAI.git
cd WEBsaleAI

# 2. Cấu hình environment
cp .env.example .env
cp backend/.env.example backend/.env
cp ml-service/.env.example ml-service/.env

# 3. Chỉnh sửa các file .env (xem phần Environment Variables)

# 4. Khởi động tất cả services
docker-compose up -d

# 5. Kiểm tra trạng thái
docker-compose ps
```

Sau khi khởi động:
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| ML Service | http://localhost:8001 |
| MLflow UI | http://localhost:5000 |
| Prometheus | http://localhost:9090 |

### 🛠️ Chạy Development

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev          # Port 4000

# Frontend (terminal mới)
cd frontend
npm install
npm run dev          # Port 3000

# ML Service (terminal mới)
cd ml-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

---

## 🔌 API Endpoints

### 🔐 Authentication
```
POST   /api/auth/register          Đăng ký tài khoản
POST   /api/auth/login             Đăng nhập
POST   /api/auth/logout            Đăng xuất
POST   /api/auth/refresh-token     Làm mới access token
GET    /api/auth/me                Thông tin user hiện tại
PUT    /api/auth/me                Cập nhật profile
POST   /api/auth/forgot-password   Gửi email reset mật khẩu
```

### 📦 Products
```
GET    /api/products               Danh sách (filter, sort, search, paginate)
GET    /api/products/:slug         Chi tiết sản phẩm
GET    /api/products/:id/reviews   Đánh giá sản phẩm
POST   /api/products/:id/reviews   Tạo đánh giá (auth required)
```

### 🛒 Cart & Orders
```
GET    /api/cart                   Xem giỏ hàng
POST   /api/cart/items             Thêm sản phẩm vào giỏ
PUT    /api/cart/items/:id         Cập nhật số lượng
DELETE /api/cart/items/:id         Xóa khỏi giỏ
DELETE /api/cart                   Xóa toàn bộ giỏ

POST   /api/orders                 Tạo đơn hàng từ giỏ
GET    /api/orders                 Lịch sử đơn hàng
GET    /api/orders/:id             Chi tiết đơn hàng
PUT    /api/orders/:id/cancel      Hủy đơn hàng
```

### ❤️ Wishlist
```
GET    /api/wishlist               Danh sách yêu thích
POST   /api/wishlist/:productId    Thêm vào yêu thích
DELETE /api/wishlist/:productId    Xóa khỏi yêu thích
GET    /api/wishlist/check/:id     Kiểm tra đã yêu thích chưa
```

### 🤖 Recommendations
```
GET    /api/recommendations/for-you        Gợi ý cá nhân hóa
GET    /api/recommendations/trending       Sản phẩm trending
GET    /api/recommendations/similar/:id    Sản phẩm tương tự
POST   /api/recommendations/click          Track click recommendation
```

### ⚡ Flash Sales
```
GET    /api/flash-sales/active     Flash sale đang diễn ra
GET    /api/flash-sales            Tất cả flash sales
```

### 📊 Admin (requires admin role)
```
GET    /api/admin/dashboard/stats          Thống kê tổng quan
GET    /api/admin/dashboard/top-products   Sản phẩm bán chạy
GET    /api/admin/dashboard/recent-orders  Đơn hàng gần đây
GET    /api/admin/products                 Danh sách sản phẩm
POST   /api/admin/products                 Tạo sản phẩm
PUT    /api/admin/products/:id             Cập nhật sản phẩm
DELETE /api/admin/products/:id             Xóa sản phẩm
GET    /api/admin/orders                   Danh sách đơn hàng
PUT    /api/admin/orders/:id/status        Cập nhật trạng thái
GET    /api/admin/ml/models                Danh sách ML models
POST   /api/admin/ml/retrain               Kích hoạt retrain
GET    /api/admin/ml/metrics               ML metrics
```

### 🧠 ML Service (Port 8001)
```
GET    /health                     Health check + model status
POST   /recommendations/for-you    Gợi ý cá nhân (CF+CB+NCF)
POST   /recommendations/similar    Sản phẩm tương tự (CB)
GET    /recommendations/trending   Trending (popularity-based)
POST   /events/track               Track user events
POST   /admin/train                Kích hoạt training pipeline
GET    /admin/models               Danh sách models đã train
```

---

## 🤖 Kiến trúc ML

### Hybrid Recommendation Engine

```
                    User Request
                         │
                         ▼
              ┌──────────────────────┐
              │    Hybrid Engine     │
              │                      │
              │  ┌────────────────┐  │
              │  │  CF (ALS) 50%  │  │  ← Collaborative Filtering
              │  │  Matrix Factor │  │    (user-item interactions)
              │  └────────────────┘  │
              │  ┌────────────────┐  │
              │  │  CB (TF-IDF)   │  │  ← Content-Based
              │  │  30%           │  │    (product features)
              │  └────────────────┘  │
              │  ┌────────────────┐  │
              │  │  NCF (Neural)  │  │  ← Neural CF
              │  │  20%           │  │    (deep learning)
              │  └────────────────┘  │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │    Redis Cache       │  ← TTL: 5 phút
              └──────────────────────┘
                         │
                         ▼
                  Ranked Results
```

### Training Pipeline

```
PostgreSQL Events + Products
         │
         ▼
  Time-based Split (80/20)
         │
    ┌────┴────┐
    │         │
    ▼         ▼
Train Set  Test Set
    │
    ├──► Train ALS (CF)
    ├──► Train TF-IDF (CB)
    └──► Train NCF (if ≥50 events)
              │
              ▼
    Evaluate: Precision@K, Recall@K, NDCG@K
              │
              ▼
    Save Models + Log to MLflow
              │
              ▼
    Update DB (ml_models table)
```

---

## 🔒 Bảo mật

- **JWT** Access Token (15 phút) + Refresh Token (7 ngày) với rotation
- **Bcrypt** password hashing (cost factor 12)
- **Rate limiting**: 20 req/15min (auth), 200 req/min (API)
- **Helmet.js** security headers (CSP, HSTS, XSS protection)
- **CORS** configuration chặt chẽ
- **Input validation** với Zod (frontend) và express-validator (backend)
- **SQL injection prevention** via Prisma ORM parameterized queries
- **Email enumeration prevention** trong forgot-password flow

---

## 🌍 Đa ngôn ngữ

Hệ thống hỗ trợ **Tiếng Việt** và **English** thông qua:
- Toggle button trong Header (VI/EN)
- Zustand store với localStorage persistence
- Dễ dàng mở rộng thêm ngôn ngữ trong [`i18n.ts`](frontend/src/lib/i18n.ts)

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/mlshop

# Cache
REDIS_URL=redis://localhost:6379

# MongoDB (for logs)
MONGODB_URI=mongodb://localhost:27017/mlshop

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# App
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
ML_SERVICE_URL=http://localhost:8001
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_ML_URL=http://localhost:8001
```

### ML Service (`ml-service/.env`)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/mlshop
REDIS_URL=redis://localhost:6379
MLFLOW_TRACKING_URI=http://localhost:5000
MODEL_DIR=/app/models
CF_WEIGHT=0.5
CB_WEIGHT=0.3
NCF_WEIGHT=0.2
```

---

## 📊 Database Schema

Hệ thống sử dụng **15 Prisma models**:

| Model | Mô tả |
|-------|-------|
| `User` | Người dùng (customer/staff/admin/superadmin) |
| `RefreshToken` | JWT refresh tokens |
| `Address` | Địa chỉ giao hàng |
| `Category` | Danh mục sản phẩm (hierarchical) |
| `Brand` | Thương hiệu |
| `Product` | Sản phẩm |
| `ProductImage` | Ảnh sản phẩm |
| `ProductAttribute` | Thuộc tính sản phẩm |
| `ProductVariant` | Biến thể sản phẩm |
| `Order` | Đơn hàng |
| `OrderItem` | Chi tiết đơn hàng |
| `Cart` / `CartItem` | Giỏ hàng |
| `Review` | Đánh giá sản phẩm |
| `Wishlist` | Danh sách yêu thích |
| `UserEvent` | Sự kiện người dùng (ML tracking) |
| `RecommendationLog` | Log gợi ý AI |
| `MlModel` | Metadata ML models |
| `Coupon` / `FlashSale` | Khuyến mãi |
| `Notification` | Thông báo |

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# ML Service tests
cd ml-service
pytest tests/ -v

# Frontend type check
cd frontend
npm run type-check
```

---

## 📈 Monitoring

| Service | URL | Mô tả |
|---------|-----|-------|
| Prometheus | http://localhost:9090 | Metrics collection |
| Grafana | http://localhost:3001 | Visualization |
| MLflow | http://localhost:5000 | ML experiment tracking |
| Health Check | http://localhost:4000/health | Backend health |
| ML Health | http://localhost:8001/health | ML service health |

---

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/ten-tinh-nang`
3. Commit changes: `git commit -m 'feat: thêm tính năng X'`
4. Push to branch: `git push origin feature/ten-tinh-nang`
5. Tạo Pull Request

### Commit Convention
```
feat:     Tính năng mới
fix:      Sửa lỗi
docs:     Cập nhật tài liệu
style:    Thay đổi style (không ảnh hưởng logic)
refactor: Refactor code
test:     Thêm/sửa tests
chore:    Cập nhật build tools, dependencies
```

---

## 📄 License

MIT License — © 2024 Hà Quang Minh

---

<div align="center">

Made with ❤️ by the Hà Quang Minh

⭐ **Star repo nếu bạn thấy hữu ích!** ⭐

</div>
