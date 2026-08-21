# API Conventions v0.4

이 문서는 `입을래_API_명세서_v0.4_최종`, 이후 FE 변경 명세와 현재 프론트 구현을 기준으로 한 최종 연동 규칙입니다.

충돌 시 우선순위:

```text
Backend main Controller / Request·Response DTO / ErrorCode
→ Flyway Schema
→ Backend API_CONVENTIONS.md
→ Swagger/OpenAPI
→ v0.4 명세서
→ 이 프론트 문서
```

## Base URL

서비스 함수는 `/api`를 중복하지 않습니다.

```ts
api.get("/products");
```

권장 환경:

```env
NEXT_PUBLIC_API_BASE_URL=/api
BACKEND_API_ORIGIN=http://localhost:8080
```

Next.js가 `/api/:path*`를 `${BACKEND_API_ORIGIN}/api/:path*`로 전달합니다.

## Request 규칙

| 대상 | 규칙 | 예 |
| --- | --- | --- |
| Endpoint | 소문자 kebab-case | `/my-items` |
| JSON·Query | lowerCamelCase | `purchaseDate` |
| Enum | 대문자 SNAKE_CASE | `ALL_SEASON` |
| 날짜 | `YYYY-MM-DD` | `2026-08-19` |
| 시각 | UTC ISO 8601 | `2026-08-19T09:00:00Z` |

Axios 공통 설정:

- `withCredentials: true`
- 일반 요청 timeout 10초, AI Job 생성 timeout 20초
- Bearer Access Token 요청 인터셉터
- 401 발생 시 Refresh 단일 실행 후 원 요청 1회 재시도
- 반복 Query는 `category=A&category=B` 형태로 직렬화
- 화면 unmount·조건 변경 시 `AbortController`로 진행 중 조회와 Polling 취소

JSON 요청의 `Content-Type`은 Axios가 설정합니다. `FormData` 업로드는 `Content-Type`을 직접 지정하지 않아 boundary가 자동 설정되게 합니다.

## Response 규칙

성공:

```json
{
  "success": true,
  "data": {}
}
```

