export type ApiFieldError = {
  field: string;
  reason: string;
};

export type ApiErrorDetail = {
  code: string;
  message: string;
  fields?: ApiFieldError[];
};

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  error: ApiErrorDetail;
};

export type ApiPage<T> = {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type PageQuery = {
  page?: number;
  size?: number;
  sort?: string | string[];
};

export type Gender = "MALE" | "FEMALE" | "NOT_SPECIFIED";
export type TermsType =
  | "SERVICE_TERMS"
  | "PRIVACY_POLICY"
  | "EMAIL_MARKETING"
  | "PUSH_MARKETING";
export type OAuthProvider = "kakao" | "naver";
export type AuthenticationMethod = "LOCAL" | "KAKAO" | "NAVER";

export type SessionUser = {
  userId: string;
  email?: string | null;
  nickname?: string | null;
  gender?: Gender | null;
  profileImageUrl?: string | null;
};

export type AuthTokenData = {
  accessToken: string;
  tokenType: "Bearer";
  expiresInSeconds: number;
  user?: SessionUser;
};

export type LoginRequest = {
  loginId: string;
  password: string;
};

export type PasswordChangeRequest = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};

export type PasswordChangeErrorCode =
  | "CURRENT_PASSWORD_MISMATCH"
  | "PASSWORD_CONFIRM_MISMATCH"
  | "NEW_PASSWORD_SAME_AS_CURRENT"
  | "PASSWORD_CHANGE_NOT_AVAILABLE";

export type TermsAgreement = {
  termsType: TermsType;
  termsVersion: string;
  agreed: boolean;
};

export type SignupRequest = {
  signupToken: string;
  loginId: string;
  password: string;
  passwordConfirm: string;
  termsAgreements: TermsAgreement[];
  nickname: string;
  gender: Gender;
};

export type SocialSignupRequest = {
  termsAgreements: TermsAgreement[];
  nickname: string;
  gender: Gender;
  notificationEmail: string | null;
};

export type EmailVerificationPurpose =
  | "SIGNUP"
  | "NOTIFICATION_EMAIL";

export type UserProfile = {
  userId: string;
  nickname: string;
  gender: Gender;
  authenticationMethods: AuthenticationMethod[];
};

export type UserNotificationSettings = {
  careReminderEnabled: boolean;
  recommendationUpdateEnabled: boolean;
  marketingPushEnabled: boolean;
  emailMarketingEnabled: boolean;
};

export const itemCategories = [
  "BAG",
  "LEATHER_GOODS",
  "FASHION_ACCESSORY",
  "CLOTHING",
  "SHOES",
] as const;
export type ItemCategory = (typeof itemCategories)[number];

export const colorGroups = [
  "BLACK",
  "WHITE",
  "GRAY",
  "BROWN",
  "BEIGE",
  "RED",
  "ORANGE",
  "YELLOW",
  "GREEN",
  "BLUE",
  "PURPLE",
  "PINK",
  "METALLIC",
  "MULTI",
  "OTHER",
] as const;
export type ColorGroup = (typeof colorGroups)[number];

export const materialGroups = [
  "LEATHER",
  "SYNTHETIC_LEATHER",
  "CANVAS",
  "FABRIC",
  "NYLON",
  "METAL",
  "OTHER",
  "UNKNOWN",
] as const;
export type MaterialGroup = (typeof materialGroups)[number];
export type MaterialSource =
  | "PRODUCT_DATA"
  | "USER_CONFIRMED"
  | "AI_ESTIMATED";

export const styleTags = ["CASUAL", "FORMAL", "NEAT", "GLAMOROUS"] as const;
export type StyleTag = (typeof styleTags)[number];

export const seasonTags = [
  "SPRING",
  "SUMMER",
  "AUTUMN",
  "WINTER",
  "ALL_SEASON",
] as const;
export type SeasonTag = (typeof seasonTags)[number];

export const occasionTags = [
  "DAILY",
  "DATE",
  "TRAVEL",
  "GATHERING",
  "CEREMONY",
  "OUTDOOR",
  "OTHER",
] as const;
export type OccasionTag = (typeof occasionTags)[number];

export const featureTags = ["COMPACT", "SPACIOUS", "MULTIWAY"] as const;
export type FeatureTag = (typeof featureTags)[number];
export type CurrentSeasonTag = Exclude<SeasonTag, "ALL_SEASON">;

