<script setup>
import useStore from '@/store'

const store = useStore()

const a = computed(() => store.state.not.a)

</script>

<template>

</template>

<style scoped>

</style>