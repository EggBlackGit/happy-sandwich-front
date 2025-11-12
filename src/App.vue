<template>
  <v-app>
    <v-app-bar color="primary" density="comfortable" flat>
      <v-app-bar-title class="text-white font-weight-bold">
        Happy Sandwich Orders
      </v-app-bar-title>
      <div class="d-none d-md-flex">
        <v-btn
          v-for="item in navItems"
          :key="item.to"
          variant="text"
          class="text-white text-none font-weight-medium"
          :to="item.to"
        >
          <v-icon start>{{ item.icon }}</v-icon>
          {{ item.label }}
        </v-btn>
      </div>
      <v-menu class="d-md-none">
        <template #activator="{ props }">
          <v-btn icon variant="text" v-bind="props">
            <v-icon class="text-white">mdi-menu</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            link
          >
            <v-list-item-title>{{ item.label }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-spacer />
      <v-btn icon variant="tonal" color="white" @click="openAccessDialog">
        <v-icon>mdi-lock</v-icon>
      </v-btn>
      <v-btn icon variant="tonal" color="white" :loading="isRefreshing" @click="safeRefresh">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>

    <v-dialog v-model="showAccessDialog" max-width="420" persistent>
      <v-card>
        <v-card-title class="text-h6">กรอกรหัสเข้าระบบ</v-card-title>
        <v-card-text>
          <p class="mb-4">
            ป้อนรหัสที่ตั้งไว้ในฝั่งเซิร์ฟเวอร์ (ACCESS_KEY) เพื่อใช้งานระบบต่อ
          </p>
          <v-text-field
            v-model="accessFormKey"
            label="Access Key"
            type="password"
            autofocus
          />
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" @click="clearAccessKey">ลบค่า</v-btn>
          <v-spacer />
          <v-btn color="primary" :loading="savingAccessKey" @click="saveAccessKey">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useOrdersStore } from './composables/useOrdersStore'

const store = useOrdersStore()

const showAccessDialog = ref(false)
const accessFormKey = ref(localStorage.getItem('hs-access-key') || '')
const savingAccessKey = ref(false)
const isRefreshing = computed(
  () =>
    store.loading.orders ||
    store.loading.summary ||
    store.loading.options ||
    store.loading.menu,
)

const navItems = [
  { label: 'จัดการออเดอร์', to: '/', icon: 'mdi-clipboard-list' },
  { label: 'ภาพรวม', to: '/overview', icon: 'mdi-chart-box' },
  { label: 'จัดการเมนู', to: '/menu', icon: 'mdi-food' },
]

onMounted(() => {
  store.refreshAll().catch(() => {
    showAccessDialog.value = true
  })
})

watch(
  () => store.unauthorized.value,
  (unauthorized) => {
    if (unauthorized) {
      showAccessDialog.value = true
    }
  },
)

function openAccessDialog() {
  showAccessDialog.value = true
  accessFormKey.value = localStorage.getItem('hs-access-key') || ''
}

async function saveAccessKey() {
  savingAccessKey.value = true
  try {
    store.setAccessKey(accessFormKey.value.trim())
    showAccessDialog.value = false
    await store.refreshAll()
  } catch (error) {
    console.error(error)
  } finally {
    savingAccessKey.value = false
  }
}

function clearAccessKey() {
  accessFormKey.value = ''
  store.setAccessKey('')
}

function safeRefresh() {
  store.refreshAll().catch((error) => {
    console.error(error)
    showAccessDialog.value = true
  })
}
</script>
