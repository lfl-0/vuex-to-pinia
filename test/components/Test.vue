<script>
import useStore from '@/store'

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
