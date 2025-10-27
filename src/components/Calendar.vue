<template>
  <div>
    <h2>تقویم ساده</h2>
    <input type="date" v-model="selectedDate" />
    <input v-model="eventText" placeholder="رویداد..." />
    <button @click="saveEvent">ذخیره</button>

    <div v-if="events[selectedDate]">
      <p>رویداد: {{ events[selectedDate] }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const selectedDate = ref('');
const eventText = ref('');
const events = ref({});

onMounted(() => {
  const saved = localStorage.getItem('events');
  if (saved) events.value = JSON.parse(saved);
});

function saveEvent() {
  if (selectedDate.value && eventText.value.trim()) {
    events.value[selectedDate.value] = eventText.value;
    localStorage.setItem('events', JSON.stringify(events.value));
    eventText.value = '';
  }
}
</script>
