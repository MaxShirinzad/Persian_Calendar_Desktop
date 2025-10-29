import {ref, computed, onMounted, watch} from 'vue'
import {calendarObject, metaYear, cssProperties} from '../utils/calendarData'
import {dateUtils} from '../utils/dateUtils'

export const useCalendar = () => {

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

    // انتخاب روز و نمایش مودال یادداشت
    const selectDay = (day) => {
        console.log('Selected day:', day)

        // فقط روزهای متعلق به ماه جاری قابل انتخاب باشند
        if (day[5] === true) return

        selectedDay.value = day
        noteText.value = ''

        // اگر یادداشتی برای این روز وجود دارد، آن را بارگذاری کن
        const noteKey = generateNoteKey(day)
        if (notes.value[noteKey]) {
            noteText.value = notes.value[noteKey]
        }

        showNoteModal.value = true
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

    // state جدید برای مدیریت یادداشت‌ها
    const notes = ref({})
    const selectedDay = ref(null)
    const noteText = ref('')
    const showNoteModal = ref(false)

    // بارگذاری یادداشت‌ها از localStorage هنگام راه‌اندازی
    onMounted(() => {
        // ... کدهای موجود ...

        // بارگذاری یادداشت‌ها از localStorage
        const savedNotes = localStorage.getItem('calendar-notes')
        if (savedNotes) {
            notes.value = JSON.parse(savedNotes)
        }
    })



    // تولید کلید یکتا برای هر روز
    const generateNoteKey = (day) => {
        return `${activeMonth.value}-${day[0]}-${metaYear.year}`
    }

    // ذخیره یادداشت
    const saveNote = () => {
        if (!selectedDay.value) return

        const noteKey = generateNoteKey(selectedDay.value)

        if (noteText.value.trim()) {
            notes.value[noteKey] = noteText.value.trim()
        } else {
            // اگر یادداشت خالی است، حذف شود
            delete notes.value[noteKey]
        }

        // ذخیره در localStorage
        localStorage.setItem('calendar-notes', JSON.stringify(notes.value))

        showNoteModal.value = false
        selectedDay.value = null
        noteText.value = ''
    }

    // حذف یادداشت
    const deleteNote = () => {
        if (!selectedDay.value) return

        const noteKey = generateNoteKey(selectedDay.value)
        delete notes.value[noteKey]

        // به‌روزرسانی localStorage
        localStorage.setItem('calendar-notes', JSON.stringify(notes.value))

        showNoteModal.value = false
        selectedDay.value = null
        noteText.value = ''
    }

    // بررسی وجود یادداشت برای یک روز
    const hasNote = (day) => {
        if (day[5] === true) return false // روزهای غیرفعال

        const noteKey = generateNoteKey(day)
        return !!notes.value[noteKey]
    }

    // دریافت متن یادداشت برای نمایش در tooltip
    const getNotePreview = (day) => {
        if (day[5] === true) return ''

        const noteKey = generateNoteKey(day)
        const note = notes.value[noteKey]
        return note ? (note.length > 20 ? note.substring(0, 20) + '...' : note) : ''
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

    return {
        // ... مقادیر موجود ...
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
        formatMetaYear,

        // مقادیر جدید
        notes,
        selectedDay,
        noteText,
        showNoteModal,
        saveNote,
        deleteNote,
        getNotePreview,
        hasNote
    }
}
