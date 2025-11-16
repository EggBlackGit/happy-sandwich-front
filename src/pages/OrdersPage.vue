<template>
  <v-container class="py-6" style="max-width: 1200px;">
    <v-alert
      v-if="errorMessage"
      class="mb-4"
      type="error"
      variant="tonal"
      closable
      @click:close="errorMessage = ''"
    >
      {{ errorMessage }}
    </v-alert>

    <v-row dense>
      <v-col cols="12" md="5">
        <v-card elevation="2">
          <v-card-title class="text-h6 font-weight-bold">
            {{ editingOrderId ? 'แก้ไขออเดอร์' : 'เพิ่มออเดอร์ใหม่ (หลายเมนูได้)' }}
          </v-card-title>
          <v-card-subtitle>
            กรอกข้อมูลลูกค้าและเพิ่มเมนูที่ต้องการหลายรายการก่อนกดบันทึก
          </v-card-subtitle>
          <v-divider class="my-2" />
          <v-card-text>
            <v-form ref="formRef" @submit.prevent="handleSubmit">
              <v-text-field
                v-model="baseForm.customer_name"
                label="ชื่อผู้สั่ง"
                :rules="[requiredRule]"
                prepend-inner-icon="mdi-account"
                density="comfortable"
                required
              />

              <v-text-field
                v-model="baseForm.order_date"
                label="วันที่สั่ง"
                type="date"
                density="comfortable"
                prepend-inner-icon="mdi-calendar"
              />

              <v-textarea
                v-model="baseForm.note"
                label="โน้ตเพิ่มเติม"
                rows="2"
                auto-grow
                density="comfortable"
              />

              <v-switch
                v-model="baseForm.is_paid"
                color="secondary"
                inset
                label="รับเงินแล้ว"
              />

              <v-divider class="my-4" />

              <div class="text-subtitle-1 font-weight-bold mb-2">
                {{ editingOrderId ? 'รายการที่กำลังแก้ไข' : 'เพิ่มเมนูเข้ารายการ' }}
              </div>

              <v-row dense>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="itemForm.menu_item_id"
                    :items="store.options.menu_items"
                    item-title="name"
                    item-value="id"
                    label="เมนู"
                    :rules="[requiredRule]"
                    density="comfortable"
                    prepend-inner-icon="mdi-food"
                    @update:model-value="onMenuChange"
                    :disabled="!store.options.menu_items.length"
                    required
                  />
                </v-col>
                <v-col cols="6" md="3">
                  <v-text-field
                    v-model.number="itemForm.quantity"
                    label="จำนวน (ชิ้น)"
                    type="number"
                    min="1"
                    :rules="[requiredNumberRule]"
                    density="comfortable"
                    prepend-inner-icon="mdi-counter"
                    @change="syncPriceWithQuantity"
                    required
                  />
                </v-col>
                <v-col cols="6" md="3">
                  <v-text-field
                    v-model.number="itemForm.price"
                    label="ราคา (บาท)"
                    type="number"
                    min="0"
                    step="5"
                    density="comfortable"
                    prefix="฿"
                  />
                </v-col>
              </v-row>

              <div class="d-flex ga-2 justify-end mt-2" v-if="!editingOrderId">
                <v-btn variant="text" color="grey" @click="resetItemForm" :disabled="!itemForm.menu_item_id">
                  ล้างรายการ
                </v-btn>
                <v-btn color="primary" @click="addItemToPending" :disabled="addLocked">
                  <v-icon start>mdi-cart-plus</v-icon>
                  เพิ่มเข้ารายการ
                </v-btn>
              </div>

              <template v-if="!editingOrderId">
                <v-divider class="my-4" />
                <div class="d-flex align-center justify-space-between mb-2">
                  <span class="text-subtitle-1">รายการทั้งหมด ({{ pendingItems.length }} รายการ)</span>
                  <v-chip v-if="pendingItems.length" color="primary" variant="tonal">
                    รวม {{ totalPendingQuantity }} ชิ้น • {{ formatCurrency(totalPendingPrice) }}
                  </v-chip>
                </div>
                <v-table v-if="pendingItems.length" density="comfortable">
                  <thead>
                    <tr>
                      <th>เมนู</th>
                      <th class="text-end">จำนวน</th>
                      <th class="text-end">ราคา</th>
                      <th class="text-end">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in pendingItems" :key="item.id">
                      <td>{{ item.menu_item_name }}</td>
                      <td class="text-end">{{ item.quantity }}</td>
                      <td class="text-end">{{ formatCurrency(item.price) }}</td>
                      <td class="text-end">
                        <v-btn icon variant="text" color="error" size="small" @click="removePendingItem(item.id)">
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
                <div v-else class="text-grey text-center py-4">ยังไม่มีเมนูในรายการ</div>
              </template>

              <div class="d-flex ga-2 justify-end mt-4">
                <v-btn
                  v-if="editingOrderId"
                  variant="text"
                  color="grey"
                  @click="resetForm"
                >
                  ยกเลิก
                </v-btn>
                <v-btn
                  color="primary"
                  type="submit"
                  :loading="formSubmitting"
                  :disabled="submitLocked"
                >
                  {{ editingOrderId ? 'บันทึกการแก้ไข' : `บันทึกทั้งหมด (${pendingItems.length} รายการ)` }}
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="7">
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
          <v-col cols="12" sm="4" class="d-flex align-center ga-2 flex-wrap">
            <v-btn variant="tonal" color="primary" @click="resetDateFilters">
              วันนี้
            </v-btn>
            <v-btn
              color="success"
              variant="tonal"
              :disabled="bulkUpdating || !canBulkMarkPaid"
              :loading="bulkUpdating"
              @click="markPaidDialog = true"
            >
              <v-icon start>mdi-cash-check</v-icon>
              ตั้งเป็นจ่ายแล้ว
            </v-btn>
          </v-col>
        </v-row>

        <!-- <v-card elevation="2" class="mb-4">
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
            </v-row>
          </v-card-text>
        </v-card> -->

        <v-card elevation="2">
          <v-card-title class="d-flex flex-wrap ga-2 align-center">
            <span class="text-h6 font-weight-bold">รายการออเดอร์</span>
            <v-spacer />
            <v-btn size="small" variant="tonal" color="primary" :loading="exporting" @click="downloadCsv">
              <v-icon start>mdi-download</v-icon>
              ดาวน์โหลด CSV
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-row class="mb-4" dense>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="filters.search"
                  label="ค้นหาชื่อผู้สั่ง"
                  density="comfortable"
                  prepend-inner-icon="mdi-magnify"
                  clearable
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="filters.menu"
                  :items="menuFilterItems"
                  label="กรองตามเมนู"
                  density="comfortable"
                  prepend-inner-icon="mdi-filter"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="filters.payment"
                  :items="paymentFilterItems"
                  label="สถานะการชำระ"
                  density="comfortable"
                  prepend-inner-icon="mdi-wallet"
                />
              </v-col>
            </v-row>

            <v-data-table
              :headers="orderHeaders"
              :items="filteredOrders"
              :loading="loading.orders"
              item-key="id"
              density="comfortable"
              class="elevation-0"
            >
              <template #item.order_date="{ value }">
                {{ formatDate(value as string) }}
              </template>
              <template #item.price="{ value }">
                {{ formatCurrency(value as number) }}
              </template>
              <template #item.is_paid="{ item }">
                <v-chip
                  size="small"
                  :color="item.is_paid ? 'success' : 'warning'"
                  variant="tonal"
                >
                  {{ item.is_paid ? 'ชำระแล้ว' : 'ค้างจ่าย' }}
                </v-chip>
              </template>
              <template #item.actions="{ item }">
                <v-btn
                  size="small"
                  icon
                  variant="text"
                  color="secondary"
                  @click="startEdit(item)"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  size="small"
                  icon
                  variant="text"
                  color="primary"
                  @click="togglePaid(item)"
                >
                  <v-icon>{{ item.is_paid ? 'mdi-cash-check' : 'mdi-cash-remove' }}</v-icon>
                </v-btn>
                <v-btn
                  size="small"
                  icon
                  variant="text"
                  color="error"
                  @click="confirmDelete(item)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
              <template #no-data>
                <div class="text-center py-6 text-grey">ยังไม่มีออเดอร์ในระบบ</div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title class="text-h6">ลบออเดอร์</v-card-title>
        <v-card-text>
          ต้องการลบรายการของ <strong>{{ orderToDelete?.customer_name }}</strong> ใช่ไหม?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">ยกเลิก</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteOrder">ลบ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="markPaidDialog" max-width="420">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">ยืนยันอัปเดตสถานะชำระ</v-card-title>
        <v-card-text>
          <div>
            ต้องการตั้งสถานะ "ชำระแล้ว" ให้กับออเดอร์ระหว่าง {{ formatDateOnly(dateFilters.start) }} - {{ formatDateOnly(dateFilters.end) }}
          </div>
          <div class="text-caption text-medium-emphasis mt-2">
            ทั้งหมด {{ filteredOrdersCount }} รายการในช่วงวันที่ที่กำลังกรองอยู่
          </div>
        </v-card-text>
        <v-card-actions class="justify-end ga-2">
          <v-btn variant="text" color="grey" @click="markPaidDialog = false" :disabled="bulkUpdating">
            ยกเลิก
          </v-btn>
          <v-btn color="success" :loading="bulkUpdating" :disabled="!canBulkMarkPaid" @click="markDateRangePaid">
            ยืนยัน
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editDialog" max-width="640">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">แก้ไขออเดอร์</v-card-title>
        <v-card-text>
          <v-form ref="editFormRef" @submit.prevent="submitEdit">
            <v-text-field
              v-model="editForm.customer_name"
              label="ชื่อลูกค้า"
              :rules="[requiredRule]"
              prepend-inner-icon="mdi-account"
              density="comfortable"
              required
            />
            <v-text-field
              v-model="editForm.order_date"
              label="วันที่สั่ง"
              type="date"
              density="comfortable"
              prepend-inner-icon="mdi-calendar"
            />
            <v-textarea
              v-model="editForm.note"
              label="หมายเหตุ"
              rows="2"
              auto-grow
              density="comfortable"
            />
            <v-switch
              v-model="editForm.is_paid"
              color="secondary"
              inset
              label="ชำระแล้ว"
            />
            <v-divider class="my-4" />
            <div class="text-subtitle-1 font-weight-bold mb-2">รายละเอียดเมนู</div>
            <v-row dense>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editForm.menu_item_id"
                  :items="store.options.menu_items"
                  item-title="name"
                  item-value="id"
                  label="เมนู"
                  :rules="[requiredRule]"
                  density="comfortable"
                  prepend-inner-icon="mdi-food"
                  @update:model-value="onEditMenuChange"
                  :disabled="!store.options.menu_items.length"
                  required
                />
              </v-col>
              <v-col cols="6" md="3">
                <v-text-field
                  v-model.number="editForm.quantity"
                  label="จำนวนชิ้น"
                  type="number"
                  min="1"
                  :rules="[requiredNumberRule]"
                  density="comfortable"
                  prepend-inner-icon="mdi-counter"
                  @change="syncEditPriceWithQuantity"
                  required
                />
              </v-col>
              <v-col cols="6" md="3">
                <v-text-field
                  v-model.number="editForm.price"
                  label="ราคา (บาท)"
                  type="number"
                  min="0"
                  step="5"
                  density="comfortable"
                  prefix="฿"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="justify-end ga-2">
          <v-btn variant="text" color="grey" @click="resetEditForm" :disabled="formSubmitting">
            ยกเลิก
          </v-btn>
          <v-btn color="primary" :loading="formSubmitting" @click="submitEdit" :disabled="!editOrderId">
            บันทึกการแก้ไข
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-snackbar v-model="snackbar" timeout="2500">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useOrdersStore } from '../composables/useOrdersStore'
import type { MenuOption, Order } from '../types/orders'

