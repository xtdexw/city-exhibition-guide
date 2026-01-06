<template>
  <div class="settings">
    <div class="header">
      <h1>系统设置</h1>
      <el-button @click="router.push('/')">返回主页</el-button>
    </div>

    <el-card class="config-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>🔑 API密钥配置</span>
          <el-tag v-if="configStore.isTestMode" type="warning" effect="dark">
            测试模式
          </el-tag>
          <el-tag v-else-if="configStore.hasKeys" type="success" effect="dark">
            已配置
          </el-tag>
          <el-tag v-else type="info" effect="dark">
            未配置
          </el-tag>
        </div>
      </template>

      <!-- 密钥状态显示 -->
      <div class="key-status">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="星云 App ID">
            {{ configStore.keys?.xingyunAppId || '未配置' }}
          </el-descriptions-item>
          <el-descriptions-item label="星云 App Secret">
            {{ configStore.keys?.xingyunAppSecret ? '********' : '未配置' }}
          </el-descriptions-item>
          <el-descriptions-item label="魔搭 API Key">
            {{ configStore.keys?.modelscopeApiKey ? '********' : '未配置' }}
          </el-descriptions-item>
          <el-descriptions-item label="模式">
            {{ configStore.isTestMode ? '测试模式' : '正式模式' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <el-button type="primary" @click="showKeyDialog = true">
          {{ configStore.hasKeys ? '修改密钥' : '配置密钥' }}
        </el-button>
        <el-button
          type="warning"
          @click="handleUseTestKeys"
        >
          使用测试密钥
        </el-button>
        <el-button
          v-if="configStore.hasKeys"
          type="danger"
          @click="handleClearKeys"
        >
          清除密钥
        </el-button>
      </div>
    </el-card>

    <el-card class="info-card" shadow="hover">
      <template #header>
        <span>📖 使用说明</span>
      </template>

      <div class="info-content">
        <h3>密钥获取方式</h3>
        <ul>
          <li>
            <strong>星云密钥</strong>：访问 <a href="https://xingyun3d.com" target="_blank">魔珐星云官网</a>，
            创建应用后获取App ID和App Secret
          </li>
          <li>
            <strong>魔搭API Key</strong>：访问 <a href="https://modelscope.cn" target="_blank">魔搭社区</a>，
            在个人中心获取API Token
          </li>
        </ul>

        <el-alert
          title="注意"
          type="warning"
          :closable="false"
          show-icon
          style="margin-top: 20px"
        >
          <ul style="margin: 10px 0 0 20px; padding: 0;">
            <li>测试密钥仅供开发调试使用</li>
            <li>生产环境请使用正式密钥</li>
            <li>密钥将安全存储在浏览器localStorage中</li>
          </ul>
        </el-alert>
      </div>
    </el-card>

    <!-- 密钥输入对话框 -->
    <KeyInputDialog
      v-model="showKeyDialog"
      @success="handleKeySuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useConfigStore } from '@/stores/config'
import KeyInputDialog from '@/components/avatar/KeyInputDialog.vue'

const router = useRouter()
const configStore = useConfigStore()
const showKeyDialog = ref(false)

// 使用测试密钥
function handleUseTestKeys() {
  configStore.useTestKeys()
  ElMessage.success('已切换到测试模式')
}

// 清除密钥
async function handleClearKeys() {
  try {
    await ElMessageBox.confirm(
      '确定要清除所有密钥配置吗？清除后需要重新配置才能使用。',
      '确认清除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    configStore.clearKeys()
    ElMessage.success('密钥已清除')
  } catch {
    // 用户取消
  }
}

// 密钥配置成功回调
function handleKeySuccess() {
  ElMessage.success('密钥配置成功！')
}
</script>

<style scoped>
.settings {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  color: #303133;
}

.config-card,
.info-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: bold;
}

.key-status {
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.info-content h3 {
  margin-top: 0;
  color: #303133;
}

.info-content ul {
  margin: 10px 0;
  padding-left: 20px;
}

.info-content li {
  margin: 10px 0;
  line-height: 1.6;
  color: #606266;
}

.info-content a {
  color: #409eff;
  text-decoration: none;
}

.info-content a:hover {
  text-decoration: underline;
}
</style>
