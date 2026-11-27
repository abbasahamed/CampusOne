import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { Attendance } from '../features/academics/Attendance';
import { Marks } from '../features/academics/Marks';
import { Events } from '../features/events/Events';
import { Fees } from '../features/fees/Fees';
import { Timetable } from '../features/schedule/Timetable';
import { Today } from '../features/today/Today';
import { useDemoAppState } from '../lib/demoState';
import { useTheme } from '../lib/theme';

export function App() {
  const { preference, setPreference, persistenceFailed } = useTheme();
  const {
    payments,
    bookmarkedEventIds,
    eventRegistrations,
    storageFailed,
    recordSimulatedPayment,
    toggleEventBookmark,
    registerForEvent,
  } = useDemoAppState();

  return (
    <BrowserRouter>
      <AppShell
        themePreference={preference}
        onThemeChange={setPreference}
        persistenceFailed={persistenceFailed}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<Today payments={payments} />} />
          <Route path="/academics" element={<Navigate to="/academics/attendance" replace />} />
          <Route path="/academics/attendance" element={<Attendance />} />
          <Route path="/academics/marks" element={<Marks />} />
          <Route path="/schedule" element={<Timetable />} />
          <Route
            path="/fees"
            element={
              <Fees
                payments={payments}
                storageFailed={storageFailed}
                onCommitPayment={recordSimulatedPayment}
              />
            }
          />
          <Route
            path="/events"
            element={
              <Events
                bookmarkedIds={bookmarkedEventIds}
                registrations={eventRegistrations}
                storageFailed={storageFailed}
                onToggleBookmark={toggleEventBookmark}
                onRegister={registerForEvent}
              />
            }
          />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;
