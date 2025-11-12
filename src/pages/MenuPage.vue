<template>
  <v-container class="py-6" style="max-width: 1100px;">
    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="errorMessage = ''"
    >
      {{ errorMessage }}
    </v-alert>

    <v-card elevation="2">
      <v-card-title class="d-flex flex-wrap align-center ga-4">
        <span class="text-h6 font-weight-bold">จัดการเมนู</span>
        <v-spacer />
        <v-btn color="primary" @click="openCreateDialog">
          <v-icon start>mdi-plus</v-icon>
          เพิ่มเมนูใหม่
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="tableItems"
          :loading="store.loading.menu"
          item-key="id"
          density="comfortable"
          class="elevation-0"
        >
          <template v-slot:item.default_price="{ value }">
            {{ formatCurrency(value as number) }}
          </template>
          <template v-slot:item.is_active="{ item }">
            <v-chip :color="item.is_active ? 'success' : 'grey'" size="small" variant="tonal">
              {{ item.is_active ? 'เปิดขาย' : 'ปิดชั่วคราว' }}
            </v-chip>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn icon variant="text" color="primary" @click="openEditDialog(item)">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon variant="text" color="error" @click="confirmDelete(item)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
          <template #no-data>
            <div class="text-center text-grey py-8">ยังไม่มีเมนูในระบบ</div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="520">
      <v-card>
        <v-card-title class="text-h6">
          {{ editingItem ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่' }}
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="saveMenuItem">
            <v-text-field
              v-model="form.name"
              label="ชื่อเมนู"
              :rules="[requiredRule]"
              density="comfortable"
              required
            />
            <v-text-field
              v-model="form.slug"
              label="รหัส (ไม่ระบุจะสร้างให้อัตโนมัติ)"
              hint="ใช้ a-z/0-9 และขีดกลาง"
              density="comfortable"
              clearable
            />
            <v-text-field
              v-model.number="form.default_price"
              label="ราคาเริ่มต้น"
              type="number"
              min="0"
              density="comfortable"
              prefix="฿"
              :rules="[priceRule]"
            />
            <v-textarea
              v-model="form.description"
              label="รายละเอียดเพิ่มเติม"
              rows="2"
              auto-grow
            />
            <v-switch v-model="form.is_active" label="เปิดขาย" color="success" inset />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">ยกเลิก</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveMenuItem">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title class="text-h6">ลบเมนู</v-card-title>
        <v-card-text>
          ต้องการลบเมนู <strong>{{ itemToDelete?.name }}</strong> ใช่ไหม?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">ยกเลิก</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteMenu">ลบ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useOrdersStore } from '../composables/useOrdersStore'
import type { MenuItemPayload, MenuItemRecord } from '../types/orders'

const store = useOrdersStore()
const tableItems = computed(() => store.menuItems.value)

const headers = [
  { title: 'ชื่อเมนู', key: 'name', sortable: false },
  { title: 'รหัส', key: 'slug', sortable: false },
  { title: 'ราคาเริ่มต้น', key: 'default_price', sortable: false },
  { title: 'สถานะ', key: 'is_active', sortable: false },
  { title: 'จัดการ', key: 'actions', sortable: false },
]

const dialog = ref(false)
const deleteDialog = ref(false)
const editingItem = ref<MenuItemRecord | null>(null)
const itemToDelete = ref<MenuItemRecord | null>(null)
const saving = ref(false)
const deleting = ref(false)
const errorMessage = ref('')

const form = reactive<MenuItemPayload>(createEmptyForm())

const requiredRule = (value: string | null) => (!!value && value.trim().length > 0) || 'กรอกข้อมูล'
const priceRule = (value: number | null) => (value ?? 0) >= 0 || 'ต้องมากกว่าหรือเท่ากับ 0'

function openCreateDialog() {
  editingItem.value = null
  Object.assign(form, createEmptyForm())
  dialog.value = true
}

function openEditDialog(item: MenuItemRecord) {
  editingItem.value = item
  Object.assign(form, {
    name: item.name,
    slug: item.slug,
    default_price: item.default_price,
    is_active: item.is_active,
    description: item.description ?? '',
  })
  dialog.value = true
}

function closeDialog() {
  dialog.value = false
}

async function saveMenuItem() {
  saving.value = true
  try {
    const payload: MenuItemPayload = {
      name: form.name,
      slug: form.slug || undefined,
      default_price: form.default_price,
      is_active: form.is_active,
      description: form.description || undefined,
    }
    if (editingItem.value) {
      await store.updateMenuItem(editingItem.value.id, payload)
    } else {
      await store.createMenuItem(payload)
    }
    dialog.value = false
  } catch (error) {
    console.error(error)
    errorMessage.value = 'บันทึกเมนูไม่สำเร็จ'
  } finally {
    saving.value = false
  }
}

function confirmDelete(item: MenuItemRecord) {
  itemToDelete.value = item
  deleteDialog.value = true
}

async function deleteMenu() {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    await store.deleteMenuItem(itemToDelete.value.id)
    deleteDialog.value = false
  } catch (error) {
    console.error(error)
    errorMessage.value = 'ไม่สามารถลบเมนูนี้ได้'
  } finally {
    deleting.value = false
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value || 0)
}

function createEmptyForm(): MenuItemPayload {
  return {
    name: '',
    slug: '',
    default_price: 0,
    is_active: true,
    description: '',
  }
}
</script>
