# 입을래? Frontend

사용자 취향과 보유 아이템을 기반으로 MCM 제품, 구매 전 활용 가능성, 스마트 착용 플랜과 어울리는 장소를 제공하는 모바일 중심 서비스입니다.

프론트 API 계약은 `입을래_API_명세서_v0.4_최종`, 이후 FE 변경 명세와 현재 구현을 기준으로 합니다. 세부 요청·응답·인증·예외 처리 규칙은 [`API_CONVENTIONS.md`](./API_CONVENTIONS.md)를 따릅니다.

## 핵심 기능

- 취향 프로필 저장: 선호 색상·제품 카테고리·STYLE
- MCM 제품 탐색·조건별 Rule-Based 추천·찜·구매 후보 보관
- 보유 아이템 등록: 이미지 업로드, 선택적 AI 분석, 수동 수정
- 구매 전 활용 가능성: Backend 점수 계산과 AI/Rule-Based 설명
- 스마트 착용 추천: STYLE_PLAN 생성, 저장, 장소 추천 연결
- 제품 패스포트·구매 정보·맞춤 관리 가이드·관리 캘린더
- 저장한 장소·서비스 내부 관리 알림·마이페이지 계정 관리

## 기술 스택

| 기술 | 버전 | 선택 이유 |
| --- | --- | --- |
| Node.js | 22 | `.nvmrc`, `engines`, CI의 실행 버전을 통일합니다. |
| Next.js | 16 | App Router로 URL과 화면을 함께 관리하고 Vercel에서 `/api` 프록시를 구성합니다. |
| React | 19 | 화면을 재사용 가능한 컴포넌트와 상태 단위로 구성합니다. |
| TypeScript | strict | Endpoint별로 다른 ID 타입과 응답 구조를 컴파일 단계에서 검증합니다. |
| Tailwind CSS | 4 | 모바일 화면의 간격과 상태별 스타일을 컴포넌트 가까이에서 관리합니다. |
| Axios | 1 | Bearer Token, Refresh Cookie, 401 단일 재발급과 10초 타임아웃을 공통 적용합니다. |
| Zustand | 5 | Access Token 메모리 상태와 화면별 비동기 상태를 관리합니다. |
| MapLibre GL JS | 5 | OpenFreeMap 벡터 지도에 백엔드가 반환한 장소 좌표를 표시합니다. |
| Motion | 13 | 화면 전환, 로딩, 점수와 게이지 애니메이션을 재사용합니다. |
| React Icons | 5 | API 이미지가 없는 관리·알림·장소 상태를 일관된 아이콘으로 표현합니다. |

## 실행

필수 환경:

- Node.js `22.x`
- npm
- Backend 기본 주소 `http://localhost:8080`

