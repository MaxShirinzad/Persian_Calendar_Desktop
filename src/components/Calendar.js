import {ref, computed, onMounted, watch} from 'vue'
import {calendarObject, metaYear, cssProperties} from '../utils/calendarData'
import {dateUtils} from '../utils/dateUtils'
import moment from 'moment'
import 'jalali-moment'
import PersianDate from 'persian-date'

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
        // console.log('Today:', todayFa.value)
        // console.log('Active month:', activeMonth.value)
    })

    const currentMonthWeeks = computed(() => {
        const monthIndex = activeMonth.value - 1
        // console.log('Current month index:', monthIndex)

        if (!calendarObject[monthIndex]) {
            // console.warn(`No data for month ${activeMonth.value} (index: ${monthIndex})`)
            return []
        }

        const monthData = calendarObject[monthIndex]
        // console.log('Sample of first 10 days with day[5] values:')
        monthData.slice(0, 10).forEach((day, index) => {
            // console.log(`Day ${index}:`, day[0], 'day[5] =', day[5], 'events:', day[4])
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

            // console.log(`Day ${day[0]}: day[5] = ${day[5]}, in current month: ${isDayInCurrentMonth}`)

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
        // console.log('Changing to month:', monthNum)
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

        // دیباگ برای مناسبت‌ها
        console.log('Day events:', getDayEvents(day))
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

    // دریافت مناسبت‌های روز
    const getDayEvents = (day) => {
        if (!day || day[5] === true) return []

        const events = []
        if (day[4] && day[4].length > 0) {
            day[4].forEach(dayElement => {
                const indexBracket = dayElement.indexOf("[")
                const eventdate = (0 <= indexBracket) ? dayElement.substring(indexBracket) : ""
                const eventTitle = dayElement.replace(eventdate, "").trim()

                if (eventTitle) {
                    events.push({
                        title: eventTitle,
                        date: eventdate
                    })
                }
            })
        }
        return events
    }

    // computed برای مناسبت‌های روز انتخاب شده
    const selectedDayEvents = computed(() => {
        if (!selectedDay.value) return []
        return getDayEvents(selectedDay.value)
    })

    // تابع formatEventDate برای فرمت‌دهی بهتر تاریخ مناسبت‌ها
    const formatEventDate = (eventDate) => {
        if (!eventDate) return ''
        // حذف براکت‌ها و تمیز کردن متن
        return eventDate.replace(/[\[\]]/g, '').trim()
    }

    // state جدید برای مودال تبدیل تاریخ
    const showConvertModal = ref(false)
    const convertDateInput = ref('')
    const convertedDate = ref('')
    const convertDirection = ref('jalaliToGregorian') // جهت تبدیل

    // تابع برای نمایش تاریخ امروز در مودال
    const getTodayDisplay = () => {
        const today = new Date()
        if (convertDirection.value === 'jalaliToGregorian') {
            try {
                const todayFa = {
                    day: dateUtils.getDateFormat(today, {day: "2-digit", calendar: 'jalali'}),
                    month: dateUtils.getDateFormat(today, {month: "numeric", calendar: 'jalali'}),
                    year: dateUtils.getDateFormat(today, {year: "numeric", calendar: 'jalali'})
                }
                return `${todayFa.year}/${todayFa.month}/${todayFa.day} شمسی`
            } catch (error) {
                return '۱۴۰۳/۰۱/۰۱ شمسی' // مقدار پیش‌فرض
            }
        } else {
            return `${today.getFullYear()}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')} میلادی`
        }
    }

    // توابع تبدیل تاریخ
        const convertJalaliToGregorian = (jalaliDate) => {
            try {
                const cleanedDate = jalaliDate.replace(/[/]/g, '-')
                const parts = cleanedDate.split('-')

                if (parts.length !== 3) {
                    throw new Error('فرمت تاریخ نامعتبر')
                }

                const year = parseInt(parts[0])
                const month = parseInt(parts[1])
                const day = parseInt(parts[2])

                // استفاده صحیح از PersianDate
                const persianDate = new PersianDate()
                persianDate.year(year)
                persianDate.month(month - 1) // ماه در PersianDate از 0 شروع می‌شود
                persianDate.date(day)

                // تبدیل به تاریخ میلادی
                const gregorianDate = new Date(persianDate.valueOf())

                // فرمت‌دهی به فارسی
                const persianMonths = [
                    'ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن',
                    'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'
                ]

                const englishMonths = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ]

                const persianFormatted = `${convertDigits(gregorianDate.getDate().toString(), 'fa')} ${persianMonths[gregorianDate.getMonth()]} ${convertDigits(gregorianDate.getFullYear().toString(), 'fa')}`
                const englishFormatted = `${englishMonths[gregorianDate.getMonth()]} ${gregorianDate.getDate()}, ${gregorianDate.getFullYear()}`

                return `${persianFormatted} - ${englishFormatted}`

            } catch (error) {
                console.error('Conversion error:', error)
                return 'خطا در تبدیل تاریخ. لطفاً فرمت را بررسی کنید.'
            }
        }

        const convertGregorianToJalali = (gregorianDate) => {
            try {
                const cleanedDate = gregorianDate.replace(/[/]/g, '-')
                const dateObj = new Date(cleanedDate)

                if (isNaN(dateObj.getTime())) {
                    throw new Error('فرمت تاریخ نامعتبر')
                }

                // استفاده از PersianDate
                const persianDate = new PersianDate(dateObj)

                const monthNames = [
                    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
                    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
                ]

                const jalaliMonthName = monthNames[persianDate.month()]
                const formattedDate = `${convertDigits(persianDate.date().toString(), 'fa')} ${jalaliMonthName} ${convertDigits(persianDate.year().toString(), 'fa')}`
                const numericDate = `${convertDigits(persianDate.year().toString(), 'fa')}/${convertDigits((persianDate.month() + 1).toString().padStart(2, '0'), 'fa')}/${convertDigits(persianDate.date().toString().padStart(2, '0'), 'fa')}`

                return `${formattedDate} - ${numericDate}`

            } catch (error) {
                console.error('Conversion error:', error)
                return 'خطا در تبدیل تاریخ. لطفاً فرمت را بررسی کنید.'
            }
        }

    const convertDate = () => {
        if (!convertDateInput.value.trim()) {
            convertDateInput.value = getTodayDate(convertDirection.value)
        }

        try {
            if (convertDirection.value === 'jalaliToGregorian') {
                const jalaliDate = convertDateInput.value.trim()
                const gregorianDate = convertJalaliToGregorian(jalaliDate)
                convertedDate.value = gregorianDate
            } else {
                const gregorianDate = convertDateInput.value.trim()
                const jalaliDate = convertGregorianToJalali(gregorianDate)
                convertedDate.value = jalaliDate
            }
        } catch (error) {
            convertedDate.value = 'خطا در تبدیل تاریخ. فرمت را بررسی کنید.'
            console.error('Date conversion error:', error)
        }
    }

    const setTodayDate = () => {
        convertDateInput.value = getTodayDate(convertDirection.value)
        convertDate()
    }

    // تابع برای انتخاب کل متن هنگام فوکوس
    const onInputFocus = (event) => {
        event.target.select()
    }

    // توابع جدید برای تبدیل تاریخ
    const openConvertModal = () => {
        showConvertModal.value = true
        // تنظیم تاریخ امروز به عنوان مقدار پیش‌فرض
        convertDateInput.value = getTodayDate(convertDirection.value)
        convertedDate.value = ''

        // انجام خودکار تبدیل هنگام باز کردن مودال
        setTimeout(() => {
            convertDate()
        }, 100)
    }

    const closeConvertModal = () => {
        showConvertModal.value = false
        convertDateInput.value = ''
        convertedDate.value = ''
    }

    watch(convertDirection, (newDirection, oldDirection) => {
        if (newDirection !== oldDirection) {
            // پاک کردن نتیجه قبلی
            convertedDate.value = ''

            // تنظیم تاریخ امروز برای جهت جدید
            convertDateInput.value = getTodayDate(newDirection)

            // انجام خودکار تبدیل پس از تغییر جهت
            setTimeout(() => {
                convertDate()
            }, 100)
        }
    })

    // تابع برای فرمت‌دهی تاریخ امروز به صورت خودکار
    const getTodayDate = (direction) => {
        const today = new Date()

        if (direction === 'jalaliToGregorian') {
            // تاریخ امروز شمسی
            try {
                if (dateUtils && dateUtils.getDateFormat) {
                    const jalaliDay = dateUtils.getDateFormat(today, {day: "numeric", calendar: 'jalali'})
                    const jalaliMonth = dateUtils.getDateFormat(today, {month: "numeric", calendar: 'jalali'})
                    const jalaliYear = dateUtils.getDateFormat(today, {year: "numeric", calendar: 'jalali'})
                    return `${jalaliYear}-${jalaliMonth.padStart(2, '0')}-${jalaliDay.padStart(2, '0')}`
                }
            } catch (error) {
                console.error('Error getting today date:', error)
            }
            // مقدار پیش‌فرض اگر خطا داشت
            return '1404-01-01'
        } else {
            // تاریخ امروز میلادی
            return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`
        }
    }

    // placeholder داینامیک برای input
    const getInputPlaceholder = computed(() => {
        return convertDirection.value === 'jalaliToGregorian'
            ? 'مثال: 1403-01-15'
            : 'مثال: 2024-04-05'
    })

    // عنوان داینامیک برای مودال
    const getConvertModalTitle = computed(() => {
        return convertDirection.value === 'jalaliToGregorian'
            ? 'تبدیل تاریخ شمسی به میلادی'
            : 'تبدیل تاریخ میلادی به شمسی'
    })

    // متن دکمه تبدیل
    const getConvertButtonText = computed(() => {
        return convertedDate.value ? 'تبدیل مجدد' : 'تبدیل تاریخ'
    })

    watch(convertDirection, (newDirection) => {
        convertDateInput.value = getTodayDate(newDirection)
    })

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
        formatMetaYear,
        notes,
        selectedDay,
        noteText,
        showNoteModal,
        saveNote,
        deleteNote,
        getNotePreview,
        hasNote,
        selectedDayEvents,
        formatEventDate,
        getDayEvents,
        showConvertModal,
        convertDateInput,
        convertedDate,
        convertDirection,
        openConvertModal,
        closeConvertModal,
        convertDate,
        getInputPlaceholder,
        getConvertModalTitle,
        getConvertButtonText,
        getTodayDate,
        getTodayDisplay,
        setTodayDate,
        onInputFocus
    }
}
