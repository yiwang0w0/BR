<template>
  <el-tabs v-model="active">
    <el-tab-pane label="收件箱" name="inbox">
      <!-- TODO: 展示收件箱列表 -->
      <p>这里显示收件箱内容</p>
    </el-tab-pane>
    <el-tab-pane label="发件箱" name="outbox">
      <!-- TODO: 展示发件箱列表 -->
      <p>这里显示发件箱内容</p>
    </el-tab-pane>
  </el-tabs>
</template>

<script setup>
import { ref } from 'vue'

const active = ref('inbox')
</script>
