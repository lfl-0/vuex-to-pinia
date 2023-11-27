<script setup>
import * as actionTypes from '@/store/app/actionTypes'

const store = useStore()

store.dispatch(`app/${actionTypes.INIT}`)

</script>

<template>

</template>

<style scoped>

</style>