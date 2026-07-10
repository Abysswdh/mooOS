// =============================================================================
// MooOS v2 — Shared TypeScript Types
// =============================================================================
// These types mirror Axel's Pydantic schemas (backend/app/schemas/).
// ANY change here MUST be synced with the backend schemas.
// Last synced: 2026-07-10 — final sync after 5-mismatch fix
// =============================================================================

// ---------------------------------------------------------------------------
// Enums (frontend convenience — backend uses loose strings)
// ---------------------------------------------------------------------------

export type CowStatus =
  | 'AVAILABLE'
  | 'SICK'
  | 'DEAD'
  | 'SOLD'
  | 'LOOKING_FOR_CARETAKER';

export type CowGender = 'MALE' | 'FEMALE';

export type CowType = 'DAIRY' | 'BEEF';

export type OfferStatus = 'OPEN' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export type OfferType = 'PAKAN' | 'SUSU' | 'PUPUK';

export type ChecklistPriority = 'HIGH' | 'MEDIUM' | 'INFO';

// Backend enum values (models/checklist.py ChecklistActionType)
export type ChecklistActionType =
  | 'NAVIGATE'
  | 'CREATE_PO'
  | 'CREATE_OFFER'
  | 'SEND_REMINDER'
  | 'OPEN_MODAL';

export type NotificationType =
  | 'MILK_REPORT'
  | 'FEED_REPORT'
  | 'SICK_COW'
  | 'DEAD_COW'
  | 'OFFER_ACCEPTED'
  | 'OFFER_REJECTED'
  | 'TASK_COMPLETED'
  | 'SYSTEM';

export type MarketPriceItemType = 'PAKAN' | 'SUSU' | 'PUPUK';

export type MarketPriceSource = 'ADMIN' | 'AUTO' | 'TELEGRAM';

export type UserRole = 'ADMIN' | 'PJ_KANDANG' | 'SUPPLIER' | 'BUYER';

export type WasteBatchStatus = 'COLLECTING' | 'FERMENTING' | 'READY' | 'SOLD';

export type HealthEventType = 'SICK' | 'RECOVERED' | 'TREATMENT' | 'DEAD' | 'CHECKUP';

// ---------------------------------------------------------------------------
// Entities — synced with Axel's Pydantic Response schemas
// ---------------------------------------------------------------------------