```bash
nvm use
npm ci
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## 프론트 환경변수

`.env.example`을 `.env.local`로 복사합니다.

```env
NEXT_PUBLIC_API_BASE_URL=/api
BACKEND_API_ORIGIN=http://localhost:8080
```

| 변수 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | 브라우저가 호출할 API Prefix입니다. 운영·로컬 모두 `/api` 사용을 권장합니다. |
| `BACKEND_API_ORIGIN` | Next.js가 `/api/**`를 전달할 백엔드 Origin입니다. 끝에 `/api`를 붙이지 않습니다. |

`NEXT_PUBLIC_` 변수는 브라우저 번들에 노출됩니다. JWT Secret, OAuth Secret, Cloudinary Secret, Kakao REST Key, DB 비밀번호를 넣지 않습니다.

### Vercel 예시

```env
NEXT_PUBLIC_API_BASE_URL=/api
BACKEND_API_ORIGIN=https://api.example.com
```

Next.js rewrite 흐름:

```text
Browser https://frontend.vercel.app/api/products
→ Vercel Next.js rewrite
→ https://api.example.com/api/products
```

## 백엔드 CORS와 OAuth URL

백엔드 배포 변수 예시는 다음처럼 구분합니다.

```env
CORS_ALLOWED_ORIGIN=https://frontend.vercel.app
FRONTEND_OAUTH_SUCCESS_URL=https://frontend.vercel.app/oauth/success
FRONTEND_OAUTH_ONBOARDING_URL=https://frontend.vercel.app/oauth/onboarding
FRONTEND_REAUTHENTICATION_SUCCESS_URL=https://frontend.vercel.app/account/reauthentication/success
```

- `CORS_ALLOWED_ORIGIN`은 `scheme + host + 선택 port`만 있는 Origin입니다. 경로와 마지막 `/`를 넣지 않습니다.
- 팀에서 말하는 `FE URL`이 프론트 배포의 기본 주소라면 `CORS_ALLOWED_ORIGIN`과 값이 같습니다.
- `FRONTEND_OAUTH_*_URL`은 브라우저가 최종 도착할 전체 URL이므로 같은 Origin 뒤에 각각의 경로가 붙습니다.
- Vercel Preview URL, Production URL, Custom Domain을 함께 사용하면 백엔드가 실제 사용할 Origin을 각각 허용해야 합니다.
- JWT 관련 변수와 CORS/OAuth Redirect 변수는 백엔드 환경변수이며 프론트 `.env.local` 또는 Vercel의 `NEXT_PUBLIC_*`에 넣지 않습니다.

현재 프론트에는 세 Redirect 경로가 모두 구현되어 있습니다.

## 인증·저장 정책

| 데이터 | 저장 위치 | 원칙 |
| --- | --- | --- |
| Access Token | Zustand 메모리 | API 응답 Body로 받고 Bearer Header에만 사용합니다. |
| Refresh Token | Backend HttpOnly Cookie | JavaScript로 읽거나 저장하지 않습니다. |
| 공개 사용자 정보 | localStorage | 화면 표시용이며 인증·인가 판단에 사용하지 않습니다. |

- Axios는 모든 요청에 `withCredentials: true`를 사용합니다.
- Access Token 만료 시 `/auth/refresh`를 한 번만 실행하고 실패한 원 요청을 최대 한 번 재시도합니다.
- Refresh Token Cookie 이름은 `refresh_token`, Path는 `/api/auth`, 운영에서는 `Secure`입니다.
- 인증 관련 민감 POST는 Backend Trusted Origin 검증 대상입니다.
- 로그아웃은 `POST /auth/logout` 성공 여부와 무관하게 로컬 세션을 정리합니다.
- LOCAL 자격 증명이 있는 계정만 `PATCH /users/me/password`로 비밀번호를 변경하며 성공 후 로그인 상태를 유지합니다.
- 전역 알림·마케팅 설정은 `GET/PATCH /users/me/notification-settings`의 네 boolean 전체를 기준으로 동기화합니다.

### OAuth

```text
GET /auth/oauth/{provider}
→ Provider 인증
→ Backend callback
→ 기존 사용자: /oauth/success
→ 신규 사용자: /oauth/onboarding
```

- Access Token을 Redirect URL Query나 Fragment로 받지 않습니다.
- 기존 사용자는 `/oauth/success`에서 Refresh Cookie로 Access Token을 복구합니다.
- 신규 사용자는 `/oauth/onboarding`에서 약관, 닉네임, 성별, 선택 알림 이메일을 저장합니다.

### 회원 탈퇴

- LOCAL: `POST /auth/reauthentications`에 현재 비밀번호를 보냅니다.
- SOCIAL: `GET /auth/oauth/{provider}/reauthentication`으로 브라우저를 이동합니다.
- 재인증 성공 Redirect는 `/account/reauthentication/success`입니다.
- 재인증 Cookie 유효시간은 10분입니다.
- 최종 탈퇴는 `DELETE /users/me`, 성공은 `204 No Content`입니다.

## API v0.4 핵심 계약

- API Prefix는 `/api`이며 서비스 함수에는 `/products`처럼 Prefix 뒤 경로만 작성합니다.
- 성공 응답은 `{ success: true, data }`, 오류 응답은 `{ success: false, error }`입니다.
- `204 No Content` 응답에서 `response.data`를 기대하지 않습니다.
- 응답 ID는 대부분 문자열이지만 MyItem·StylePlan 쓰기 DTO의 일부 ID는 JSON number입니다.
- 페이지는 0부터 시작하며 기본 `size=20`, 최대 `100`입니다.
- 수정 충돌은 `version`과 `409 RESOURCE_VERSION_CONFLICT`로 처리합니다.

### 현재 사용 가능한 주요 경로

| 영역 | 경로 |
| --- | --- |
| 취향 | `GET/PUT /preferences` |
| 찜 | `GET /wishlists`, `PUT/DELETE /products/{id}/favorite` |
| 구매 후보 | `GET /cart-items`, `PUT/DELETE /products/{id}/cart` |
| 이미지 | `POST /image-assets`, `PUT /my-items/{itemId}/images/{imageAssetId}` |
| AI Job | `POST /ai-jobs`, `GET /ai-jobs/{jobId}` |
| 구매 활용성 | `PURCHASE_UTILITY` Job 후 `GET /purchase-utility-analyses/{analysisId}` |
| 사용자 설정 | `PATCH /users/me/password`, `GET/PATCH /users/me/notification-settings` |
| 장소 | `GET /places`, `GET /places/{placeId}`, StylePlan 장소 추천·저장 API |
| 홈 | `GET /home` |

STYLE_PLAN의 슬라이더 UI는 `casualFormalLevel`과 `neatGlamorousLevel`을 함께 1~10 정수로 보내며 `styleTags`는 빈 배열이 아니라 필드 자체를 생략합니다. AI Job은 2초 간격으로 조회하고 30초에 자동 조회를 종료합니다.

현재 호출하지 않는 경로:

```text
/preferences/me
/products/favorites
/image-uploads/signature
/image-uploads/complete
/images/{imageId}
/usage-records
/my-items/{id}/utilization
/reuse-recommendations
```

## 도메인 정책

### 태그

```text
STYLE: CASUAL, FORMAL, NEAT, GLAMOROUS
SEASON: SPRING, SUMMER, AUTUMN, WINTER, ALL_SEASON
OCCASION: DAILY, DATE, TRAVEL, GATHERING, CEREMONY, OUTDOOR, OTHER
FEATURE: COMPACT, SPACIOUS, MULTIWAY
```

ItemCategory:

```text
BAG, LEATHER_GOODS, FASHION_ACCESSORY, CLOTHING, SHOES
```

### MCM 제품 추천

제품 추천은 Backend Rule-Based입니다.

| 기준 | 최대 점수 |
| --- | ---: |
| STYLE | 30 |
| OCCASION | 25 |
| SEASON | 25 |
| FEATURE | 20 |

### 구매 전 활용 가능성

```text
POST /ai-jobs (type=PURCHASE_UTILITY)
→ PENDING/PROCESSING Polling
→ READY이면 analysisId 확보
→ GET /purchase-utility-analyses/{analysisId}
```

- 점수·호환 아이템·관리 난이도는 Backend Rule-Based입니다.
- 자연어 설명만 AI가 생성할 수 있으며 실패 시 Rule-Based 설명을 반환합니다.
- `INSUFFICIENT_DATA`는 오류가 아닌 정상 종료 상태입니다.

### AI Job Polling

Backend v0.4는 고정 Polling 시간을 API 계약으로 강제하지 않습니다. 현재 프론트 UX 정책은 다음과 같습니다.

| 항목 | 값 |
| --- | ---: |
| 조회 간격 | 2초 |
| 최대 자동 조회 | 30초 |
| 최대 조회 횟수 | 약 15회 |

- `SUCCEEDED`와 `FAILED`에서 즉시 종료합니다.
- 화면을 벗어나면 `AbortController`로 취소합니다.
- Job `FAILED` 조회도 HTTP 200일 수 있으므로 `data.status`로 판단합니다.

### 이미지 등록

```text
POST /image-assets (multipart file)
→ imageAssetId
→ ITEM_ANALYSIS Job 선택 실행
→ POST /my-items
→ PUT /my-items/{myItemId}/images/{imageAssetId}
```

- JPEG·PNG, 최대 10MB만 허용합니다.
- multipart `Content-Type`과 boundary는 브라우저/Axios가 설정합니다.
- UserItem ACTIVE 이미지는 최대 1장입니다.
- 이미지가 없거나 AI가 실패해도 수동 아이템 등록을 계속할 수 있습니다.

### 장소 추천

```text
Backend Kakao Local 후보 조회
→ Backend Rule-Based 점수 계산
→ Frontend가 latitude/longitude를 OpenFreeMap에 표시
```

프론트는 Kakao API Key와 Kakao SDK를 사용하지 않습니다.

## 주요 경로

| 경로 | 화면 |
| --- | --- |
| `/` | 커버 |
| `/login`, `/signup` | 일반·소셜 인증 시작 |
| `/oauth/success` | 기존 소셜 사용자 로그인 완료 |
| `/oauth/onboarding` | 신규 소셜 사용자 가입 완료 |
| `/dashboard` | 홈 Read Model |
| `/preferences` | 취향 저장 |
| `/recommendations`, `/recommendations/result` | 추천 조건·결과 |
| `/recommendations/[productId]` | 제품 상세 |
| `/recommendations/[productId]/value-check` | 구매 전 활용 가능성 |
| `/products`, `/products/[productId]` | 전체 MCM 제품·공식 제품 상세 |
| `/wishlist`, `/cart` | 찜한 제품·담은 제품 |
| `/items`, `/items/new`, `/items/analysis` | 내 아이템 목록·등록·AI 분석 |
| `/items/[itemId]`, `/items/[itemId]/edit` | 아이템 상세·수정 |
| `/items/[itemId]/passport` | 제품 패스포트 |
| `/smart-recommendations/*` | 스마트 착용 조건·생성·결과 |
| `/place`, `/place/[placeId]`, `/place/saved` | 장소 추천·상세·저장 목록 |
| `/care/guide`, `/care/storage`, `/care/calendar` | 관리 가이드·보관법·캘린더 |
| `/notifications` | 서비스 내부 관리 알림 |
| `/my` | 마이페이지·로그아웃 |
| `/my/settings` | 계정 설정 |
| `/my/settings/password` | 비밀번호 변경 |
| `/my/settings/notifications` | 알림·마케팅 설정 |
| `/my/settings/profile` | 프로필·저장된 취향 변경 |
| `/my/account-deletion` | 재인증·회원 탈퇴 |
| `/account/reauthentication/success` | 소셜 재인증 완료 |

## 폴더 구조

```text
src/
├─ app/                    # App Router 경로
├─ components/             # 도메인 화면과 공통 UI
├─ lib/                    # Axios와 공통 오류 처리
├─ services/
│  ├─ api/                 # 순수 Endpoint 호출
│  ├─ aiJobPolling.ts      # AI Job Polling
│  ├─ itemRegistrationWorkflow.ts
│  ├─ purchaseUtilityWorkflow.ts
│  └─ stylePlanWorkflow.ts # STYLE_PLAN 생성·Polling
├─ store/                  # Zustand 상태
└─ types/                  # API DTO와 화면 타입
```

API 모듈:

| 파일 | 담당 |
| --- | --- |
| `authApi.ts` | 인증·OAuth·재인증·로그아웃 |
| `profileApi.ts` | 사용자·취향·홈 |
| `catalogApi.ts` | 제품·추천·찜·구매 후보 |
| `closetApi.ts` | ImageAsset·MyItem·Passport·관리 |
| `intelligenceApi.ts` | AI Job·StylePlan·장소 |
| `utilityApi.ts` | 구매 활용성 결과 조회 |
| `notificationApi.ts` | 서비스 내부 알림 |

## 설계 가정

- 화면은 최대 폭 `390px`의 모바일 UI를 기준으로 하며 데스크톱에서는 휴대폰 프레임으로 표시합니다.
- Backend가 인증, 추천 점수, Kakao 장소 후보 조회, 데이터 트랜잭션을 책임집니다.
- Frontend는 Kakao SDK를 호출하지 않고 장소의 위도·경도만 받아 OpenFreeMap에 표시합니다.
- Access Token은 인증 판단용 메모리 상태이고, localStorage의 사용자 정보는 화면 표시용 캐시입니다.
- 구매 전 활용성 점수는 AI가 아닌 Backend Rule-Based 결과입니다. AI는 설명 생성에만 사용하며 실패 시 Rule-Based 설명을 허용합니다.
- 서비스 내부 알림은 현재 `CARE_REMINDER`만 지원하며 Web Push·FCM 알림은 MVP 범위가 아닙니다.
- `OTHER`·`UNKNOWN` 소재는 범용 관리 가이드를 표시할 수 있지만 정기 관리 일정은 없을 수 있습니다.

## 예외·엣지 케이스 처리

| 상황 | 프론트 처리 |
| --- | --- |
| 일반 API 지연 | Axios 요청을 10초에 종료하고 재시도 가능한 오류 상태를 표시합니다. |
| AI Job 지연 | 2초 간격으로 최대 30초 조회하고, 화면 이탈 시 요청과 타이머를 취소합니다. |
| Access Token 만료 | 동시 401 요청이 하나의 Refresh 요청을 공유하고 각 원 요청은 한 번만 재시도합니다. |
| Refresh 실패 | 메모리 Token과 저장된 사용자 캐시를 정리하고 로그인 흐름으로 보냅니다. |
| 외부 날씨·위치 API 실패 | 대시보드 전체를 막지 않고 위치 권한 또는 날씨 안내 문구로 대체합니다. |
| 이미지 업로드·AI 분석 실패 | 이미지 없이 수동 입력으로 아이템 등록을 계속할 수 있습니다. |
| 아이템 생성 후 이미지 연결 실패 | 생성된 아이템을 유지하고 `image-retry` 흐름에서 사진만 다시 연결합니다. |
| 중복 AI 요청 | `Idempotency-Key`를 사용하고 진행 중 구매 활용성 Job은 sessionStorage에 보존합니다. |
| 수정 경합 | `version`을 전송하고 `409 RESOURCE_VERSION_CONFLICT` 시 최신 데이터를 다시 받아야 합니다. |
| AI Job `FAILED` | 조회 HTTP 200과 Job 실패 상태를 구분하고 `error.code`를 화면 오류로 변환합니다. |
| 구매 활용 정보 부족 | `INSUFFICIENT_DATA`를 정상 결과로 처리하고 필요한 취향·아이템 정보 입력을 안내합니다. |
| 관리 일정 없음 | 구매일·소재 입력 여부를 안내하고 월 이동·빈 일정 상태를 표시합니다. |

Frontend는 DB 트랜잭션을 직접 제어하지 않습니다. Backend의 원자적 처리 결과와 `409`를 기준으로 경합을 복구하며, 이미지 업로드→아이템 생성→이미지 연결처럼 여러 API에 걸친 작업은 단계별 성공 상태를 보존합니다.

## 검증 명령어

```bash
npm run lint
npm run type-check
npm run build
```

## 현재 MVP 제외

- 착용·사용 기록 CRUD
- 사용 기록 기반 활용도 API
- 장기 미사용 아이템 재활용 추천 API
- 관리 완료 기록 CRUD
- 중고 거래·주문·결제·배송·재고
- Web Push·FCM
