import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { arSA } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'ar-SA': arSA,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 6 }),
  getDay,
  locales,
});

const STATUS_COLORS = {
  scheduled: '#38bdf8',
  completed: '#22c55e',
  cancelled: '#f87171',
  no_show: '#94a3b8',
};

export default function AppointmentCalendar({ events, view, onView, onSelectEvent, onSelectSlot }) {
  return (
    <div className="appointment-calendar">
      <Calendar
        localizer={localizer}
        culture="ar-SA"
        rtl
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={onView}
        onSelectEvent={onSelectEvent}
        selectable
        onSelectSlot={onSelectSlot}
        messages={{
          today: 'اليوم',
          previous: 'السابق',
          next: 'التالي',
          month: 'شهر',
          week: 'أسبوع',
          day: 'يوم',
          agenda: 'أجندة',
          date: 'التاريخ',
          time: 'الوقت',
          event: 'الموعد',
          allDay: 'طوال اليوم',
        }}
        style={{ height: 620 }}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: STATUS_COLORS[event.status] || '#38bdf8',
            borderRadius: 8,
            border: 'none',
            color: '#0f172a',
            fontWeight: 600,
          },
        })}
      />
    </div>
  );
}
