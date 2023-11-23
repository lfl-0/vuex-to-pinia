<script setup>
import useStore from '@/store'
import { INIT } from '@/store/app/actionTypes'
import { COMMIT } from '@/store/app/mutationTypes'
import { ALL } from '@/store/test/mutationTypes'

const store = useStore()

const a = computed(() => store.state.app.a)
const ab = computed(() => store.state.app.a.b)
const g1 = computed(() => store.getters['app/a'])

const onA = () => {
  store.commit(`test/${ALL}`)
  store.commit(`test/${ALL}`, c)
  store.commit(`app/${COMMIT}`, a, b)
  store.dispatch(`app/${INIT}`, a, b)
}
</script>

<template></template>

<style scoped></style>
