export interface MenuOption {
  id: string
  name: string
  default_price: number
  priority: number
}

export interface MenuItemPayload {
  name: string
  slug?: string
  default_price: number
  is_active: boolean
  description?: string | null
  priority: number
}

export interface MenuItemRecord extends MenuItemPayload {
  id: number
  slug: string
  created_at: string
  updated_at: string
}

export interface OptionsResponse {
  menu_items: MenuOption[]
}

export interface OrderPayload {
  customer_name: string
  menu_item_id: string
  menu_item_name: string
  quantity: number
  price: number
  note: string | null
  order_date: string
  is_paid: boolean
}

export interface Order extends OrderPayload {
  id: number
  created_at: string
  updated_at: string
}

export interface SummaryItem {
  menu_item_id: string
  menu_item_name: string
  total_quantity: number
  unpaid_quantity: number
}

export interface SummaryResponse {
  total_orders: number
  unpaid_orders: number
  total_quantity: number
  menu_breakdown: SummaryItem[]
}

export interface MenuOrdersGroup {
  menu_item_id: string
  menu_item_name: string
  orders: MenuGroupedOrder[]
}

export interface MenuGroupedOrder {
  customer_name: string
  quantity: number
  note?: string | null
  is_paid: boolean
}

export interface PaymentBulkUpdateRequest {
  start_date: string
  end_date: string
  is_paid: boolean
}

export interface PaymentBulkUpdateResponse {
  updated: number
  is_paid: boolean
}
