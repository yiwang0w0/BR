<script setup>
import { RouterView, RouterLink } from 'vue-router'
</script>

<template>
  <div>
    <nav style="margin-bottom:20px;">
      <RouterLink to="/rooms" style="margin-right: 15px;">房间大厅</RouterLink>
      <!-- 你可以继续加更多菜单，如注册、登录、个人中心等 -->
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
