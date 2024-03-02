import moment from 'moment'

const descendingComparator = <T>(a: T, b: T, orderBy: keyof T) => {
  if (b[orderBy] < a[orderBy]) {
    return -1
  }
  if (b[orderBy] > a[orderBy]) {
    return 1
  }
  return 0
}

// biome-ignore lint/suspicious/noExplicitAny: this is a generic function
const getComparator = <Key extends keyof any>(
  order: 'ascending' | 'descending',
  orderBy: Key
): ((
  a: { [key1 in Key]: number | string },
  b: { [key2 in Key]: number | string }
) => number) => {
  return order === 'descending'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy)
}

const formatMinutes = (mins: number) => {
  return moment().startOf('day').add(mins, 'minutes').format('m:ss')
}

// Convert seconds to mm:ss.ms
const timeFormat = (seconds: number): string => {
  const mm = String(Math.floor(seconds / 60)).padStart(1, '0')
  const ss = String(Math.floor(seconds % 60)).padStart(2, '0')
  const ms = String(Math.floor((seconds - Math.floor(seconds)) * 10)).padStart(
    1,
    '0'
  )

  return `${mm}:${ss}.${ms}`
}

// Convert time string to ms
const convertToSecs = (time: string): number => {
  const [minutes = 0, seconds = 0, ms = 0] = time.split(/[:.]/)
  return +minutes * 60 + +seconds + +`.${ms}`
}

// Round to two decimal places
const roundTwo = (num: number): number => Math.round(num * 100) / 100

const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export {
  convertToSecs,
  formatMinutes,
  getComparator,
  roundTwo,
  timeFormat,
  capitalize
}
