import { parseDateString, toDateString, jsDayToThaiDay, THAI_DAYS } from './dateUtils';

/**
 * Fixed-date Thai public holidays (MM-DD)
 */
const FIXED_THAI_HOLIDAYS = [
  { monthDay: '01-01', title: 'วันขึ้นปีใหม่', notes: 'วันหยุดราชการประจำปี' },
  { monthDay: '04-06', title: 'วันจักรี', notes: 'วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราช และวันที่ระลึกมหาจักรีบรมราชวงศ์' },
  { monthDay: '04-13', title: 'วันสงกรานต์ (วันผู้สูงอายุ)', notes: 'วันหยุดเทศกาลสงกรานต์' },
  { monthDay: '04-14', title: 'วันสงกรานต์ (วันครอบครัว)', notes: 'วันหยุดเทศกาลสงกรานต์' },
  { monthDay: '04-15', title: 'วันสงกรานต์ (วันเถลิงศก)', notes: 'วันหยุดเทศกาลสงกรานต์' },
  { monthDay: '05-04', title: 'วันฉัตรมงคล', notes: 'วันหยุดราชการประจำปี' },
  { monthDay: '06-03', title: 'วันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าฯ พระบรมราชินี', notes: 'วันหยุดราชการประจำปี' },
  { monthDay: '07-28', title: 'วันเฉลิมพระชนมพรรษา พระบาทสมเด็จพระเจ้าอยู่หัว (ร.10)', notes: 'วันหยุดราชการประจำปี' },
  { monthDay: '08-12', title: 'วันแม่แห่งชาติ (วันเฉลิมพระชนมพรรษา สมเด็จพระบรมราชชนนีพันปีหลวง)', notes: 'วันหยุดราชการประจำปี' },
  { monthDay: '10-13', title: 'วันนวมินทรมหาราช (วันคล้ายวันสวรรคต ร.9)', notes: 'วันหยุดราชการประจำปี' },
  { monthDay: '10-23', title: 'วันปิยมหาราช', notes: 'วันคล้ายวันสวรรคตพระบาทสมเด็จพระจุลจอมเกล้าเจ้าอยู่หัว' },
  { monthDay: '12-05', title: 'วันพ่อแห่งชาติ และวันชาติ (วันคล้ายวันพระบรมราชสมภพ ร.9)', notes: 'วันหยุดราชการประจำปี' },
  { monthDay: '12-10', title: 'วันรัฐธรรมนูญ', notes: 'วันหยุดราชการประจำปี' },
  { monthDay: '12-31', title: 'วันสิ้นปี', notes: 'วันหยุดราชการประจำปี' },
];

/**
 * Movable / Lunar Thai public holidays by year (Buddhist holy days & Royal Ploughing Ceremony)
 */
const MOVABLE_THAI_HOLIDAYS_BY_YEAR = {
  2025: [
    { date: '2025-02-12', title: 'วันมาฆบูชา', notes: 'วันสำคัญทางพระพุทธศาสนา' },
    { date: '2025-05-09', title: 'วันพืชมงคล', notes: 'พระราชพิธีพืชมงคลจรดพระนังคัลแรกนาขวัญ' },
    { date: '2025-05-11', title: 'วันวิสาขบูชา', notes: 'วันสำคัญทางพระพุทธศาสนา' },
    { date: '2025-07-10', title: 'วันอาสาฬหบูชา', notes: 'วันสำคัญทางพระพุทธศาสนา' },
    { date: '2025-07-11', title: 'วันเข้าพรรษา', notes: 'วันสำคัญทางพระพุทธศาสนา' },
  ],
  2026: [
    { date: '2026-03-03', title: 'วันมาฆบูชา', notes: 'วันสำคัญทางพระพุทธศาสนา' },
    { date: '2026-05-13', title: 'วันพืชมงคล', notes: 'พระราชพิธีพืชมงคลจรดพระนังคัลแรกนาขวัญ' },
    { date: '2026-05-31', title: 'วันวิสาขบูชา', notes: 'วันสำคัญทางพระพุทธศาสนา' },
    { date: '2026-07-29', title: 'วันอาสาฬหบูชา', notes: 'วันสำคัญทางพระพุทธศาสนา' },
    { date: '2026-07-30', title: 'วันเข้าพรรษา', notes: 'วันสำคัญทางพระพุทธศาสนา' },
  ],
  2027: [
    { date: '2027-02-21', title: 'วันมาฆบูชา', notes: 'วันสำคัญทางพระพุทธศาสนา' },
    { date: '2027-05-10', title: 'วันพืชมงคล', notes: 'พระราชพิธีพืชมงคลจรดพระนังคัลแรกนาขวัญ' },
    { date: '2027-05-20', title: 'วันวิสาขบูชา', notes: 'วันสำคัญทางพระพุทธศาสนา' },
    { date: '2027-07-18', title: 'วันอาสาฬหบูชา', notes: 'วันสำคัญทางพระพุทธศาสนา' },
    { date: '2027-07-19', title: 'วันเข้าพรรษา', notes: 'วันสำคัญทางพระพุทธศาสนา' },
  ],
  2028: [
    { date: '2028-02-10', title: 'วันมาฆบูชา', notes: 'วันสำคัญทางพระพุทธศาสนา' },
    { date: '2028-05-08', title: 'วันวิสาขบูชา', notes: 'วันสำคัญทางพระพุทธศาสนา' },
    { date: '2028-05-12', title: 'วันพืชมงคล', notes: 'พระราชพิธีพืชมงคลจรดพระนังคัลแรกนาขวัญ' },
    { date: '2028-07-06', title: 'วันอาสาฬหบูชา', notes: 'วันสำคัญทางพระพุทธศาสนา' },
    { date: '2028-07-07', title: 'วันเข้าพรรษา', notes: 'วันสำคัญทางพระพุทธศาสนา' },
  ],
};

