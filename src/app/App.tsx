import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import {
  AttendanceScaffold,
  EventsScaffold,
  FeesScaffold,
  MarksScaffold,
  ScheduleScaffold,
  TodayScaffold,
} from '../features/Scaffolds';
import { useTheme } from '../lib/theme';

export function App() {
  const { preference, setPreference, persistenceFailed } = useTheme();

  return (
    <BrowserRouter>
      <AppShell
        themePreference={preference}
        onThemeChange={setPreference}
        persistenceFailed={persistenceFailed}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayScaffold />} />
          <Route path="/academics" element={<Navigate to="/academics/attendance" replace />} />
          <Route path="/academics/attendance" element={<AttendanceScaffold />} />
          <Route path="/academics/marks" element={<MarksScaffold />} />
          <Route path="/schedule" element={<ScheduleScaffold />} />
          <Route path="/fees" element={<FeesScaffold />} />
          <Route path="/events" element={<EventsScaffold />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;