type BaseForm = {
  customer_name: string
  note: string
  order_date: string
  is_paid: boolean
}

type ItemForm = {
  menu_item_id: string
  menu_item_name: string
  quantity: number
  price: number
}

type PendingEntry = ItemForm & { id: number }

const store = useOrdersStore()
const orders = store.orders

const baseForm = reactive<BaseForm>(createEmptyBaseForm())
const itemForm = reactive<ItemForm>(createEmptyItemForm())
const pendingItems = ref<PendingEntry[]>([])
const editForm = reactive({
  customer_name: '',
  note: '',
  order_date: today(),
  is_paid: false,
  menu_item_id: '',
  quantity: 1,
  price: 0,
})
const dateFilters = reactive({
  start: today(),
  end: today(),
})

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

const editingOrderId = ref<number | null>(null)
const editOrderId = ref<number | null>(null)
const editDialog = ref(false)
const editFormRef = ref()
const formRef = ref()
const formSubmitting = ref(false)
const loading = reactive({ orders: false, summary: false })
const exporting = ref(false)
const deleting = ref(false)
const deleteDialog = ref(false)
const markPaidDialog = ref(false)
const orderToDelete = ref<Order | null>(null)
const bulkUpdating = ref(false)
const snackbar = ref(false)
const snackbarMessage = ref('')
const errorMessage = ref('')

