<template>
  <div class="data-dashboard">
    <div class="dashboard-grid">
      <!-- 城市人口统计 -->
      <div class="chart-card">
        <h3 class="chart-title">城市人口增长趋势</h3>
        <div ref="populationChartRef" class="chart-container"></div>
      </div>

      <!-- 经济发展指标 -->
      <div class="chart-card">
        <h3 class="chart-title">GDP增长率</h3>
        <div ref="gdpChartRef" class="chart-container"></div>
      </div>

      <!-- 产业分布 -->
      <div class="chart-card chart-large">
        <h3 class="chart-title">产业结构分布</h3>
        <div ref="industryChartRef" class="chart-container"></div>
      </div>

      <!-- 创新指标 -->
      <div class="chart-card">
        <h3 class="chart-title">科技创新指数</h3>
        <div ref="innovationChartRef" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'

const populationChartRef = ref<HTMLElement>()
const gdpChartRef = ref<HTMLElement>()
const industryChartRef = ref<HTMLElement>()
const innovationChartRef = ref<HTMLElement>()

let charts: echarts.ECharts[] = []
let isInitialized = false

onMounted(() => {
  // 立即初始化图表，使用固定尺寸避免 display:none 导致的零尺寸问题
  initCharts()
})

onUnmounted(() => {
  disposeCharts()
})

function disposeCharts() {
  charts.forEach(chart => chart.dispose())
  charts = []
  isInitialized = false
  window.removeEventListener('resize', handleResize)
}

function handleResize() {
  charts.forEach(chart => chart.resize())
}

// 初始化图表 - 现在支持在隐藏状态下初始化
function initCharts() {
  if (isInitialized) {
    // 如果已经初始化，只触发 resize
    handleResize()
    return
  }

  // 使用 nextTick 确保 DOM 完全渲染后再初始化图表
  nextTick(() => {
    // 使用 requestAnimationFrame 确保 CSS 已应用
    requestAnimationFrame(() => {
      createCharts()
      // 初始化后立即触发一次 resize，确保图表正确渲染
      setTimeout(() => {
        charts.forEach(chart => chart.resize())
      }, 100)
    })
  })
  window.addEventListener('resize', handleResize)
  isInitialized = true
}

