<template>
  <v-container class="py-6" style="max-width: 1100px;">
    <v-row class="mb-3" dense>
      <v-col cols="6" sm="4">
        <v-text-field
          v-model="dateFilters.start"
          type="date"
          label="ตั้งแต่วันที่"
          density="comfortable"
          prepend-inner-icon="mdi-calendar-start"
        />
      </v-col>
      <v-col cols="6" sm="4">
        <v-text-field
          v-model="dateFilters.end"
          type="date"
          label="ถึงวันที่"
          density="comfortable"
          prepend-inner-icon="mdi-calendar-end"
        />
      </v-col>
      <v-col cols="12" sm="4" class="d-flex align-end flex-wrap ga-2">
        <v-btn variant="tonal" color="primary" @click="resetDateFilters">
          วันนี้
        </v-btn>
      </v-col>
    </v-row>

    <v-card elevation="2" class="mb-4" :loading="store.loading.summary">
      <v-card-title class="text-h6 font-weight-bold">
        สรุปภาพรวม
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6">
            <v-sheet class="stat-card" color="orange-lighten-5" rounded="lg" elevation="0">
              <div class="text-caption text-grey-darken-1">จำนวนออเดอร์</div>
              <div class="text-h4 font-weight-bold">{{ filteredSummary.total_orders }}</div>
            </v-sheet>
          </v-col>
          <v-col cols="12" sm="6">
            <v-sheet class="stat-card" color="green-lighten-5" rounded="lg" elevation="0">
              <div class="text-caption text-grey-darken-1">จำนวนชิ้นทั้งหมด</div>
              <div class="text-h4 font-weight-bold">{{ filteredSummary.total_quantity }}</div>
            </v-sheet>
          </v-col>
          <v-col cols="12" sm="6">
            <v-sheet class="stat-card" color="red-lighten-5" rounded="lg" elevation="0">
              <div class="text-caption text-grey-darken-1">ยังไม่ได้รับเงิน</div>
              <div class="text-h4 font-weight-bold">{{ filteredSummary.unpaid_orders }}</div>
              <div class="text-caption">{{ formatCurrency(unpaidAmount) }}</div>
            </v-sheet>
          </v-col>
          <v-col cols="12" sm="6">
            <v-sheet class="stat-card" color="blue-lighten-5" rounded="lg" elevation="0">
              <div class="text-caption text-grey-darken-1">ยอดรวมโดยประมาณ</div>
              <div class="text-h4 font-weight-bold">{{ formatCurrency(totalAmount) }}</div>
            </v-sheet>
          </v-col>
          <v-col cols="12" sm="6">
            <v-sheet class="stat-card" color="purple-lighten-5" rounded="lg" elevation="0">
              <div class="text-caption text-grey-darken-1">กำไรประมาณการ (30%)</div>
              <div class="text-h4 font-weight-bold">{{ formatCurrency(profitAmount) }}</div>
            </v-sheet>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card elevation="2" class="mb-4" :loading="store.loading.summary">
      <v-card-title class="text-h6 font-weight-bold">
        คำนวณการใช้ขนมปัง
      </v-card-title>
      <v-card-text>
        <div class="text-caption text-grey-darken-1 mb-3">
          1 แถว มี 20 แผ่น (ตัดหัวท้ายออก) ใช้งานจริงได้ 18 แผ่น
        </div>
        <v-row>
          <v-col cols="12" md="4">
            <v-sheet class="stat-card" color="amber-lighten-5" rounded="lg" elevation="0">
              <div class="text-caption text-grey-darken-1">จำนวนแผ่นที่ต้องใช้</div>
              <div class="text-h4 font-weight-bold">{{ formatNumber(breadUsage.totalSlices) }}</div>
            </v-sheet>
          </v-col>
          <v-col cols="12" md="4">
            <v-sheet class="stat-card" color="cyan-lighten-5" rounded="lg" elevation="0">
              <div class="text-caption text-grey-darken-1">จำนวนแถวขนมปัง (18 แผ่น/แถว)</div>
              <div class="text-h4 font-weight-bold">{{ formatNumber(breadUsage.totalLoaves) }}</div>
            </v-sheet>
          </v-col>
          <v-col cols="12" md="4">
            <v-sheet class="stat-card" color="lime-lighten-5" rounded="lg" elevation="0">
              <div class="text-caption text-grey-darken-1">แผ่นคงเหลือ / ส่วนขาด</div>
              <div class="text-h4 font-weight-bold">
                {{ breadUsage.totalLoaves ? formatNumber(breadUsage.leftoverSlices) : 0 }}
                <span class="text-body-2 text-grey-darken-1">แผ่น</span>
              </div>
            </v-sheet>
          </v-col>
        </v-row>
        <v-divider class="my-4" />
        <div class="text-subtitle-1 font-weight-bold mb-2">รายละเอียดแผ่นขนมปังตามเมนู</div>
        <v-table density="comfortable">
          <thead>
            <tr>
              <th>เมนู</th>
              <th class="text-end">จำนวนชิ้น</th>
              <th class="text-end">แผ่นต่อชิ้น</th>
              <th class="text-end">รวมแผ่น</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="detail in breadUsage.details" :key="detail.menu_item_id">
              <td>{{ detail.menu_item_name }}</td>
              <td class="text-end">{{ formatNumber(detail.total_quantity) }}</td>
              <td class="text-end">{{ detail.slices_per_item }}</td>
              <td class="text-end">{{ formatNumber(detail.total_slices) }}</td>
            </tr>
            <tr v-if="!breadUsage.details.length">
              <td colspan="4" class="text-center text-grey py-4">ยังไม่มีข้อมูลในช่วงวันที่เลือก</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <v-row dense>
      <v-col cols="12" md="6">
        <v-card elevation="2" class="mb-4" :loading="store.loading.summary">
          <v-card-title class="text-h6 font-weight-bold">
            สถานะค้างชำระ
          </v-card-title>
          <v-card-text>
            <div class="text-subtitle-1 mb-2">จำนวนออเดอร์ที่ยังไม่ชำระ</div>
            <div class="text-h3 font-weight-bold mb-2">{{ filteredSummary.unpaid_orders }}</div>
            <div class="text-caption text-grey-darken-1 mb-4">
              ยอดเงินที่ยังค้าง {{ formatCurrency(unpaidAmount) }}
            </div>
            <v-divider class="my-2" />
            <div class="text-subtitle-1">ยอดรวมทั้งหมด</div>
            <div class="text-h4 font-weight-bold">{{ formatCurrency(totalAmount) }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card elevation="2" class="mb-4" :loading="store.loading.summary">
          <v-card-title class="text-h6 font-weight-bold">
            สรุปเมนู (ยอดรวม)
          </v-card-title>
          <v-divider />
          <v-table density="comfortable">
            <thead>
              <tr>
                <th>เมนู</th>
                <th class="text-end">จำนวนชิ้น</th>
                <th class="text-end">ค้างชำระ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredBreakdown" :key="item.menu_item_id">
                <td>{{ item.menu_item_name }}</td>
                <td class="text-end">{{ item.total_quantity }}</td>
                <td class="text-end">
                  <v-chip
                    size="small"
                    :color="item.unpaid_quantity ? 'warning' : 'success'"
                    variant="tonal"
                  >
                    {{ item.unpaid_quantity }}
                  </v-chip>
                </td>
              </tr>
              <tr v-if="!filteredBreakdown.length">
                <td colspan="3" class="text-center text-grey py-4">ยังไม่มีข้อมูลในช่วงวันที่เลือก</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>

    <v-card elevation="2" class="mt-6" :loading="store.loading.summary">
      <v-card-title class="text-h6 font-weight-bold">
        รายการตามแต่ละเมนู
      </v-card-title>
      <v-divider />
      <template v-if="groupedMenuOrders.length">
        <v-expansion-panels variant="accordion">
          <v-expansion-panel
            v-for="group in groupedMenuOrders"
            :key="group.menu_item_id"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center justify-space-between w-100">
                <span>{{ group.menu_item_name }}</span>
                <v-chip size="small" color="primary" variant="tonal">
                  {{ group.orders.length }} รายการ
                </v-chip>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-list density="compact">
                <v-list-item
                  v-for="(order, index) in group.orders"
                  :key="order.customer_name + index"
                >
                  <v-list-item-title class="d-flex align-center justify-space-between ga-4">
                    <div>
                      <strong>{{ order.customer_name }}</strong>
                      <span v-if="order.note" class="text-caption text-grey-darken-1">
                        • {{ order.note }}
                      </span>
                    </div>
                    <div class="d-flex ga-2 align-center">
                      <v-chip size="small" color="secondary" variant="tonal">
                        {{ order.quantity }} ชิ้น
                      </v-chip>
                      <v-chip
                        size="small"
                        :color="order.is_paid ? 'success' : 'warning'"
                        variant="tonal"
                      >
                        {{ order.is_paid ? 'ชำระแล้ว' : 'ยังไม่ชำระ' }}
                      </v-chip>
                    </div>
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </template>
      <template v-else>
        <div class="text-center text-grey py-6">
          ยังไม่มีข้อมูลในช่วงวันที่เลือก
        </div>
      </template>
    </v-card>
  </v-container>
</template>



<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue'
import { useOrdersStore } from '../composables/useOrdersStore'

const store = useOrdersStore()

const BREAD_SLICES_PER_MENU: Record<string, number> = {
  'sandwich-classic-large': 5,
  'sandwich-chili-large': 5,
  'sandwich-classic-medium': 2,
  'sandwich-chili-medium': 2,
  'sandwich-classic-small': 1,
  'sandwich-chili-small': 1,
  'sandwich-steamed-custard-small': 1,
  'sandwich-chocolate-small': 1,
  'sandwich-strawberry-small': 1,
}
const USABLE_SLICES_PER_LOAF = 18

const dateFilters = reactive({
  start: today(),
  end: today(),
})

const menuPriorityMap = computed(() => {
  const map = new Map<string, number>()
  store.options.menu_items.forEach((item) => map.set(item.id, item.priority ?? Number.MAX_SAFE_INTEGER))
  return map
})

const getMenuPriority = (menuId: string) => menuPriorityMap.value.get(menuId) ?? Number.MAX_SAFE_INTEGER

watch(
  () => dateFilters.start,
  (value) => {
    if (!value) {
      dateFilters.start = today()
      return
    }
    if (value > dateFilters.end) {
      dateFilters.end = value
    }
  },
)

watch(
  () => dateFilters.end,
  (value) => {
    if (!value) {
      dateFilters.end = dateFilters.start
      return
    }
    if (value < dateFilters.start) {
      dateFilters.start = value
    }
  },
)

onMounted(async () => {
  if (!store.orders.value.length) {
    await store.fetchOrders()
  }
  await Promise.all([store.fetchSummary(dateFilters.start, dateFilters.end), store.fetchOptions()])
})

watch(
  () => [dateFilters.start, dateFilters.end],
  async ([start, end]) => {
    store.loading.summary = true
    await store.fetchSummary(start, end)
    store.loading.summary = false
  },
)

const filteredOrders = computed(() => store.orders.value.filter((order) => isWithinDateRange(order.order_date)))

const filteredSummary = computed(() => store.summary)

const filteredBreakdown = computed(() =>
  [...store.summary.menu_breakdown].sort(
    (a, b) => getMenuPriority(a.menu_item_id) - getMenuPriority(b.menu_item_id) || a.menu_item_name.localeCompare(b.menu_item_name),
  ),
)

const groupedMenuOrders = computed(() => {
  const map = new Map<
    string,
    {
      menu_item_id: string
      menu_item_name: string
      orders: Array<{ customer_name: string; quantity: number; note?: string | null; is_paid: boolean }>
    }
  >()
  filteredOrders.value.forEach((order) => {
    const entry =
      map.get(order.menu_item_id) ||
      {
        menu_item_id: order.menu_item_id,
        menu_item_name: order.menu_item_name,
        orders: [],
      }
    entry.orders.push({
      customer_name: order.customer_name,
      quantity: order.quantity,
      note: order.note,
      is_paid: order.is_paid,
    })
    map.set(order.menu_item_id, entry)
  })
  return Array.from(map.values()).sort(
    (a, b) => getMenuPriority(a.menu_item_id) - getMenuPriority(b.menu_item_id) || a.menu_item_name.localeCompare(b.menu_item_name),
  )
})

const totalAmount = computed(() =>
  filteredOrders.value.reduce((sum, order) => sum + (order.price || 0), 0),
)

const unpaidAmount = computed(() =>
  filteredOrders.value.filter((order) => !order.is_paid).reduce((sum, order) => sum + (order.price || 0), 0),
)
const profitAmount = computed(() => totalAmount.value * 0.3)

const breadUsage = computed(() => {
  let totalSlices = 0
  const detailsMap = new Map<
    string,
    {
      menu_item_id: string
      menu_item_name: string
      slices_per_item: number
      total_quantity: number
      total_slices: number
    }
  >()

  filteredOrders.value.forEach((order) => {
    const slicesPerItem = BREAD_SLICES_PER_MENU[order.menu_item_id] || 0
    if (!slicesPerItem) return
    const slices = (order.quantity || 0) * slicesPerItem
    totalSlices += slices
    const detail =
      detailsMap.get(order.menu_item_id) || {
        menu_item_id: order.menu_item_id,
        menu_item_name: order.menu_item_name,
        slices_per_item: slicesPerItem,
        total_quantity: 0,
        total_slices: 0,
      }
    detail.total_quantity += order.quantity || 0
    detail.total_slices += slices
    detailsMap.set(order.menu_item_id, detail)
  })

  const totalLoaves = totalSlices ? Math.ceil(totalSlices / USABLE_SLICES_PER_LOAF) : 0
  const usableSlices = totalLoaves * USABLE_SLICES_PER_LOAF
  const leftoverSlices = usableSlices - totalSlices

  return {
    totalSlices,
    totalLoaves,
    usableSlices,
    leftoverSlices,
    details: Array.from(detailsMap.values()).sort(
      (a, b) => getMenuPriority(a.menu_item_id) - getMenuPriority(b.menu_item_id) || b.total_slices - a.total_slices,
    ),
  }
})

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount || 0)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('th-TH').format(value || 0)
}

function resetDateFilters() {
  dateFilters.start = today()
  dateFilters.end = today()
}

function isWithinDateRange(orderDate?: string | null) {
  if (!orderDate) return false
  const dateOnly = orderDate.split('T')[0]
  return dateOnly >= dateFilters.start && dateOnly <= dateFilters.end
}

function today() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
}
</script>

<style scoped>
.stat-card {
  padding: 16px;
}
</style>