/** Admin user (web dashboard) — backend/app/schemas/user.py → UserResponse */
export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Anggota koperasi — backend/app/schemas/member.py → MemberResponse */
export interface Member {
  id: number;
  nik: string;
  name: string;
  phone: string | null;
  address: string | null;
  simpanan_pokok: number;
  simpanan_wajib: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Kandang — backend/app/schemas/barn.py → BarnResponse */
export interface Barn {
  id: number;
  name: string;
  location: string | null;
  capacity: number;
  caretaker_name: string | null;
  created_at: string;
}

/** Sapi — backend/app/schemas/cow.py → CowResponse */
export interface Cow {
  id: number;
  code: string;
  name: string | null;
  breed: string | null;
  gender: string;
  cow_type: string;
  weight_kg: number;
  birth_date: string | null;
  photo_url: string | null;
  status: string;
  owner_id: number | null;
  barn_id: number | null;
  created_at: string;
  updated_at: string;
}

/** Milk production record — backend/app/schemas/milk.py → MilkRecordResponse */
export interface MilkRecord {
  id: number;
  cow_id: number;
  date: string;
  liters: number;
  recorded_by: string | null;
  created_at: string;
}

/** Milk summary (aggregated) — backend/app/schemas/milk.py → MilkSummaryResponse */
export interface MilkSummary {
  today_total_liters: number;
  yesterday_total_liters: number;
  week_total_liters: number;
  month_total_liters: number;
  active_dairy_cows: number;
}

/** Milk offer — backend/app/schemas/milk.py → MilkOfferResponse */
export interface MilkOffer {
  id: number;
  quantity_liters: number;
  price_per_liter: number;
  total_price: number;
  min_order_liters: number;
  status: string;
  accepted_by: string | null;
  accepted_quantity: number | null;
  notes: string | null;
  expires_at: string | null;
  created_at: string;
  confirmed_at: string | null;
}

/** Cow health event log — backend/app/schemas/health_log.py → HealthLogResponse */
export interface HealthLog {
  id: number;
  cow_id: number;
  event_type: string;          // SICK, RECOVERED, TREATMENT, DEAD, CHECKUP
  description: string | null;
  reported_by: string | null;
  created_at: string;
}

/** Feed stock — backend/app/schemas/feed.py → FeedStockResponse */
export interface FeedStock {
  current_stock_kg: number;
  daily_consumption_kg: number;
  days_remaining: number;
  is_critical: boolean;
}

/** Feed purchase order — backend/app/schemas/feed.py → FeedOrderResponse */
export interface FeedOrder {
  id: number;
  po_number: string;
  quantity_kg: number;
  feed_type: string;
  max_price_per_kg: number;
  total_max_price: number;
  status: string;
  accepted_by: string | null;
  accepted_price_per_kg: number | null;
  notes: string | null;
  expires_at: string | null;
  created_at: string;
  confirmed_at: string | null;
}

/** Feed stock movement — backend/app/schemas/feed.py → FeedStockMovementResponse */
export interface FeedStockMovement {
  id: number;
  date: string;
  change_kg: number;
  reason: string;
  created_at: string;
}

/** Waste/fertilizer batch — backend/app/schemas/waste.py → WasteBatchResponse */
export interface WasteBatch {
  id: number;
  barn_id: number;
  batch_code: string;
  raw_waste_kg: number;
  estimated_fertilizer_kg: number;
  status: string;
  fermentation_start: string | null;
  fermentation_end: string | null;
  created_at: string;
}

/** Waste summary — backend/app/schemas/waste.py → WasteSummaryResponse */
export interface WasteSummary {
  total_raw_waste_kg: number;
  total_fertilizer_ready_kg: number;
  batches_fermenting: number;
  batches_ready: number;
}

/** Fertilizer offer — backend/app/schemas/waste.py → FertilizerOfferResponse */
export interface FertilizerOffer {
  id: number;
  quantity_kg: number;
  price_per_kg: number;
  total_price: number;
  status: string;
  accepted_by: string | null;
  notes: string | null;
  expires_at: string | null;
  created_at: string;
  confirmed_at: string | null;
}

/** Daily market price — backend/app/schemas/market_price.py → MarketPriceResponse */
export interface MarketPrice {
  id: number;
  date: string;
  item_type: string;
  price_per_unit: number;
  unit: string;
  source: string;
  created_at: string;
}

/** Today's prices summary for dashboard modal — TodayPricesSummary */
export interface TodayPricesSummary {
  date: string;
  pakan: MarketPrice | null;
  susu: MarketPrice | null;
  pupuk: MarketPrice | null;
  is_auto_generated: boolean;
}

/** Attendance log — backend/app/schemas/attendance.py → AttendanceLogResponse */
export interface AttendanceLog {
  id: number;
  user_id: number;
  clock_in: string;
  clock_out: string | null;
  daily_summary: string | null;
  created_at: string;
}

/** Attendance clock-in response (subset) */
export interface AttendanceClockIn {
  id: number;
  user_id: number;
  clock_in: string;
}

/** Notification — backend/app/schemas/notification.py → NotificationResponse */
export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
}