function createCharts() {
  // 通用浅色主题配置
  const commonOption = {
    backgroundColor: 'transparent',
    textStyle: {
      color: '#303133',
      fontFamily: 'Microsoft YaHei, sans-serif'
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: 'rgba(102, 126, 234, 0.3)',
      textStyle: {
        color: '#303133'
      },
      padding: [12, 16],
      borderWidth: 1,
      extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);'
    }
  }

  // 人口增长趋势图
  if (populationChartRef.value) {
    const chart = echarts.init(populationChartRef.value)
    chart.setOption({
      ...commonOption,
      tooltip: {
        ...commonOption.tooltip,
        trigger: 'axis'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'],
        axisLine: {
          lineStyle: { color: '#dcdfe6' }
        },
        axisLabel: {
          color: '#606266',
          fontSize: 12
        }
      },
      yAxis: {
        type: 'value',
        name: '人口（万人）',
        nameTextStyle: {
          color: '#606266',
          fontSize: 12
        },
        axisLine: {
          lineStyle: { color: '#dcdfe6' }
        },
        axisLabel: {
          color: '#606266',
          fontSize: 12
        },
        splitLine: {
          lineStyle: {
            color: '#ebeef5',
            type: 'dashed'
          }
        }
      },
      series: [{
        name: '常住人口',
        type: 'line',
        data: [850, 865, 882, 900, 920, 942, 965, 988, 1012, 1038, 1065],
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ])
        },
        itemStyle: {
          color: '#667eea',
          borderWidth: 2,
          borderColor: '#fff'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102, 126, 234, 0.4)' },
            { offset: 1, color: 'rgba(118, 75, 162, 0.05)' }
          ])
        }
      }]
    })
    charts.push(chart)
  }

  // GDP增长率图
  if (gdpChartRef.value) {
    const chart = echarts.init(gdpChartRef.value)
    chart.setOption({
      ...commonOption,
      tooltip: {
        ...commonOption.tooltip,
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: 'rgba(102, 126, 234, 0.2)'
          }
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'],
        axisLine: {
          lineStyle: { color: '#dcdfe6' }
        },
        axisLabel: {
          color: '#606266',
          fontSize: 12
        }
      },
      yAxis: {
        type: 'value',
        name: '增长率(%)',
        nameTextStyle: {
          color: '#606266',
          fontSize: 12
        },
        axisLine: {
          lineStyle: { color: '#dcdfe6' }
        },
        axisLabel: {
          color: '#606266',
          fontSize: 12
        },
        splitLine: {
          lineStyle: {
            color: '#ebeef5',
            type: 'dashed'
          }
        }
      },
      series: [{
        name: 'GDP增长率',
        type: 'bar',
        data: [7.8, 7.5, 3.2, 8.1, 7.9, 8.3, 8.5, 8.7],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ]),
          borderRadius: [8, 8, 0, 0]
        },
        barWidth: '50%',
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#764ba2' },
              { offset: 1, color: '#667eea' }
            ])
          }
        }
      }]
    })
    charts.push(chart)
  }

  // 产业结构分布图
  if (industryChartRef.value) {
    const chart = echarts.init(industryChartRef.value)
    chart.setOption({
      ...commonOption,
      tooltip: {
        ...commonOption.tooltip,
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c}% ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: {
          color: '#606266',
          fontSize: 13
        },
        icon: 'circle'
      },
      series: [{
        name: '产业结构',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 24,
            fontWeight: 'bold',
            color: '#303133'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          {
            value: 35,
            name: '信息技术',
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#667eea' },
                { offset: 1, color: '#764ba2' }
              ])
            }
          },
          {
            value: 28,
            name: '高端制造',
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#f093fb' },
                { offset: 1, color: '#f5576c' }
              ])
            }
          },
          {
            value: 18,
            name: '金融服务',
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#4facfe' },
                { offset: 1, color: '#00f2fe' }
              ])
            }
          },
          {
            value: 12,
            name: '生物医药',
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#43e97b' },
                { offset: 1, color: '#38f9d7' }
              ])
            }
          },
          {
            value: 7,
            name: '其他',
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#fa709a' },
                { offset: 1, color: '#fee140' }
              ])
            }
          }
        ]
      }]
    })
    charts.push(chart)
  }

  // 科技创新指数雷达图
  if (innovationChartRef.value) {
    const chart = echarts.init(innovationChartRef.value)
    chart.setOption({
      ...commonOption,
      radar: {
        indicator: [
          { name: '研发投入', max: 100 },
          { name: '专利数量', max: 100 },
          { name: '高新企业', max: 100 },
          { name: '人才密度', max: 100 },
          { name: '创新成果', max: 100 }
        ],
        radius: 65,
        center: ['50%', '55%'],
        axisName: {
          color: '#606266',
          fontSize: 13,
          fontWeight: 500
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(102, 126, 234, 0.08)', 'rgba(102, 126, 234, 0.03)']
          }
        },
        axisLine: {
          lineStyle: {
            color: '#dcdfe6'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#ebeef5'
          }
        }
      },
      series: [{
        name: '创新指标',
        type: 'radar',
        data: [{
          value: [85, 92, 78, 88, 82],
          name: '本市',
          symbol: 'circle',
          symbolSize: 8,
          areaStyle: {
            color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
              { offset: 0, color: 'rgba(102, 126, 234, 0.5)' },
              { offset: 1, color: 'rgba(102, 126, 234, 0.1)' }
            ])
          },
          lineStyle: {
            color: '#667eea',
            width: 3
          },
          itemStyle: {
            color: '#667eea',
            borderWidth: 2,
            borderColor: '#fff'
          }
        }, {
          value: [70, 75, 65, 72, 68],
          name: '全国平均',
          symbol: 'circle',
          symbolSize: 8,
          areaStyle: {
            color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
              { offset: 0, color: 'rgba(118, 75, 162, 0.4)' },
              { offset: 1, color: 'rgba(118, 75, 162, 0.08)' }
            ])
          },
          lineStyle: {
            color: '#764ba2',
            width: 3
          },
          itemStyle: {
            color: '#764ba2',
            borderWidth: 2,
            borderColor: '#fff'
          }
        }],
        legend: {
          data: ['本市', '全国平均'],
          top: 0,
          textStyle: {
            color: '#606266',
            fontSize: 13
          }
        }
      }]
    })
    charts.push(chart)
  }
}

// 暴露方法给父组件
defineExpose({
  initCharts
})
</script>

<style scoped>
.data-dashboard {
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  border-radius: 12px;
  padding: 20px;
  overflow-y: auto;
  min-height: 500px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  min-height: 500px;
}

.chart-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  min-height: 380px;
  display: flex;
  flex-direction: column;
}

.chart-card:hover {
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.chart-large {
  grid-column: 1 / -1;
}

.chart-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.chart-title::before {
  content: '';
  width: 4px;
  height: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.chart-container {
  width: 100%;
  height: 300px;
  flex: 1;
  min-height: 300px;
}

.chart-large .chart-container {
  height: 400px;
  min-height: 400px;
}

/* 滚动条样式 */
.data-dashboard::-webkit-scrollbar {
  width: 8px;
}

.data-dashboard::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 4px;
}

.data-dashboard::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
}

.data-dashboard::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}
</style>
