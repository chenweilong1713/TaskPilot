<template>
  <div class="h-64">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from 'chart.js'
import { Line } from 'vue-chartjs'
import type { TrendPoint } from '~/types/task'

const props = defineProps<{
  points: TrendPoint[]
}>()

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const chartData = computed(() => ({
  labels: props.points.map((point) => point.date.slice(5)),
  datasets: [
    {
      label: '已完成任务',
      data: props.points.map((point) => point.completed),
      borderColor: '#e76f51',
      backgroundColor: 'rgba(231, 111, 81, 0.14)',
      fill: true,
      tension: 0.38,
      pointRadius: 4,
      pointBackgroundColor: '#e76f51'
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0
      }
    }
  }
}
</script>