오류:

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "제품을 찾을 수 없습니다."
  }
}
```

Validation 오류는 `error.fields[]`에 `{ field, reason }`을 포함할 수 있습니다. 화면 분기는 `message`가 아니라 `code`로 처리합니다.

`204 No Content`는 Wrapper가 없습니다.

## HTTP 상태

| 상태 | 의미 |
| ---: | --- |
| 200 | 조회·수정·AI Job 조회 |
| 201 | 동기 리소스 생성 |
| 202 | 비동기 작업 접수 |
| 204 | 본문 없는 성공 |
| 302 | OAuth Redirect |
| 400 | Validation·잘못된 요청 |
| 401 | 인증 Token·자격증명 오류 |
| 403 | 권한·Origin·계정 상태 오류 |
| 404 | 리소스 없음 |
| 409 | Version·Idempotency·상태 충돌 |
| 413 | 이미지 크기 초과 |
| 415 | 이미지 형식 오류 |
| 429 | 요청 한도 초과 |
| 502·503·504 | 외부 Provider 장애·Timeout |

## ID 타입

응답 ID와 AI context ID는 문자열입니다.

```json
{
  "context": {
    "productId": "60",
    "imageAssetId": "12"
  }
}
```

다음 쓰기 DTO ID는 JSON number입니다.

- MyItem 생성·수정의 `productId`, `aiJobId`
- StylePlan 저장의 `aiJobId`, `ownedItems[].myItemId`, `recommendedProducts[].productId`

API 응답 문자열 ID를 쓰기 DTO에 넣을 때만 유효한 양의 정수로 변환합니다.

## Pagination

Request:

```text
?page=0&size=20&sort=createdAt,desc
```

Response data:

```json
{
  "items": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0,
  "hasNext": false,
  "hasPrevious": false
}
```

페이지는 0부터 시작하고 `size`는 1~100입니다.

## 인증

### Token

- Access Token: 응답 Body → Zustand 메모리 → `Authorization: Bearer`
- Refresh Token: Backend `refresh_token` HttpOnly Cookie
- Refresh Token을 JS에서 읽거나 localStorage에 저장하지 않음
- localStorage에는 화면 표시용 사용자 정보만 `auth-user`로 저장하며 인가 판단에 사용하지 않음
- Cookie가 필요한 요청은 credential 포함
- 동시 401은 하나의 Refresh Promise를 공유하고 각 원 요청은 최대 한 번만 재시도
- 로그인·회원가입·이메일 인증·OAuth 시작 요청의 401은 자동 Refresh 대상에서 제외

### OAuth

| 흐름 | Endpoint·Redirect |
| --- | --- |
| 시작 | `GET /auth/oauth/{provider}` |
| 기존 사용자 | Backend callback → `/oauth/success` → `/auth/refresh` |
| 신규 사용자 | Backend callback → `/oauth/onboarding` → `POST /auth/oauth/signup` |
| 소셜 재인증 | `GET /auth/oauth/{provider}/reauthentication` |

OAuth Access Token은 URL Query/Fragment로 전달하지 않습니다.

### 비밀번호 변경

```text
LOCAL 자격 증명 보유 계정 → PATCH /users/me/password
성공                    → 204 No Content, 기존 Access/Refresh Token 유지
소셜 전용 계정          → 409 PASSWORD_CHANGE_NOT_AVAILABLE
```

- Request는 `currentPassword`, `newPassword`, `newPasswordConfirm`을 모두 보냅니다.
- 새 비밀번호는 trim하지 않으며 영문·숫자를 포함한 8~64자입니다.
- 오류 문구가 아닌 `CURRENT_PASSWORD_MISMATCH`, `PASSWORD_CONFIRM_MISMATCH`, `NEW_PASSWORD_SAME_AS_CURRENT` code로 필드를 매핑합니다.

### 사용자 알림·마케팅 설정

- 조회: `GET /users/me/notification-settings`
- 저장: `PATCH /users/me/notification-settings`
- `careReminderEnabled`, `recommendationUpdateEnabled`, `marketingPushEnabled`, `emailMarketingEnabled` 네 필드는 PATCH에도 모두 필수입니다.
- 특정 아이템의 `/my-items/{myItemId}/care-reminder-setting`과 구분합니다.

Social signup Request:

```json
{
  "termsAgreements": [],
  "nickname": "입을래유저",
  "gender": "NOT_SPECIFIED",
  "notificationEmail": null
}
```

### 회원 탈퇴

```text
LOCAL  → POST /auth/reauthentications { password }
SOCIAL → GET /auth/oauth/{provider}/reauthentication
공통   → DELETE /users/me
```

- 재인증 Cookie 유효시간 10분
- 탈퇴 성공 `204 No Content`
- `DELETION_PENDING` 응답을 기대하지 않음

## Endpoint 목록

서비스 함수는 아래 경로에서 `/api`를 제외해 호출합니다.

| 영역 | Method | Path | 성공 |
| --- | --- | --- | ---: |
| Email | POST | `/auth/email-verifications` | 202 |
| Email | POST | `/auth/email-verifications/confirm` | 200 |
| Login ID | GET | `/auth/login-ids/{loginId}/availability` | 200 |
| Auth | POST | `/auth/signup` | 201 |
| Auth | POST | `/auth/login` | 200 |
| OAuth | GET | `/auth/oauth/{provider}` | 302 |
| OAuth | POST | `/auth/oauth/signup` | 201 |
| Reauth | POST | `/auth/reauthentications` | 204 |
| Reauth OAuth | GET | `/auth/oauth/{provider}/reauthentication` | 302 |
| Auth | POST | `/auth/refresh` | 200 |
| Auth | POST | `/auth/logout` | 204 |
| User | GET·PATCH·DELETE | `/users/me` | 200·204 |
| User | PATCH | `/users/me/password` | 204 |
| User Settings | GET·PATCH | `/users/me/notification-settings` | 200 |
| Preference | GET·PUT | `/preferences` | 200 |
| Product | GET | `/products`, `/products/{productId}` | 200 |
| Wishlist | GET | `/wishlists` | 200 |
| Favorite | PUT·DELETE | `/products/{productId}/favorite` | 204 |
| Cart | GET | `/cart-items` | 200 |
| Cart | PUT·DELETE | `/products/{productId}/cart` | 204 |
| Recommendation | POST | `/recommendations` | 201 |
| Recommendation | GET | `/recommendations/{recommendationId}` | 200 |
| ImageAsset | POST | `/image-assets` | 201 |
| ImageAsset | DELETE | `/image-assets/{imageAssetId}` | 204 |
| MyItem | GET·POST | `/my-items` | 200·201 |
| MyItem | GET·PATCH·DELETE | `/my-items/{myItemId}` | 200·204 |
| MyItem Image | PUT·DELETE | `/my-items/{myItemId}/images/{imageAssetId}` | 200·204 |
| Passport | GET | `/my-items/{myItemId}/passport` | 200 |
| Care | GET | `/my-items/{myItemId}/care-guide` | 200 |
| Care | GET | `/my-items/{myItemId}/storage-guide` | 200 |
| Care | GET | `/my-items/{myItemId}/care-calendar` | 200 |
| Care Reminder | GET·PUT | `/my-items/{myItemId}/care-reminder-setting` | 200 |
| Notification | GET | `/notifications` | 200 |
| Notification | PATCH | `/notifications/{notificationId}` | 200 |
| AI Job | POST | `/ai-jobs` | 202 또는 200 |
| AI Job | GET | `/ai-jobs/{jobId}` | 200 |
| Purchase Utility | GET | `/purchase-utility-analyses/{analysisId}` | 200 |
| StylePlan | POST·GET | `/style-plans` | 201·200 |
| StylePlan | GET·PATCH·DELETE | `/style-plans/{stylePlanId}` | 200·204 |
| Place | GET | `/places`, `/places/{placeId}`, `/places/saved` | 200 |
| Saved Place | PUT·DELETE | `/places/{placeId}/saved` | 200·204 |
| Place Recommendation | POST | `/style-plans/{stylePlanId}/place-recommendations` | 200 |
| Home | GET | `/home` | 200 |

## Enum

```text
ItemCategory: BAG, LEATHER_GOODS, FASHION_ACCESSORY, CLOTHING, SHOES

