<template>
  <div class="container">
    <h1>
      تقویم فارسی
    </h1>

    <div class="calendar-wrapper">
      <div class="calendar-base">
        <div class="year-wrapper">
          <template v-for="(meta, index) in metaYear.metaYear" :key="index">
            <div
                :class="[
                'year',
                'yr-' + (index + 1),
                'dynamic-element',
                'dynamic-element-' + (index + 1),
                { 'active-element': activeMonth === (index + 1) }
              ]"
            >
              {{ metaYear.year }}
            </div>
            <div
                :class="[
                'year-meta',
                'myr-' + (index + 1),
                'dynamic-element',
                'dynamic-element-' + (index + 1),
                { 'active-element': activeMonth === (index + 1) }
              ]"
                v-html="formatMetaYear(meta)"
            ></div>
          </template>
        </div>

        <div class="months-container">
        <div class="months">
          <span
              v-for="(month, index) in monthLabels"
              :key="index"
              :class="[
              'month-hover',
              'month-letter',
              'month-letter-' + (index + 1),
              { 'active-season-cr': activeMonth === (index + 1) }
            ]"
              :data-num="index + 1"
              @click="changeMonth(index + 1)"
          >
            {{ month }}
          </span>
        </div>
        </div>

        <hr class="month-line"/>

        <div class="days">
          <ul class="weeks">
            <li v-for="day in weekDays" :key="day">{{ day }}</li>
            <div class="clearfix"></div>
          </ul>
        </div>

        <div class="num-dates">
          <template v-for="(week, weekIndex) in currentMonthWeeks" :key="weekIndex">
            <ul
                :class="[
          'week',
          'wk-' + activeMonth + '-' + (weekIndex + 1),
          'month-' + activeMonth,
          'dynamic-element',
          'dynamic-element-' + activeMonth,
          { 'active-element': true }
        ]"
            >
              <li
                  v-for="(day, dayIndex) in week"
                  :key="dayIndex"
                  :class="getDayClasses(day)"
                  @click="selectDay(day)"
                  :title="hasNote(day) ? getNotePreview(day) : ''"
              >
                <span id="jalali">{{ convertDigits(day[0], 'fa') }}</span>
                <small id="miladi">{{ day[1] }}</small>
                <small id="ghamari">{{ convertDigits(day[2], 'ar') }}</small>

                <!-- آیکون یادداشت -->
                <span v-if="hasNote(day)" class="note-indicator">📝</span>
              </li>
              <div class="clearfix"></div>
            </ul>
          </template>
        </div>
      </div>

      <div class="calendar-left active-season">
        <div class="num-date">{{ convertDigits(todayFa.day, 'fa') }}</div>
        <div class="day">{{ convertDigits(todayFa.dayWeek, 'fa') }}</div>

        <ul
            :class="[
            'events-list',
            'event-list-' + activeMonth,
            'dynamic-element',
            'dynamic-element-' + activeMonth,
            { 'active-element': true }
          ]"
        >
          <li
              v-for="(event, eventIndex) in currentMonthEvents"
              :key="eventIndex"
          >
            <span class="event-day">{{ convertDigits(event.day, 'fa') }} </span>
            <div class="event-title">{{ event.eventTitle }}</div>
            <span class="event-date-type"> {{ event.date }}</span>
          </li>
          <li v-if="currentMonthEvents.length === 0">
            <div class="event-title">هیچ رویدادی برای این ماه وجود ندارد</div>
          </li>
        </ul>
      </div>
    </div>
    <div class="clearfix"></div>


    <!-- مودال یادداشت -->
    <div v-if="showNoteModal" class="note-modal-overlay" @click="showNoteModal = false">
      <div class="note-modal" @click.stop>
        <div class="note-modal-header">
          <h3>یادداشت برای روز {{ convertDigits(selectedDay[0], 'fa') }} {{ monthLabels[activeMonth - 1] }}</h3>
          <button class="close-btn" @click="showNoteModal = false">×</button>
        </div>

        <div class="note-modal-body">
          <textarea
              v-model="noteText"
              placeholder="یادداشت خود را اینجا بنویسید..."
              rows="6"
              class="note-textarea"
          ></textarea>
        </div>

        <div class="note-modal-footer">
          <button
              v-if="hasNote(selectedDay)"
              @click="deleteNote"
              class="btn btn-danger"
          >
            حذف یادداشت
          </button>
          <button @click="saveNote" class="btn btn-primary">
            ذخیره
          </button>
          <button @click="showNoteModal = false" class="btn btn-secondary">
            انصراف
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useCalendar } from './Calendar'

export default {
  name: 'Calendar',
  setup() {
    const calendar = useCalendar()

    return {
      ...calendar
    }
  }
}
</script>

<style scoped src="./Calendar.css"></style>