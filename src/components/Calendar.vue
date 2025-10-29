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
              >
                <span id="jalali">{{ convertDigits(day[0], 'fa') }}</span>
                <small id="miladi">{{ day[1] }}</small>
                <small id="ghamari">{{ convertDigits(day[2], 'ar') }}</small>
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
  </div>
</template>

<script>
import {ref, computed, onMounted, watch} from 'vue'
import {calendarObject, metaYear, cssProperties} from '../utils/calendarData'
import {dateUtils} from '../utils/dateUtils'

export default {
  name: 'Calendar',
  setup() {
    console.log('Total months in calendar:', calendarObject.length) // برای دیباگ

    const monthLabels = [
      "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
      "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    ]

    const weekDays = ["شنبه", "یکشنبه", "دوشنبه", "سه شنبه", "چهارشنبه", "پنجشنبه", "جمعه"]

    const activeMonth = ref(1)
    const todayFa = ref({
      day: '',
      month: '',
      monthTitle: '',
      year: '',
      dayWeek: ''
    })

    // محاسبه تاریخ امروز
    onMounted(() => {
      const today = Date.now()
      todayFa.value = {
        day: dateUtils.getDateFormat(today, {day: "2-digit"}),
        month: dateUtils.getDateFormat(today, {month: "numeric"}),
        monthTitle: dateUtils.getDateFormat(today, {month: "long"}),
        year: dateUtils.getDateFormat(today, {year: "numeric"}),
        dayWeek: dateUtils.getDateFormat(today, {weekday: "long"}),
      }
      activeMonth.value = parseInt(todayFa.value.month)
      applySeasonStyles()
      console.log('Today:', todayFa.value)
      console.log('Active month:', activeMonth.value)
    })

    // برای دیباگ - اضافه کردن این کد در computed currentMonthWeeks
    const currentMonthWeeks = computed(() => {
      const monthIndex = activeMonth.value - 1
      console.log('Current month index:', monthIndex)

      if (!calendarObject[monthIndex]) {
        console.warn(`No data for month ${activeMonth.value} (index: ${monthIndex})`)
        return []
      }

      const monthData = calendarObject[monthIndex]
      console.log('Sample of first 10 days with day[5] values:')
      monthData.slice(0, 10).forEach((day, index) => {
        console.log(`Day ${index}:`, day[0], 'day[5] =', day[5], 'events:', day[4])
      })

      const weeks = []
      let currentWeek = []

      monthData.forEach((day, index) => {
        currentWeek.push(day)

        if (currentWeek.length === 7 || index === monthData.length - 1) {
          weeks.push([...currentWeek])
          currentWeek = []
        }
      })

      return weeks
    })

    // رویدادهای ماه جاری
    const currentMonthEvents = computed(() => {
      const monthIndex = activeMonth.value - 1
      if (!calendarObject[monthIndex]) return []

      const monthData = calendarObject[monthIndex]
      const events = []
      const currentMonthName = monthLabels[monthIndex]

      monthData.forEach((day) => {
        // بر اساس لاگ‌ها، منطق را معکوس می‌کنیم
        // اگر day[5] === true باشد، احتمالاً روز متعلق به ماه قبلی/بعدی است
        // اگر day[5] === false باشد، روز متعلق به ماه جاری است
        const isDayInCurrentMonth = day[5] === false

        console.log(`Day ${day[0]}: day[5] = ${day[5]}, in current month: ${isDayInCurrentMonth}`) // دیباگ

        // فقط روزهایی که متعلق به این ماه هستند و رویداد دارند
        if (isDayInCurrentMonth && day[4] && day[4].length > 0) {
          day[4].forEach(dayElement => {
            const indexBracket = dayElement.indexOf("[")
            const eventdate = (0 <= indexBracket) ? dayElement.substring(indexBracket) : ""
            const eventTitle = dayElement.replace(eventdate, "")

            events.push({
              day: `${day[0]} ${currentMonthName}`,
              eventTitle: eventTitle,
              date: eventdate,
            })
          })
        }
      })

      return events
    })

    // تغییر ماه
    const changeMonth = (monthNum) => {
      console.log('Changing to month:', monthNum)
      if (activeMonth.value === monthNum) return

      activeMonth.value = monthNum
      applySeasonStyles()
    }

    // انتخاب روز
    const selectDay = (day) => {
      console.log('Selected day:', day)
    }

    // اعمال استایل‌های فصلی
    const applySeasonStyles = () => {
      const season = getSeasonByMonNum(activeMonth.value)
      const cssSeason = getCssBySeason(season)

      let styleElement = document.getElementById('style-cln')
      if (!styleElement) {
        styleElement = document.createElement('style')
        styleElement.id = 'style-cln'
        document.head.appendChild(styleElement)
      }
      styleElement.innerHTML = cssSeason
    }

    // کلاس‌های روز
    const getDayClasses = (day) => {
      const classes = ['day-element']

      // منطق معکوس: day[5] === true → روز غیرفعال (ماه قبلی/بعدی)
      // day[5] === false → روز فعال (ماه جاری)
      if (day[5] === true) {
        classes.push('disable-one')
      } else {
        classes.push(`date-${activeMonth.value}-${convertDigits(day[0], 'en')}`)
      }

      // day[3] = true → روز تعطیل است
      if (day[3] === true) {
        classes.push('holiday')
      }

      // علامت‌گذاری روز جاری - فقط اگر متعلق به این ماه باشد
      if (activeMonth.value === parseInt(todayFa.value.month) &&
          day[0] === todayFa.value.day &&
          day[5] === false) { // فقط اگر متعلق به این ماه باشد
        classes.push('active-season')
      }

      return classes.join(' ')
    }

    // تبدیل ارقام
    const convertDigits = (str, to) => {
      if (typeof str !== 'string') str = String(str)
      return dateUtils.convertDigits(str, to)
    }

    // فرمت‌دهی متای سال
    const formatMetaYear = (meta) => {
      const parts = meta.split(' | ')
      return parts.length === 2 ? `${parts[1]}<br>${parts[0]}` : meta
    }

    // تعیین فصل
    const getSeasonByMonNum = (numMonth) => {
      const monthSeason = ["spring", "summer", "fall", "winter"]

      if (numMonth <= 3) return monthSeason[0]
      else if (numMonth <= 6) return monthSeason[1]
      else if (numMonth <= 9) return monthSeason[2]
      else return monthSeason[3]
    }

    // دریافت CSS فصل
    const getCssBySeason = (season) => {
      const cssObjects = cssProperties[season] || []
      let cssString = ""

      cssObjects.forEach(cssObject => {
        let template = `${cssObject['selector']}{\n`
        cssObject['property'].forEach(property => {
          template += `${property}\n`
        })
        template += "}\n\n"
        cssString += template
      })

      return cssString
    }

    return {
      monthLabels,
      weekDays,
      activeMonth,
      todayFa,
      currentMonthWeeks,
      currentMonthEvents,
      metaYear,
      changeMonth,
      selectDay,
      getDayClasses,
      convertDigits,
      formatMetaYear
    }
  }
}
</script>

<style scoped src="./Calendar.css"></style>