// Pastel and vibrant color palettes for subjects
export const SUBJECT_COLORS = [
  {
    id: 'indigo',
    name: 'น้ำเงินคราม (Indigo)',
    bg: 'bg-indigo-100 dark:bg-indigo-950/70',
    border: 'border-indigo-300 dark:border-indigo-700',
    text: 'text-indigo-800 dark:text-indigo-200',
    accent: 'bg-indigo-500',
    badge: 'bg-indigo-500 text-white',
    dot: 'bg-indigo-500',
  },
  {
    id: 'emerald',
    name: 'เขียวมรกต (Emerald)',
    bg: 'bg-emerald-100 dark:bg-emerald-950/70',
    border: 'border-emerald-300 dark:border-emerald-700',
    text: 'text-emerald-800 dark:text-emerald-200',
    accent: 'bg-emerald-500',
    badge: 'bg-emerald-500 text-white',
    dot: 'bg-emerald-500',
  },
  {
    id: 'amber',
    name: 'ส้มอำพัน (Amber)',
    bg: 'bg-amber-100 dark:bg-amber-950/70',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-800 dark:text-amber-200',
    accent: 'bg-amber-500',
    badge: 'bg-amber-500 text-white',
    dot: 'bg-amber-500',
  },
  {
    id: 'rose',
    name: 'ชมพูกุหลาบ (Rose)',
    bg: 'bg-rose-100 dark:bg-rose-950/70',
    border: 'border-rose-300 dark:border-rose-700',
    text: 'text-rose-800 dark:text-rose-200',
    accent: 'bg-rose-500',
    badge: 'bg-rose-500 text-white',
    dot: 'bg-rose-500',
  },
  {
    id: 'sky',
    name: 'ฟ้าคราม (Sky)',
    bg: 'bg-sky-100 dark:bg-sky-950/70',
    border: 'border-sky-300 dark:border-sky-700',
    text: 'text-sky-800 dark:text-sky-200',
    accent: 'bg-sky-500',
    badge: 'bg-sky-500 text-white',
    dot: 'bg-sky-500',
  },
  {
    id: 'purple',
    name: 'ม่วงลาเวนเดอร์ (Purple)',
    bg: 'bg-purple-100 dark:bg-purple-950/70',
    border: 'border-purple-300 dark:border-purple-700',
    text: 'text-purple-800 dark:text-purple-200',
    accent: 'bg-purple-500',
    badge: 'bg-purple-500 text-white',
    dot: 'bg-purple-500',
  },
  {
    id: 'teal',
    name: 'เขียวน้ำทะเล (Teal)',
    bg: 'bg-teal-100 dark:bg-teal-950/70',
    border: 'border-teal-300 dark:border-teal-700',
    text: 'text-teal-800 dark:text-teal-200',
    accent: 'bg-teal-500',
    badge: 'bg-teal-500 text-white',
    dot: 'bg-teal-500',
  },
  {
    id: 'orange',
    name: 'ส้มสดใส (Orange)',
    bg: 'bg-orange-100 dark:bg-orange-950/70',
    border: 'border-orange-300 dark:border-orange-700',
    text: 'text-orange-800 dark:text-orange-200',
    accent: 'bg-orange-500',
    badge: 'bg-orange-500 text-white',
    dot: 'bg-orange-500',
  },
];

export function getColorById(colorId) {
  return SUBJECT_COLORS.find(c => c.id === colorId) || SUBJECT_COLORS[0];
}

export const SESSION_STATUS = {
  NORMAL: {
    id: 'normal',
    label: 'สอนปกติ',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800',
    dotClass: 'bg-emerald-500',
  },
  CANCELLED: {
    id: 'cancelled',
    label: 'งดสอน / ไม่ได้สอน',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800',
    dotClass: 'bg-rose-500',
  },
  ACTIVITY: {
    id: 'activity',
    label: 'ติดกิจกรรม / วันหยุด',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
    dotClass: 'bg-amber-500',
  },
  MAKEUP: {
    id: 'makeup',
    label: 'สอนชดเชย',
    badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-800',
    dotClass: 'bg-sky-500',
  },
};