export const productTagLabels = {
  style: {
    CASUAL: "캐주얼",
    FORMAL: "포멀",
    NEAT: "깔끔한",
    GLAMOROUS: "화려한",
  },
  season: {
    SPRING: "봄",
    SUMMER: "여름",
    AUTUMN: "가을",
    WINTER: "겨울",
    ALL_SEASON: "사계절",
  },
  occasion: {
    DAILY: "데일리",
    DATE: "데이트",
    TRAVEL: "여행",
    GATHERING: "모임",
    CEREMONY: "격식 있는 자리",
    OUTDOOR: "야외 활동",
    OTHER: "기타",
  },
  feature: {
    COMPACT: "컴팩트",
    SPACIOUS: "넉넉한 수납",
    MULTIWAY: "멀티웨이",
  },
} as const satisfies {
  style: Record<StyleTag, string>;
  season: Record<SeasonTag, string>;
  occasion: Record<OccasionTag, string>;
  feature: Record<FeatureTag, string>;
};

export type PreferenceProfile = {
  completed: boolean;
  preferredColors: ColorGroup[];
  preferredCategories: ItemCategory[];
  preferredStyleTags: StyleTag[];
  summary: string | null;
  confidence: number | null;
  analysisVersion: string | null;
  analyzedAt: string | null;
  version: number;
};

export type ProductTags = {
  styles: StyleTag[];
  seasons: SeasonTag[];
  occasions: OccasionTag[];
  features: FeatureTag[];
};

export type ProductSummary = {
  productId: string;
  brand: "MCM";
  name: string;
  category: ItemCategory;
  price: number;
  primaryColor: ColorGroup;
  primaryImageUrl: string | null;
  favorited: boolean;
};

export type ProductDetail = Omit<ProductSummary, "primaryImageUrl"> & {
  primaryImageUrl?: string | null;
  sku: string;
  description: string | null;
  material: MaterialGroup;
  productUrl: string | null;
  images: Array<{
    url: string;
    altText: string | null;
    sortOrder: number;
    isPrimary: boolean;
  }>;
  tags: ProductTags;
  inCart: boolean;
};

export const productRecommendationScoreWeights = {
  style: 30,
  occasion: 25,
  season: 25,
  feature: 20,
} as const;

export type ProductRecommendationScore = {
  style: number;
  occasion: number;
  season: number;
  feature: number;
};

export type RecommendationProduct = {
  productId: string;
  name: string;
  category: ItemCategory;
  price: number;
  primaryColor: ColorGroup;
  primaryImageUrl: string | null;
  tags: ProductTags;
  score: number;
  scoreBreakdown: ProductRecommendationScore;
  reason: string;
  favorited: boolean;
};

export type Recommendation = {
  recommendationId: string;
  generationType: "RULE_BASED";
  scorePolicyVersion: string;
  summary: string;
  products: RecommendationProduct[];
  generatedAt: string;
};

export type CartItem = {
  cartItemId: string;
  productId: string;
  brand: "MCM";
  name: string;
  price: number;
  primaryImageUrl: string | null;
  productUrl: string | null;
  addedAt: string;
};

export type MyItemSummary = {
  myItemId: string;
  name: string;
  brandName: string | null;
  category: ItemCategory;
  primaryColor: ColorGroup | null;
  material: MaterialGroup | null;
  primaryImageUrl: string | null;
  createdAt: string;
};

export type MyItemImage = {
  imageId: string;
  url: string;
  sortOrder: number;
};

export type MyItemDetail = Omit<MyItemSummary, "primaryImageUrl"> & {
  linkedProductId: string | null;
  materialSource: MaterialSource | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  purchaseOrderNumber: string | null;
  purchasePlace: string | null;
  memo: string | null;
  nextCareDate: string | null;
  aiJobId: string | null;
  images: MyItemImage[];
  version: number;
  updatedAt: string;
};

export type ImageAsset = {
  imageAssetId: string;
  imageUrl: string;
};

export type AiJobType = "ITEM_ANALYSIS" | "PURCHASE_UTILITY" | "STYLE_PLAN";
export type AiJobStatus = "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED";

export type StylePlanWeatherCondition =
  | "SUNNY"
  | "CLOUDY"
  | "RAINY"
  | "SNOWY"
  | "HOT"
  | "COLD"
  | "WINDY"
  | "INDOOR"
  | "OTHER";

export type StylePlanSliderContext = {
  occasion: OccasionTag;
  casualFormalLevel: number;
  neatGlamorousLevel: number;
  weatherCondition?: StylePlanWeatherCondition;
  prioritizeOwnedItems: boolean;
  language: "ko";
};

