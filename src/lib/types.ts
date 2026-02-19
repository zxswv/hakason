export type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  color: string;
  calendarId: string;
  isAllDay: boolean;
  description?: string;
};

export type CalendarGroup = {
  id: string;
  name: string;
  color: string;
};