const filters = reactive({
  search: '',
  menu: 'all',
  payment: 'all',
})

const paymentFilterItems = [
  { title: 'ทั้งหมด', value: 'all' },
  { title: 'ชำระแล้ว', value: 'paid' },
  { title: 'ค้างจ่าย', value: 'unpaid' },
]

const totalAmount = computed(() =>
  filteredOrders.value.reduce((sum, order) => sum + (order.price || 0), 0),
)
const unpaidAmount = computed(() =>
  filteredOrders.value.filter((order) => !order.is_paid).reduce((sum, order) => sum + (order.price || 0), 0),
)
const filteredSummary = computed(() => {
  const ordersList = filteredOrders.value
  return {
    total_orders: ordersList.length,
    total_quantity: ordersList.reduce((sum, order) => sum + (order.quantity || 0), 0),
    unpaid_orders: ordersList.filter((order) => !order.is_paid).length,
  }
})
const totalPendingQuantity = computed(() =>
  pendingItems.value.reduce((sum, item) => sum + item.quantity, 0),
)
const totalPendingPrice = computed(() =>
  pendingItems.value.reduce((sum, item) => sum + item.price, 0),
)
const addLocked = computed(
  () =>
    !itemForm.menu_item_id ||
    !baseForm.customer_name ||
    itemForm.quantity <= 0 ||
    itemForm.price <= 0,
)
const submitLocked = computed(() =>
  editingOrderId.value
    ? !itemForm.menu_item_id || itemForm.quantity <= 0 || itemForm.price <= 0
    : !baseForm.customer_name || !pendingItems.value.length || formSubmitting.value,
)
const isRefreshing = computed(() => loading.orders || loading.summary)