type AiJobIdentity = {
  jobId: string;
  type: AiJobType;
  createdAt: string;
};

export type AiJobAccepted = AiJobIdentity & {
  status: AiJobStatus;
};

export type AiJob = AiJobIdentity & {
  status: AiJobStatus;
  result: unknown | null;
  fallback: unknown | null;
  error: Pick<ApiErrorDetail, "code" | "message"> | null;
  completedAt: string | null;
};

export type ItemAnalysisResult = {
  brandName: string | null;
  name: string | null;
  category: ItemCategory | null;
  primaryColor: ColorGroup | null;
  material: MaterialGroup | null;
};

export type PurchaseUtilityJobResult =
  | { status: "READY"; analysisId: string }
  | {
      status: "INSUFFICIENT_DATA";
      analysisId: null;
      message: string;
    };

export type PurchaseUtilityAnalysis = {
  analysisId: string;
  scorePolicyVersion: string;
  product: Pick<
    ProductSummary,
    "productId" | "name" | "category" | "price" | "primaryImageUrl"
  >;
  utilityScore: number;
  factors: {
    preferenceTagFitScore: number;
    styleCombinationScore: number;
    seasonUsabilityScore: number;
    ownedCategoryCombinationScore: number;
  };
  compatibleItemCount: number;
  compatibleItems: Array<{
    myItemId: string;
    name: string;
    imageUrl: string | null;
    reason: string;
  }>;
  careDifficulty: "EASY" | "MODERATE" | "HARD" | "UNKNOWN";
  summary: string;
  explanationGenerationType: "AI" | "RULE_BASED";
  analyzedAt: string;
};

export type PlaceCategory =
  | "CAFE"
  | "RESTAURANT"
  | "CULTURE"
  | "ATTRACTION"
  | "SHOPPING"
  | "OTHER";

export type ApiPlace = {
  placeId: string;
  name: string;
  category: PlaceCategory;
  categoryName: string;
  address: string | null;
  roadAddress: string | null;
  latitude: number;
  longitude: number;
  placeUrl: string | null;
  saved: boolean;
};

export type ApiPlaceRecommendation = {
  rank: number;
  score: number;
  scoreBreakdown: {
    categorySuitability: number;
    distance: number;
  };
  reasonCode: string;
  place: ApiPlace;
};

export type ProductPassport = {
  myItemId: string;
  productInfo: {
    linkedProductId: string | null;
    brandName: string | null;
    name: string;
    category: ItemCategory;
    primaryColor: ColorGroup | null;
    material: MaterialGroup | null;
    imageUrl: string | null;
    sku: string | null;
    productUrl: string | null;
  };
  purchaseInfo: {
    purchaseOrderNumber: string | null;
    purchaseDate: string | null;
    purchasePrice: number | null;
    purchasePlace: string | null;
  };
};

export type CareGuide = {
  myItemId: string;
  available: boolean;
  material?: MaterialGroup | null;
  [key: string]: unknown;
};

export type StorageGuide = {
  myItemId: string;
  available: boolean;
  material?: MaterialGroup | null;
  [key: string]: unknown;
};

export type CareCalendar = {
  myItemId: string;
  month: string;
  available: boolean;
  [key: string]: unknown;
};

export type CareReminderSetting = {
  myItemId: string;
  enabled: boolean;
  enabledAt: string | null;
};

export type ServiceNotification = {
  notificationId: string;
  type: "CARE_REMINDER";
  title: string;
  message: string;
  myItemId: string;
  itemName: string;
  imageUrl: string | null;
  scheduledDate: string;
  routineTypes: string[];
  read: boolean;
  createdAt: string;
};

export type StylePlanSummary = {
  stylePlanId: string;
  title: string;
  occasion: OccasionTag;
  plannedAt: string | null;
  status: "DRAFT" | "CONFIRMED" | "COMPLETED" | "CANCELED";
  thumbnailImageUrl: string | null;
  ownedItemCount: number;
  recommendedProductCount: number;
  createdAt: string;
};

export type HomeData = {
  user: {
    nickname: string;
    preferenceCompleted: boolean;
    myItemCount: number;
  };
  latestStylePlan: Pick<
    StylePlanSummary,
    "stylePlanId" | "title" | "thumbnailImageUrl"
  > | null;
  recommendedProducts: Array<{
    productId: string;
    name: string;
    matchScore: number;
    primaryImageUrl: string | null;
  }>;
};
