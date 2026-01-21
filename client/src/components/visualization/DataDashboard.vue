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

      <!-- 发展质量 -->
      <div class="chart-card">
        <h3 class="chart-title">城市发展质量</h3>
        <div ref="qualityChartRef" class="chart-container"></div>
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
const qualityChartRef = ref<HTMLElement>()

let charts: echarts.ECharts[] = []
let isInitialized = false

onMounted(() => {
  // 不在 onMounted 时初始化，等待 activate() 调用
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
  charts.forEach(chart => {
    try {
      chart.resize()
    } catch (e) {
      // 忽略 resize 错误
    }
  })
}

// 初始化图表
function initCharts() {
  if (isInitialized) {
    return
  }

  nextTick(() => {
    requestAnimationFrame(() => {
      createCharts()

      // 初始化后触发 resize
      setTimeout(() => {
        handleResize()
      }, 100)
    })
    window.addEventListener('resize', handleResize)
    isInitialized = true
  })
}

// 公开方法：切换 tab 时调用
function activate() {
  nextTick(() => {
    requestAnimationFrame(() => {
      if (!isInitialized) {
        // 第一次：初始化
        initCharts()
      } else {
        // 后续：检查并重建图表
        let needRecreate = false

        // 检查图表是否有效
        charts.forEach(chart => {
          try {
            chart.resize()
          } catch (e) {
            needRecreate = true
          }
        })

        if (needRecreate || charts.length === 0) {
          // 重建图表
          disposeCharts()
          initCharts()
        } else {
          // 只需 resize
          handleResize()
        }
      }
    })
  })
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

  // 城市发展质量仪表盘图
  if (qualityChartRef.value) {
    const chart = echarts.init(qualityChartRef.value)
    chart.setOption({
      ...commonOption,
      series: [{
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        radius: '80%',
        center: ['50%', '65%'],
        splitNumber: 10,
        axisLine: {
          lineStyle: {
            width: 20,
            color: [
              [0.3, '#ff6b6b'],
              [0.7, '#feca57'],
              [1, '#1dd1a1']
            ]
          }
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '12%',
          width: 20,
          offsetCenter: [0, '-60%'],
          itemStyle: {
            color: 'auto'
          }
        },
        axisTick: {
          length: 12,
          lineStyle: {
            color: 'auto',
            width: 2
          }
        },
        splitLine: {
          length: 20,
          lineStyle: {
            color: 'auto',
            width: 5
          }
        },
        axisLabel: {
          color: '#606266',
          fontSize: 14,
          distance: -60,
          formatter: function (value: number) {
            return value.toFixed(0)
          }
        },
        title: {
          offsetCenter: [0, '20%'],
          fontSize: 20,
          color: '#303133',
          fontWeight: 'bold'
        },
        detail: {
          fontSize: 30,
          offsetCenter: [0, '0%'],
          valueAnimation: true,
          formatter: function (value: number) {
            return Math.round(value) + '分'
          },
          color: '#667eea',
          fontWeight: 'bold'
        },
        data: [{
          value: 85,
          name: '发展质量'
        }]
      }]
    })
    charts.push(chart)
  }
}

// 暴露方法给父组件
defineExpose({
  initCharts,
  activate // 新增：懒加载激活方法
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