/**
 * Generates all official holidays for a given Gregorian year, including automatic
 * weekday substitute holidays when a holiday falls on Saturday or Sunday.
 */
export function getThaiHolidaysForYear(year, includeSubstitute = true) {
  const rawList = [];

  for (const item of FIXED_THAI_HOLIDAYS) {
    rawList.push({
      date: `${year}-${item.monthDay}`,
      title: item.title,
      notes: item.notes,
      isSubstitute: false,
      originalDate: null,
    });
  }

  const movable = MOVABLE_THAI_HOLIDAYS_BY_YEAR[year] || [];
  for (const item of movable) {
    rawList.push({
      date: item.date,
      title: item.title,
      notes: item.notes,
      isSubstitute: false,
      originalDate: null,
    });
  }

  rawList.sort((a, b) => a.date.localeCompare(b.date));

  const occupiedDates = new Set(rawList.map((h) => h.date));
  const schoolDayHolidays = [];

  for (const h of rawList) {
    const dObj = parseDateString(h.date);
    const jsDay = dObj.getDay(); // 0=Sun, 6=Sat

    if (jsDay >= 1 && jsDay <= 5) {
      schoolDayHolidays.push(h);
    } else if (includeSubstitute) {
      // Find next available weekday (Mon-Fri) not already occupied by another holiday
      const subDateObj = new Date(dObj);
      if (jsDay === 6) {
        subDateObj.setDate(subDateObj.getDate() + 2); // Sat -> Mon
      } else if (jsDay === 0) {
        subDateObj.setDate(subDateObj.getDate() + 1); // Sun -> Mon
      }

      while (
        subDateObj.getDay() === 0 ||
        subDateObj.getDay() === 6 ||
        occupiedDates.has(toDateString(subDateObj))
      ) {
        subDateObj.setDate(subDateObj.getDate() + 1);
      }

      const subDateStr = toDateString(subDateObj);
      occupiedDates.add(subDateStr);

      schoolDayHolidays.push({
        date: subDateStr,
        title: `วันหยุดชดเชย${h.title}`,
        notes: `ชดเชย${h.title} (ตรงกับวันที่ ${h.date})`,
        isSubstitute: true,
        originalDate: h.date,
      });
    }
  }

  return schoolDayHolidays.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Returns all school-day Thai public holidays within a semester's [startDate, endDate],
 * annotated with whether each holiday has already been synced into `multiDayEvents`.
 */
export function getThaiHolidaysForSemester(
  semester,
  existingMultiDayEvents = [],
  { includeSubstitute = true } = {}
) {
  if (!semester || !semester.startDate || !semester.endDate) return [];

  const startYear = Number(semester.startDate.slice(0, 4));
  const endYear = Number(semester.endDate.slice(0, 4));

  const allHolidays = [];
  for (let y = startYear; y <= endYear; y++) {
    allHolidays.push(...getThaiHolidaysForYear(y, includeSubstitute));
  }

  const inRange = allHolidays.filter(
    (h) => h.date >= semester.startDate && h.date <= semester.endDate
  );

  // Deduplicate by date
  const uniqueByDate = new Map();
  for (const h of inRange) {
    if (!uniqueByDate.has(h.date)) {
      const dObj = parseDateString(h.date);
      const thaiDayId = jsDayToThaiDay(dObj.getDay());
      const thaiDayObj = THAI_DAYS.find((d) => d.id === thaiDayId);

      // Check if an event already exists covering this date in this semester
      const matchingExisting = (existingMultiDayEvents || []).find(
        (mde) =>
          (!mde.semesterId || mde.semesterId === semester.id) &&
          mde.startDate <= h.date &&
          mde.endDate >= h.date
      );

      uniqueByDate.set(h.date, {
        ...h,
        id: `holiday-${semester.id}-${h.date}`,
        dayName: thaiDayObj ? thaiDayObj.name : '',
        isAlreadySynced: Boolean(matchingExisting),
        existingEventTitle: matchingExisting?.title || null,
      });
    }
  }

  return Array.from(uniqueByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}
