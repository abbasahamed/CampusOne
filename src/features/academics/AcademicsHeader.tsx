import { NavLink } from 'react-router-dom';
import { PageHeader } from '../../components/Typography';

export function AcademicsHeader() {
  return (
    <header className="academics-header">
      <PageHeader title="Academics" />
      <nav aria-label="Academic sections" className="academics-tabs">
        <NavLink end to="/academics/attendance">Attendance</NavLink>
        <NavLink end to="/academics/marks">Marks</NavLink>
      </nav>
    </header>
  );
}
