import { NavLink, useLocation } from 'react-router-dom';
import { DEMO_STUDENT } from '../../data/demoData';
import { PageHeader } from '../../components/Typography';

export function AcademicsHeader() {
  const { pathname } = useLocation();
  const isMarks = pathname.startsWith('/academics/marks');

  return (
    <div className="academics-header">
      <PageHeader
        eyebrow={`Semester 5 · ${DEMO_STUDENT.program}`}
        title="Academics"
      />
      <nav aria-label="Academic sections" className="academics-segmented">
        <span
          aria-hidden="true"
          className="academics-segmented-pill"
          style={{ transform: `translateX(${isMarks ? '100%' : '0%'})` }}
        />
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
