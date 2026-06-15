<template>
  <div class="h-60">
    <Pie :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip
} from 'chart.js'
import { Pie } from 'vue-chartjs'
import type { PiePoint } from '~/types/task'

const props = defineProps<{
  points: PiePoint[]
}>()

ChartJS.register(ArcElement, Tooltip, Legend)

const chartData = computed(() => ({
  labels: props.points.map((point) => point.label),
  datasets: [
    {
      data: props.points.map((point) => point.value),
      backgroundColor: ['#d8c3a5', '#e76f51', '#8ab17d'],
      borderColor: '#ffffff',
      borderWidth: 4
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const
    }
  }
}
</script>
