// =============================================================================
// MooOS v2 — Shared TypeScript Types
// =============================================================================
// These types mirror the backend Pydantic schemas (backend/app/schemas/).
// ANY change here MUST be synced with Axel's Pydantic response schemas.
// =============================================================================

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type CowStatus =
  | 'HEALTHY'
  | 'SICK'
  | 'DEAD'
  | 'SOLD'
  | 'LOOKING_FOR_CARETAKER';

export type CowGender = 'MALE' | 'FEMALE';

export type OfferStatus = 'OPEN' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export type OfferType = 'PAKAN' | 'SUSU' | 'PUPUK';

export type ChecklistPriority = 'HIGH' | 'MEDIUM' | 'INFO';

export type ChecklistActionType =
  | 'CREATE_FEED_ORDER'
  | 'CREATE_MILK_OFFER'
  | 'CREATE_FERTILIZER_OFFER'
  | 'SEND_REMINDER'
  | 'NAVIGATE'
  | 'OPEN_PRICE_MODAL';

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

export type WasteBatchStatus = 'COLLECTING' | 'PROCESSING' | 'READY' | 'SOLD';

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

/** Admin user (web dashboard) */
export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  created_at: string; // ISO 8601
}

/** Anggota koperasi (cow owner) */
export interface Member {
  id: number;
  name: string;
  phone: string;
  address: string;
  cow_count: number;
  created_at: string;
  updated_at: string;
}

/** Kandang */
export interface Barn {
  id: number;
  name: string;        // e.g. "Kandang A"
  location: string;
  pj_name: string;     // Nama PJ Kandang
  cow_count: number;
  created_at: string;
}

/** Sapi */
export interface Cow {
  id: number;
  code: string;         // e.g. "S012"
  name: string;
  gender: CowGender;
  breed: string;        // e.g. "Friesian Holstein"
  birth_date: string;   // ISO date
  weight_kg: number;
  status: CowStatus;
  barn_id: number;
  barn_name: string;    // denormalized for display
  owner_id: number;
  owner_name: string;   // denormalized for display
  photo_url: string | null;
  litre_milked_today: number;
  created_at: string;
}

/** Daily milk production record per cow */
export interface MilkRecord {
  id: number;
  cow_id: number;
  cow_code: string;
  litres: number;
  recorded_at: string;
  recorded_by: string;  // PJ Kandang name
}

/** Daily milk summary (aggregated) */
export interface MilkSummary {
  date: string;
  total_litres: number;
  cow_count: number;
  avg_per_cow: number;
}

/** Cow health log */
export interface HealthLog {
  id: number;
  cow_id: number;
  cow_code: string;
  description: string;
  diagnosed_at: string;
  resolved_at: string | null;
  handled: boolean;
}

/** Feed stock summary */
export interface FeedStock {
  current_stock_kg: number;
  daily_need_kg: number;
  days_remaining: number;
  last_updated: string;
}

/** Feed purchase order */
export interface FeedOrder {
  id: number;
  quantity_kg: number;
  max_price_per_kg: number;
  total_max_price: number;
  status: OfferStatus;
  accepted_by: string | null;  // supplier name
  created_at: string;
  confirmed_at: string | null;
}

/** Generic offer (used for susu & pupuk too) */
export interface Offer {
  id: number;
  offer_type: OfferType;
  quantity: number;
  unit: string;           // "kg" | "liter"
  price_per_unit: number;
  total_price: number;
  status: OfferStatus;
  accepted_by: string | null;
  created_at: string;
  confirmed_at: string | null;
}

/** Waste/fertilizer batch */
export interface WasteBatch {
  id: number;
  barn_id: number;
  barn_name: string;
  quantity_kg: number;
  status: WasteBatchStatus;
  created_at: string;
  ready_at: string | null;
}

/** Daily market price */
export interface MarketPrice {
  id: number;
  date: string;
  item_type: MarketPriceItemType;
  price: number;
  source: MarketPriceSource;
  created_at: string;
}

/** Attendance log */
export interface AttendanceLog {
  id: number;
  user_id: number;
  clock_in: string;
  clock_out: string | null;
  daily_summary: string | null;
}

/** Notification */
export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

/** MRP-generated checklist task */
export interface ChecklistTask {
  id: string;
  priority: ChecklistPriority;
  title: string;
  description: string;
  action_type: ChecklistActionType;
  action_payload: Record<string, unknown>;
  completed: boolean;
}

// ---------------------------------------------------------------------------
// API Response Wrappers
// ---------------------------------------------------------------------------

/** Dashboard summary (GET /dashboard/summary) */
export interface DashboardSummary {
  total_cows: number;
  healthy_cows: number;
  sick_cows: number;
  total_milk_today: number;
  feed_stock_kg: number;
  feed_days_remaining: number;
  active_members: number;
  total_revenue_month: number;
  attendance_today: AttendanceLog | null;
}

/** Auth response (POST /auth/login) */
export interface AuthResponse {
  user: User;
  access_token: string;
  token_type: 'bearer';
}

/** Paginated list response */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/** Market price input (POST /prices) */
export interface MarketPriceInput {
  item_type: MarketPriceItemType;
  price: number;
}

/** Create offer input */
export interface CreateOfferInput {
  offer_type: OfferType;
  quantity: number;
  price_per_unit: number;
}

/** Login input */
export interface LoginInput {
  email: string;
  password: string;
}

/** Create cow input */
export interface CreateCowInput {
  code: string;
  name: string;
  gender: CowGender;
  breed: string;
  birth_date: string;
  weight_kg: number;
  barn_id: number;
  owner_id: number;
}

/** Create member input */
export interface CreateMemberInput {
  name: string;
  phone: string;
  address: string;
}
