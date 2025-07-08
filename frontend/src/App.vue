<script setup>
import { RouterView, RouterLink } from 'vue-router'
import { useAuthStore } from './stores/auth'
const auth = useAuthStore()
</script>

<template>
  <div>
    <nav style="margin-bottom:20px;">
      <RouterLink to="/" style="margin-right: 15px;">首页</RouterLink>
      <RouterLink v-if="auth.isLoggedIn()" to="/rooms" style="margin-right: 15px;">房间大厅</RouterLink>
      <RouterLink v-if="auth.isLoggedIn()" to="/user" style="margin-right: 15px;">个人中心</RouterLink>
      <RouterLink to="/messages" style="margin-right: 15px;">消息</RouterLink>
      <RouterLink to="/history" style="margin-right: 15px;">历史对局</RouterLink>
    </nav>
    <RouterView />
  </div>
</template>

<style scoped>
nav {
  padding: 20px 0;
  font-size: 18px;
}
a {
  text-decoration: none;
  color: #42b983;
  margin-right: 20px;
}
a.router-link-exact-active {
  font-weight: bold;
  color: #333;
}
</style>
