export const dateUtils = {
  getDateFormat(uDate, option) {
    let date = new Intl.DateTimeFormat('fa-IR', option).format(uDate)
    date = this.convertDigits(date, "en")
    return date
  },

  convertDigits(str, to) {
    const toCvn = (this.getBaseConversionNumber(to))[to]
    const allDigits = this.getBaseConversionNumber("all")

    delete allDigits[to]

    const Objkeys = Object.keys(allDigits)
    let result = str
    for (var i = 0; i < Objkeys.length; i++) {
      const currentKey = Objkeys[i]
      const fromCvn = allDigits[currentKey]
      result = this.CvnFromTo(fromCvn, toCvn, result)
    }
    return result
  },

  CvnFromTo(fromDigits, toDigits, str) {
    for (var i = 0; i < toDigits.length; i++) {
      const currentFromDigit = fromDigits[i]
      const currentToDigit = toDigits[i]
      const regex = new RegExp(currentFromDigit, 'g')
      str = str.replace(regex, currentToDigit)
    }
    return str
  },

  getBaseConversionNumber(label) {
    const faDigits = ['۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹', '۰']
    const enDigits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
    const arDigits = ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '٠']

    var whichDigit = {}

    switch (label) {
      case 'fa':
        whichDigit[label] = faDigits
        break
      case 'en':
        whichDigit[label] = enDigits
        break
      case 'ar':
        whichDigit[label] = arDigits
        break
      case 'all':
        whichDigit = {
          "fa": faDigits,
          "en": enDigits,
          "ar": arDigits
        }
        break
      default:
        whichDigit = []
    }

    return whichDigit
  }
}

// اضافه کردن متد به prototype String برای سازگاری
String.prototype.convertDigits = function(to) {
  return dateUtils.convertDigits(this, to)
}