STYLE: CASUAL, FORMAL, NEAT, GLAMOROUS
SEASON: SPRING, SUMMER, AUTUMN, WINTER, ALL_SEASON
OCCASION: DAILY, DATE, TRAVEL, GATHERING, CEREMONY, OUTDOOR, OTHER
FEATURE: COMPACT, SPACIOUS, MULTIWAY

AiJobType: ITEM_ANALYSIS, PURCHASE_UTILITY, STYLE_PLAN
AiJobStatus: PENDING, PROCESSING, SUCCEEDED, FAILED
TermsType: SERVICE_TERMS, PRIVACY_POLICY, EMAIL_MARKETING, PUSH_MARKETING
```

STYLE_PLAN 슬라이더 context:

```text
occasion: 필수
casualFormalLevel: 1~10 정수
neatGlamorousLevel: 1~10 정수
prioritizeOwnedItems: 필수
language: ko
```

두 스타일 강도는 항상 함께 보내며 슬라이더 방식에서는 `styleTags`를 생략합니다. `styleTags: []`는 보내지 않습니다. `POST /ai-jobs`의 `Idempotency-Key`와 2초 간격·최대 30초 Polling 정책은 그대로 유지합니다.

추천 조건 Request:

```text
occasion: DAILY | DATE | TRAVEL | GATHERING | CEREMONY | OUTDOOR | OTHER
season: SPRING | SUMMER | AUTUMN | WINTER
preferredFeatures: COMPACT | SPACIOUS | MULTIWAY 중 1개 이상
category: 선택
```

저장된 `preferredStyleTags`는 Backend가 취향 프로필에서 가져오며 추천 요청마다 다시 보내지 않습니다.

## 제품·홈 응답 주의

- 제품 목록에는 `inCart`가 없음
- 제품 상세에만 `inCart`가 있음
- 제품 상세에 `isSample`이 없음
- Product tags 키는 `styles`, `seasons`, `occasions`, `features`
- Home 제품 배열은 `recommendedProducts`, 점수는 `matchScore`
- `GET /home`은 AI Job이나 Kakao 검색을 새로 실행하지 않음
- 대시보드 MCM 제품 목록은 `GET /home`의 `recommendedProducts`를 사용

## 이미지·MyItem

이미지 흐름:

```text
POST /image-assets
→ imageAssetId
→ 선택적으로 ITEM_ANALYSIS
→ POST /my-items
→ PUT /my-items/{myItemId}/images/{imageAssetId}
```

- multipart part 이름 `file`
- JPEG·PNG
- 최대 10MB
- 업로드 직후 TEMPORARY
- UserItem ACTIVE 이미지 최대 1장
- 이미지 또는 AI 실패 시 수동 등록 허용
- 이미지 교체는 새 `imageAssetId` 업로드 후 연결하고, 기존 연결은 UserItem 이미지 DELETE로 제거
- 아이템 생성 성공 후 이미지 연결 실패 시 아이템을 삭제하지 않고 재업로드 정보만 별도로 보존

## AI Job

Create에는 `Idempotency-Key`가 필수입니다.

```text
PENDING → PROCESSING → SUCCEEDED
                     ↘ FAILED
