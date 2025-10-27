<template>
  <div>
    <h2>یادداشت‌ها</h2>
    <input v-model="newNote" placeholder="یادداشت جدید..." />
    <button @click="addNote">افزودن</button>
    <ul>
      <li v-for="(note, index) in notes" :key="index">
        {{ note }}
        <button @click="removeNote(index)">❌</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const newNote = ref('');
const notes = ref([]);

onMounted(() => {
  const saved = localStorage.getItem('notes');
  if (saved) notes.value = JSON.parse(saved);
});

function addNote() {
  if (newNote.value.trim()) {
    notes.value.push(newNote.value);
    newNote.value = '';
    localStorage.setItem('notes', JSON.stringify(notes.value));
  }
}

function removeNote(index) {
  notes.value.splice(index, 1);
  localStorage.setItem('notes', JSON.stringify(notes.value));
}
</script>
