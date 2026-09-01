# Admin Operations Dashboard Edit Spec

## Current location

- Route: `/admin`
- Page: `admin.html`
- Data endpoint: `api/admin/appointments.js`
- Session endpoint: `api/admin/session.js`

## Requested change

Turn the minimal appointment table into a complete workshop operations dashboard without changing the public site's brand language.

## Information architecture

1. **Genel bakış** — operational KPIs, today's flow, pending requests, status distribution and service demand.
2. **Günlük plan** — date navigation and a 09:00–18:00 workshop timeline.
3. **Randevular** — searchable, filterable and sortable full appointment list with CSV export.
4. **Randevu ayrıntısı** — side drawer for status, date/time and internal note updates, customer contact actions and event history.

## Interactions

- Secure cookie-based login and logout.
- Refresh data without page reload.
- Search by customer, phone, plate, reference, vehicle or service.
- Filter by status and date; sort by requested date, newest or customer.
- Open any appointment from the table or schedule.
- Confirm, reschedule, complete or cancel an appointment.
- Update the requested date/time and internal note with server-side conflict validation.
- Contact customer by phone, WhatsApp or email; copy appointment summary.
- Export the currently filtered list as UTF-8 CSV and print the selected day's job list.
- Toggle light/dark appearance and retain preference locally.

## Responsive expectations

- Desktop: persistent sidebar, two-column overview, data table and right-side details drawer.
- Tablet: compact sidebar and single-column analytics.
- Mobile: off-canvas navigation, horizontal table cards, full-width details drawer and touch-sized actions.

## Verification checklist

- Login and unauthenticated state remain secure.
- Overview metrics match loaded appointment data.
- Timeline, filters, search and sorting produce the expected records.
- Status and reschedule updates are persisted through the admin API.
- Conflicting slots are rejected by the server.
- CSV and print controls use the active view/filters.
- No horizontal viewport overflow at desktop and mobile widths.
- Keyboard focus, labels, dialogs and toast feedback are accessible.