const menuLookup = computed<Record<string, MenuOption>>(() =>
  store.options.menu_items.reduce((acc, item) => {
    acc[item.id] = item
    return acc
  }, {} as Record<string, MenuOption>),
)

const menuPriority = (menuId: string | undefined) =>
  menuId && menuLookup.value[menuId] ? menuLookup.value[menuId].priority ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER

const filteredOrders = computed(() => {
  const filtered = orders.value.filter((order) => {
    const matchesSearch = order.customer_name.toLowerCase().includes(filters.search.toLowerCase())
    const matchesMenu = filters.menu === 'all' || order.menu_item_id === filters.menu
    const matchesPayment =
      filters.payment === 'all'
        ? true
        : filters.payment === 'paid'
          ? order.is_paid
          : !order.is_paid
    const matchesDate = isWithinDateRange(order.order_date)
    return matchesSearch && matchesMenu && matchesPayment && matchesDate
  })
  return filtered
    .slice()
    .sort((a, b) => {
      const priorityDiff = menuPriority(a.menu_item_id) - menuPriority(b.menu_item_id)
      if (priorityDiff !== 0) {
        return priorityDiff
      }
      const dateA = a.order_date ? new Date(a.order_date).getTime() : 0
      const dateB = b.order_date ? new Date(b.order_date).getTime() : 0
      if (dateA !== dateB) {
        return dateB - dateA
      }
      return b.id - a.id
    })
})

const filteredOrdersCount = computed(() => filteredOrders.value.length)
const canBulkMarkPaid = computed(() => filteredOrdersCount.value > 0 && !isRefreshing.value)

