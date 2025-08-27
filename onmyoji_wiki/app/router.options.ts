import type { RouterConfig } from '@nuxt/schema'

// Custom scroll behavior cho Nuxt
export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      // ⬅️ khi back/forward thì dùng lại scroll cũ
      return savedPosition
    } else {
      // ⬅️ khi sang route mới thì cuộn lên đầu
      return { left: 0, top: 0 }
    }
  }
}