```

- `FAILED` 조회도 HTTP 200일 수 있음
- 생성 응답에 `cached` 필드 없음
- Job error는 `code`, `message`만 사용
- 현재 프론트 자동 Polling은 2초 간격·최대 30초이며 약 15회 조회
- 이 시간은 Backend 고정 계약이 아니라 프론트 UX 정책
- 화면 unmount 시 대기 Timer와 진행 중 GET 요청을 모두 취소
- 네트워크 실패와 HTTP 200의 Job `FAILED`를 서로 다른 오류로 처리

ITEM_ANALYSIS context:

```json
{
  "type": "ITEM_ANALYSIS",
  "context": { "imageAssetId": "12" }
}
```

PURCHASE_UTILITY context:

```json
{
  "type": "PURCHASE_UTILITY",
  "context": { "productId": "60" }
}
```

구매 활용성 점수는 Backend Rule-Based이며 AI는 자연어 설명에만 사용될 수 있습니다. Job 결과가 `READY`일 때만 `analysisId`로 상세를 조회합니다. `INSUFFICIENT_DATA`는 정상 결과입니다.

구매 활용성 점수 최대값:

```text
preferenceTagFitScore: 30
styleCombinationScore: 25
seasonUsabilityScore: 25
ownedCategoryCombinationScore: 20
utilityScore: 100
```

## 관리·알림

- 관리 가이드: 소재가 있으면 이용 가능
- 관리 캘린더: `GET /my-items/{myItemId}/care-calendar?month=YYYY-MM`
- 구매일은 `GET /my-items/{myItemId}`의 `purchaseDate`로 달력에 함께 표시
- `material` 또는 `purchaseDate`가 부족하면 캘린더가 `available=false`를 반환할 수 있음
- 아이템별 알림 설정은 `GET/PUT /my-items/{myItemId}/care-reminder-setting`
- 재활성화 시 과거 일정을 소급 생성하지 않고 `enabledAt` 이후 일정부터 생성
- 서비스 알림 목록은 `GET /notifications?page=0&size=20&sort=createdAt,desc`
- 현재 실제 알림 Type은 `CARE_REMINDER`이며 `PATCH /notifications/{notificationId}` Body는 `{ "read": true }`

## Optimistic Lock과 Partial Write

- Preference 최초 저장 `version=0`, 수정은 최신 version 전달
- MyItem·StylePlan PATCH는 최신 version 전달
- `409 RESOURCE_VERSION_CONFLICT` 시 최신 데이터를 다시 조회
- 이미지 업로드와 MyItem 생성은 별도 단계이므로 MyItem 성공 후 이미지 연결 실패를 별도 상태로 보존
- AI Job 재시도는 같은 논리 요청에서 동일한 `Idempotency-Key`를 재사용
- 같은 Key와 다른 Request는 `409 IDEMPOTENCY_KEY_CONFLICT`로 처리
- 구매 활용성 진행 Job의 `jobId`와 Key는 productId별 sessionStorage에 보존하고 terminal 상태에서 제거
- 늦게 도착한 목록 응답이 최신 필터 결과를 덮지 않도록 이전 요청을 취소하고 요청 sequence를 비교

## 오류·Fallback

| 상황 | 처리 |
| --- | --- |
| `400` Validation | `error.fields`를 입력 필드에 연결 |
| `401` Access Token 만료 | Refresh 단일 실행 후 원 요청 1회 재시도 |
| Refresh `401` | 세션 정리 후 로그인 이동 |
| `409 RESOURCE_VERSION_CONFLICT` | 최신 리소스 재조회 후 사용자 재시도 |
| `409 IDEMPOTENCY_KEY_CONFLICT` | 새 논리 요청인지 확인 후 새 Key 생성 |
| `413`·`415` 이미지 오류 | 파일 크기·형식 안내 후 수동 등록 허용 |
| `429` AI 요청 제한 | 자동 반복 요청을 중단하고 재시도 안내 |
| `502`·`503`·`504` | Provider/Backend 장애로 분리해 재시도 안내 |
| Job `FAILED` | HTTP 상태와 별개로 `data.status`와 `data.error.code` 확인 |
| `INSUFFICIENT_DATA` | 오류 화면이 아니라 필요한 데이터 입력 안내 |

## 호출 금지

```text
GET·PUT /preferences/me
GET /products/favorites
POST /image-uploads/signature
POST /image-uploads/complete
DELETE /images/{imageId}
GET·POST·PATCH·DELETE /usage-records
GET /my-items/{myItemId}/usage-records
GET /my-items/{myItemId}/utilization
GET /reuse-recommendations
GET /my-items?view=LOW_USAGE
```

지원하지 않는 AI Type:

```text
PREFERENCE_ANALYSIS
DORMANT_ITEM_REUSE
PRODUCT_RECOMMENDATION
PLACE_RECOMMENDATION
```

## CORS·Trusted Origin

```text
CORS_ALLOWED_ORIGIN=https://frontend.vercel.app
```

- Origin은 `scheme://host[:port]`이며 경로를 포함하지 않음
- FE 기본 URL과 보통 같은 값
- OAuth Redirect 변수는 같은 Origin에 화면 경로를 붙인 전체 URL
- Preview·Production·Custom Domain이 다르면 실제 사용 Origin을 모두 Backend 정책에 반영
- JWT Secret과 Provider Secret은 Backend에만 저장