const orderHeaders = [
  { title: 'วันที่', key: 'order_date', sortable: false },
  { title: 'ลูกค้า', key: 'customer_name', sortable: false },
  { title: 'เมนู', key: 'menu_item_name', sortable: false },
  { title: 'จำนวน', key: 'quantity', sortable: false },
  { title: 'ราคา', key: 'price', sortable: false },
  { title: 'สถานะ', key: 'is_paid', sortable: false },
  { title: 'จัดการ', key: 'actions', sortable: false },
]

const menuFilterItems = computed(() => [
  { title: 'เมนูทั้งหมด', value: 'all' },
  ...store.options.menu_items.map((menu) => ({ title: menu.name, value: menu.id })),
])

onMounted(async () => {
  await refreshAll()
})

async function refreshAll() {
  try {
    loading.orders = true
    loading.summary = true
    await Promise.all([
      store.fetchOptions(),
      store.fetchOrders(),
      store.fetchSummary(dateFilters.start, dateFilters.end),
    ])
  } catch (error) {
    handleError(error)
  } finally {
    loading.orders = false
    loading.summary = false
  }
}

async function handleSubmit() {
  formSubmitting.value = true
  try {
    if (editingOrderId.value) {
      const menuMeta = menuLookup.value[itemForm.menu_item_id]
      if (!menuMeta) {
        errorMessage.value = 'เลือกเมนูจากรายการที่มี'
        return
      }
      await store.updateOrder(editingOrderId.value, buildPayload(menuMeta))
      snackbarMessage.value = 'อัปเดตออเดอร์เรียบร้อย'
    } else {
      if (!pendingItems.value.length) {
        errorMessage.value = 'เพิ่มเมนูน้อยที่สุด 1 รายการก่อนบันทึก'
        return
      }
      await Promise.all(
        pendingItems.value.map((item) => {
          const menuMeta = menuLookup.value[item.menu_item_id]
          if (!menuMeta) return Promise.resolve()
          return store.createOrder({
            customer_name: baseForm.customer_name,
            menu_item_id: item.menu_item_id,
            menu_item_name: menuMeta.name,
            quantity: item.quantity,
            price: item.price,
            note: baseForm.note,
            order_date: baseForm.order_date,
            is_paid: baseForm.is_paid,
          })
        }),
      )
      snackbarMessage.value = 'เพิ่มออเดอร์แล้ว'
    }
    snackbar.value = true
    await store.fetchOrders()
    await store.fetchSummary()
    resetForm()
  } catch (error) {
    handleError(error)
  } finally {
    formSubmitting.value = false
  }
}

function addItemToPending() {
  const menuMeta = menuLookup.value[itemForm.menu_item_id]
  if (!menuMeta) {
    errorMessage.value = 'เลือกเมนูจากรายการที่มี'
    return
  }
  pendingItems.value.push({
    id: Date.now() + Math.random(),
    menu_item_id: itemForm.menu_item_id,
    menu_item_name: menuMeta.name,
    quantity: itemForm.quantity,
    price: itemForm.price,
  })
  Object.assign(itemForm, createEmptyItemForm())
}

function removePendingItem(id: number) {
  pendingItems.value = pendingItems.value.filter((item) => item.id !== id)
}

function startEdit(order: Order) {
  editOrderId.value = order.id
  Object.assign(editForm, {
    customer_name: order.customer_name,
    note: order.note || '',
    order_date: order.order_date?.split('T')[0] || today(),
    is_paid: order.is_paid,
    menu_item_id: order.menu_item_id,
    quantity: order.quantity,
    price: order.price,
  })
  editDialog.value = true
}

function resetForm() {
  Object.assign(baseForm, createEmptyBaseForm())
  Object.assign(itemForm, createEmptyItemForm())
  pendingItems.value = []
  editingOrderId.value = null
}

function resetEditForm() {
  Object.assign(editForm, {
    customer_name: '',
    note: '',
    order_date: today(),
    is_paid: false,
    menu_item_id: '',
    quantity: 1,
    price: 0,
  })
  editOrderId.value = null
  editDialog.value = false
}

function resetItemForm() {
  Object.assign(itemForm, createEmptyItemForm())
}

