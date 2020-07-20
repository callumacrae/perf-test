<template>
  <textarea
    class="rounded-sm border border-gray-300 px-3 py-2 w-full h-40"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
  ></textarea>
</template>

<script lang="ts">
export default {
  props: ['modelValue']
};
</script>
