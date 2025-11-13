import { reactive, ref } from 'vue'
import axios, { type AxiosInstance, type AxiosError } from 'axios'
import type {
  MenuItemPayload,
  MenuItemRecord,
  OptionsResponse,
  Order,
  OrderPayload,
  SummaryResponse,
} from '../types/orders'

const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const api: AxiosInstance = axios.create({
  baseURL: apiBase,
})

const storedKey = localStorage.getItem('hs-access-key') || ''
if (storedKey) {
  api.defaults.headers.common['X-Access-Key'] = storedKey
}

const options = reactive<OptionsResponse>({
  menu_items: [],
})

const orders = ref<Order[]>([])
const summary = reactive<SummaryResponse>({
  total_orders: 0,
  unpaid_orders: 0,
  total_quantity: 0,
  menu_breakdown: [],
})

const menuItems = ref<MenuItemRecord[]>([])

const loading = reactive({
  options: false,
  orders: false,
  summary: false,
  menu: false,
})

const unauthorized = ref(false)

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      unauthorized.value = true
    }
    return Promise.reject(error)
  },
)

async function fetchOptions() {
  loading.options = true
  try {
    const { data } = await api.get<OptionsResponse>('/meta/options')
    options.menu_items = [...data.menu_items].sort((a, b) => a.priority - b.priority)
  } finally {
    loading.options = false
  }
}

async function fetchMenuItems(activeOnly = false) {
  loading.menu = true
  try {
    const { data } = await api.get<MenuItemRecord[]>('/menu-items', {
      params: { active_only: activeOnly },
    })
    menuItems.value = data
  } finally {
    loading.menu = false
  }
}

async function fetchOrders() {
  loading.orders = true
  try {
    const { data } = await api.get<Order[]>('/orders')
    orders.value = data
  } finally {
    loading.orders = false
  }
}

async function fetchSummary() {
  loading.summary = true
  try {
    const { data } = await api.get<SummaryResponse>('/reports/summary')
    Object.assign(summary, data)
  } finally {
    loading.summary = false
  }
}

async function refreshAll() {
  await Promise.all([fetchOptions(), fetchMenuItems(), fetchOrders(), fetchSummary()])
}

async function createOrder(payload: OrderPayload) {
  await api.post('/orders', payload)
  await Promise.all([fetchOrders(), fetchSummary()])
}

async function updateOrder(orderId: number, payload: Partial<OrderPayload>) {
  await api.put(`/orders/${orderId}`, payload)
  await Promise.all([fetchOrders(), fetchSummary()])
}

async function deleteOrder(orderId: number) {
  await api.delete(`/orders/${orderId}`)
  await Promise.all([fetchOrders(), fetchSummary()])
}

async function togglePaid(orderId: number, isPaid: boolean) {
  await api.put(`/orders/${orderId}`, { is_paid: isPaid })
  await Promise.all([fetchOrders(), fetchSummary()])
}

async function createMenuItem(payload: MenuItemPayload) {
  await api.post('/menu-items', payload)
  await Promise.all([fetchMenuItems(), fetchOptions()])
}

async function updateMenuItem(menuItemId: number, payload: Partial<MenuItemPayload>) {
  await api.put(`/menu-items/${menuItemId}`, payload)
  await Promise.all([fetchMenuItems(), fetchOptions()])
}

async function deleteMenuItem(menuItemId: number) {
  await api.delete(`/menu-items/${menuItemId}`)
  await Promise.all([fetchMenuItems(), fetchOptions()])
}

async function exportCsv(): Promise<Blob> {
  const response = await api.get('/orders/export', { responseType: 'blob' })
  return new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
}

function setAccessKey(key: string) {
  if (key) {
    api.defaults.headers.common['X-Access-Key'] = key
    localStorage.setItem('hs-access-key', key)
  } else {
    delete api.defaults.headers.common['X-Access-Key']
    localStorage.removeItem('hs-access-key')
  }
  unauthorized.value = false
}

export function useOrdersStore() {
  return {
    api,
    options,
    orders,
    summary,
    menuItems,
    loading,
    unauthorized,
    fetchOptions,
    fetchMenuItems,
    fetchOrders,
    fetchSummary,
    refreshAll,
    createOrder,
    updateOrder,
    deleteOrder,
    togglePaid,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    exportCsv,
    setAccessKey,
  }
}
