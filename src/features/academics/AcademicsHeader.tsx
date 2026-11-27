import { NavLink } from 'react-router-dom';
import { DEMO_STUDENT } from '../../data/demoData';
import { PageHeader } from '../../components/Typography';

export function AcademicsHeader() {
  return (
    <div className="academics-header">
      <PageHeader
        eyebrow={`Semester 5 · ${DEMO_STUDENT.program}`}
        title="Academics"
      />
      <nav aria-label="Academic sections" className="academics-segmented">
        <NavLink end to="/academics/attendance">
          Attendance
        </NavLink>
        <NavLink end to="/academics/marks">
          Marks
        </NavLink>
      </nav>
    </div>
  );
}