/** MRP-generated checklist task — backend/app/schemas/checklist.py → ChecklistTaskResponse */
export interface ChecklistTask {
  id: number;
  date: string;
  priority: string;
  title: string;
  description: string | null;
  action_type: string;
  action_payload: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// API Response Wrappers — synced with Axel's ListResponse patterns
// ---------------------------------------------------------------------------

/** Generic list response (Axel's pattern: { items, total }) */
export interface ListResponse<T> {
  items: T[];
  total: number;
}

/** Dashboard summary — backend/app/schemas/dashboard.py → DashboardSummary */
export interface DashboardSummary {
  total_cows: number;
  active_cows: number;
  sick_cows: number;
  total_members: number;
  today_milk_liters: number;
  feed_stock_kg: number;
  feed_days_remaining: number;
  feed_is_critical: boolean;
  fertilizer_ready_kg: number;
  today_revenue: number;
  month_revenue: number;
}

/** Checklist response wrapper */
export interface ChecklistResponse {
  tasks: ChecklistTask[];
  total: number;
  completed_count: number;
}

/** Notification list response */
export interface NotificationListResponse {
  items: Notification[];
  total: number;
  unread_count: number;
}

/** Auth token response — backend/app/schemas/auth.py → TokenResponse */
export interface TokenResponse {
  access_token: string;
  token_type: string;
}

/** Health check — backend/app/schemas/dashboard.py → HealthCheckResponse */
export interface HealthCheckResponse {
  status: string;
  database: string;
  version: string;
}

// ---------------------------------------------------------------------------
// Request Inputs — synced with Axel's Create/Update schemas
// ---------------------------------------------------------------------------

/** POST /auth/login */
export interface LoginInput {
  email: string;
  password: string;
}

/** POST /cows — backend/app/schemas/cow.py → CowCreate */
export interface CowCreateInput {
  code: string;
  name?: string | null;
  breed?: string | null;
  gender?: string;
  cow_type?: string;
  weight_kg?: number;
  birth_date?: string | null;
  owner_id?: number | null;
  barn_id?: number | null;
}

/** PUT /cows/:id — backend/app/schemas/cow.py → CowUpdate */
export interface CowUpdateInput {
  name?: string | null;
  breed?: string | null;
  gender?: string | null;
  cow_type?: string | null;
  weight_kg?: number | null;
  birth_date?: string | null;
  status?: string | null;
  owner_id?: number | null;
  barn_id?: number | null;
  photo_url?: string | null;
}

/** POST /members — backend/app/schemas/member.py → MemberCreate */
export interface MemberCreateInput {
  nik: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  simpanan_pokok?: number;
  simpanan_wajib?: number;
}

/** PUT /members/:id — backend/app/schemas/member.py → MemberUpdate */
export interface MemberUpdateInput {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  simpanan_pokok?: number | null;
  simpanan_wajib?: number | null;
  is_active?: boolean | null;
}

/** POST /feed/orders — backend/app/schemas/feed.py → FeedOrderCreate */
export interface FeedOrderCreateInput {
  quantity_kg: number;
  feed_type?: string;
  max_price_per_kg: number;
}

/** POST /milk/offers — backend/app/schemas/milk.py → MilkOfferCreate */
export interface MilkOfferCreateInput {
  quantity_liters: number;
  price_per_liter: number;
  min_order_liters?: number;
}

/** POST /prices — backend/app/schemas/market_price.py → MarketPriceCreate */
export interface MarketPriceInput {
  date: string;
  item_type: string;
  price_per_unit: number;
  unit?: string;
  source?: string;
}

/** POST /waste/batches — backend/app/schemas/waste.py → WasteBatchCreate */
export interface WasteBatchCreateInput {
  barn_id: number;
  raw_waste_kg: number;
}

/** POST /fertilizer/offers — backend/app/schemas/waste.py → FertilizerOfferCreate */
export interface FertilizerOfferCreateInput {
  quantity_kg: number;
  price_per_kg: number;
}

/** POST /health-logs — backend/app/schemas/health_log.py → HealthLogCreate */
export interface HealthLogCreateInput {
  cow_id: number;
  event_type: string;
  description?: string | null;
  reported_by?: string | null;
}

/** POST /barns — backend/app/schemas/barn.py → BarnCreate */
export interface BarnCreateInput {
  name: string;
  location?: string | null;
  capacity?: number;
  caretaker_name?: string | null;
}

/** PUT /barns/:id — backend/app/schemas/barn.py → BarnUpdate */
export interface BarnUpdateInput {
  name?: string | null;
  location?: string | null;
  capacity?: number | null;
  caretaker_name?: string | null;
}

/** POST /notifications/read */
export interface NotificationMarkReadInput {
  notification_ids: number[];
}

/** POST /checklist/:id/complete */
export interface ChecklistCompleteInput {
  task_id: number;
}
