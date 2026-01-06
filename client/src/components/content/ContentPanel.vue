<template>
  <div class="content-panel">
    <!-- 分类标签 -->
    <div class="category-tabs">
      <el-button
        v-for="cat in categories"
        :key="cat.key"
        :type="activeCategory === cat.key ? 'primary' : 'default'"
        @click="selectCategory(cat.key)"
        class="category-tab"
      >
        <el-icon>
          <component :is="cat.icon" />
        </el-icon>
        {{ cat.label }}
      </el-button>
    </div>

    <!-- 内容列表 -->
    <div class="content-list">
      <div
        v-for="item in filteredContents"
        :key="item.id"
        class="content-card"
        @click="selectContent(item)"
      >
        <div class="content-header">
          <h3 class="content-title">{{ item.title }}</h3>
          <el-tag :type="getDifficultyType(item.difficulty)" size="small">
            {{ getDifficultyLabel(item.difficulty) }}
          </el-tag>
        </div>
        <p class="content-summary">{{ item.summary }}</p>
        <div class="content-tags">
          <el-tag
            v-for="tag in item.tags"
            :key="tag"
            size="small"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 内容详情弹窗 -->
    <el-dialog
      v-model="showDetail"
      :title="selectedContent?.title"
      width="600px"
      class="content-dialog"
    >
      <div v-if="selectedContent" class="content-detail">
        <div class="detail-meta">
          <el-tag :type="getDifficultyType(selectedContent.difficulty)">
            {{ getDifficultyLabel(selectedContent.difficulty) }}
          </el-tag>
          <el-tag type="info">{{ getCategoryLabel(selectedContent.category) }}</el-tag>
        </div>
        <p class="detail-summary">{{ selectedContent.summary }}</p>
        <div class="detail-content">
          {{ selectedContent.content }}
        </div>
        <div class="detail-tags">
          <el-tag
            v-for="tag in selectedContent.tags"
            :key="tag"
            size="small"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <el-button type="primary" @click="playContent">
          <el-icon><VideoPlay /></el-icon>
          <span style="margin-left: 4px">讲解此内容</span>
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import * as ElementPlusIcons from '@element-plus/icons-vue'
import { contentService } from '@/services/ContentService'
import type { ContentItem } from '@/types/content'
import { ElMessage } from 'element-plus'

const { VideoPlay } = ElementPlusIcons

const emit = defineEmits<{
  playContent: [content: ContentItem]
}>()

interface Category {
  key: string
  label: string
  icon: any
}

const categories: Category[] = [
  { key: 'all', label: '全部', icon: ElementPlusIcons.Grid },
  { key: 'history', label: '历史', icon: ElementPlusIcons.Clock },
  { key: 'culture', label: '文化', icon: ElementPlusIcons.Star },
  { key: 'planning', label: '规划', icon: ElementPlusIcons.MapLocation },
  { key: 'landmark', label: '地标', icon: ElementPlusIcons.Location },
  { key: 'economy', label: '经济', icon: ElementPlusIcons.TrendCharts },
  { key: 'technology', label: '科技', icon: ElementPlusIcons.Cpu }
]

const activeCategory = ref('all')
const showDetail = ref(false)
const selectedContent = ref<ContentItem>()

const filteredContents = computed(() => {
  if (activeCategory.value === 'all') {
    return contentService.getAllContents()
  }
  return contentService.getContentByCategory(activeCategory.value)
})

function selectCategory(key: string) {
  activeCategory.value = key
}

function selectContent(item: ContentItem) {
  selectedContent.value = item
  showDetail.value = true
}

function playContent() {
  if (selectedContent.value) {
    emit('playContent', selectedContent.value)
    showDetail.value = false
  }
}

function getDifficultyType(difficulty: string) {
  const types = {
    basic: 'success',
    medium: 'warning',
    advanced: 'danger'
  }
  return types[difficulty as keyof typeof types] || 'info'
}

function getDifficultyLabel(difficulty: string) {
  const labels = {
    basic: '基础',
    medium: '中等',
    advanced: '进阶'
  }
  return labels[difficulty as keyof typeof labels] || difficulty
}

function getCategoryLabel(category: string) {
  const cat = categories.find(c => c.key === category)
  return cat?.label || category
}
</script>

<style scoped>
.content-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.category-tabs {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
  overflow-x: auto;
}

.category-tab {
  flex-shrink: 0;
}

.content-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f8f9fa;
}

.content-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.content-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.content-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.content-summary {
  margin: 8px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.content-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag-item {
  margin: 0;
}

.content-detail .detail-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.detail-summary {
  font-size: 16px;
  color: #666;
  line-height: 1.8;
  margin-bottom: 16px;
  padding: 12px;
  background: #F0F5FF;
  border-radius: 8px;
}

.detail-content {
  font-size: 15px;
  color: #333;
  line-height: 2;
  white-space: pre-wrap;
  margin-bottom: 16px;
}

.detail-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