function syncPriceWithQuantity() {
  const menuMeta = menuLookup.value[itemForm.menu_item_id]
  if (!menuMeta) return
  itemForm.price = menuMeta.default_price * Math.max(1, itemForm.quantity || 1)
}

function syncEditPriceWithQuantity() {
  const menuMeta = menuLookup.value[editForm.menu_item_id]
  if (!menuMeta) return
  editForm.price = menuMeta.default_price * Math.max(1, editForm.quantity || 1)
}

function onMenuChange() {
  syncPriceWithQuantity()
}

function onEditMenuChange() {
  syncEditPriceWithQuantity()
}

function confirmDelete(order: Order) {
  orderToDelete.value = order
  deleteDialog.value = true
}

async function deleteOrder() {
  if (!orderToDelete.value) return
  deleting.value = true
  try {
    await store.deleteOrder(orderToDelete.value.id)
    deleteDialog.value = false
    snackbarMessage.value = 'ลบออเดอร์แล้ว'
    snackbar.value = true
    await store.fetchOrders()
    await store.fetchSummary()
  } catch (error) {
    handleError(error)
  } finally {
    deleting.value = false
  }
}

async function togglePaid(order: Order) {
  try {
    await store.togglePaid(order.id, !order.is_paid)
    await store.fetchOrders()
    await store.fetchSummary()
  } catch (error) {
    handleError(error)
  }
}

async function markDateRangePaid() {
  if (!canBulkMarkPaid.value) {
    markPaidDialog.value = false
    return
  }
  bulkUpdating.value = true
  try {
    const result = await store.markOrdersPaid({
      start_date: dateFilters.start,
      end_date: dateFilters.end,
      is_paid: true,
    })
    snackbarMessage.value = `อัปเดตสถานะชำระเงิน ${result.updated} รายการแล้ว`
    snackbar.value = true
    markPaidDialog.value = false
  } catch (error) {
    handleError(error)
  } finally {
    bulkUpdating.value = false
  }
}

async function submitEdit() {
  if (!editOrderId.value) return
  const menuMeta = menuLookup.value[editForm.menu_item_id]
  if (!menuMeta) {
    errorMessage.value = 'เลือกเมนูจากรายการที่มี'
    return
  }
  const payload = {
    customer_name: editForm.customer_name,
    menu_item_id: editForm.menu_item_id,
    menu_item_name: menuMeta.name,
    quantity: editForm.quantity,
    price: editForm.price,
    note: editForm.note,
    order_date: editForm.order_date,
    is_paid: editForm.is_paid,
  }
  formSubmitting.value = true
  try {
    await store.updateOrder(editOrderId.value, payload)
    snackbarMessage.value = 'แก้ไขออเดอร์แล้ว'
    snackbar.value = true
    await Promise.all([store.fetchOrders(), store.fetchSummary()])
    resetEditForm()
  } catch (error) {
    handleError(error)
  } finally {
    formSubmitting.value = false
  }
}

async function downloadCsv() {
  exporting.value = true
  try {
    const blob = await store.exportCsv()
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.setAttribute('download', 'orders.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    handleError(error)
  } finally {
    exporting.value = false
  }
}

function handleError(error: unknown) {
  console.error(error)
  errorMessage.value = 'เกิดข้อผิดพลาด โปรดลองอีกครั้ง'
}

function formatDateOnly(value: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
  }).format(new Date(`${value}T00:00:00`))
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount || 0)
}

function formatDate(value: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function createEmptyBaseForm(): BaseForm {
  return {
    customer_name: '',
    note: '',
    order_date: today(),
    is_paid: false,
  }
}

function createEmptyItemForm(): ItemForm {
  return {
    menu_item_id: '',
    menu_item_name: '',
    quantity: 1,
    price: 0,
  }
}

function today() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
}

function buildPayload(menuMeta: MenuOption) {
  return {
    customer_name: baseForm.customer_name,
    menu_item_id: itemForm.menu_item_id,
    menu_item_name: menuMeta.name,
    quantity: itemForm.quantity,
    price: itemForm.price,
    note: baseForm.note,
    order_date: baseForm.order_date,
    is_paid: baseForm.is_paid,
  }
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
</script>

<style scoped>
.stat-card {
  padding: 16px;
}
</style>

