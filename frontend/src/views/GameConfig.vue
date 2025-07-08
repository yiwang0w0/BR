<template>
  <el-card>
    <h2>游戏配置</h2>
    <p>你已加入房间 {{ roomId }} ，请在下方选择初始设置。</p>
    <el-form :model="form" label-width="80px">
      <el-form-item label="昵称">
        <el-input v-model="form.nickname" />
      </el-form-item>
      <el-form-item label="性别">
        <el-radio-group v-model="form.gender">
          <el-radio label="m">男</el-radio>
          <el-radio label="f">女</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <el-button type="primary" @click="startGame">开始游戏</el-button>
  </el-card>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const roomId = computed(() => route.params.id)

const form = reactive({ nickname: '', gender: 'm' })

function startGame() {
  router.push(`/room/${roomId.value}`)
}
</script>
