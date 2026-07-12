import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

import HomePage from './HomePage'
import Login from './Auth/Login'
import SignUp from './Auth/SignUp'
import StudentDashboard from './Student/StudentDashboard'
import TeacherDashboard, {
  TeacherHome,
  TeacherCoursesPage,
  TeacherCreateCoursePage,
  TeacherMeetingPage,
  TeacherAttendancePage,
  TeacherRoutinePage,
  TeacherStudentsPage,
  TeacherGradebookPage,
  TeacherMessagesPage,
  TeacherProfilePage,
} from './Teacher/TeacherDashboard'
import AdminDashboard from './Admin/AdminDashboard'
import RequireAuth from './RequireAuth'
import AdmissionHub from './Admissions/AdmissionHub'
import ProgramDetails from './Admissions/ProgramDetails'
import ProgramCourses from './Admissions/ProgramCourses'
import CourseSyllabus from './Admissions/CourseSyllabus'
import CourseDetails from './Admissions/CourseDetails'
import ApplicationForm from './Admissions/ApplicationForm'
import ApplicationSubmitted from './Admissions/ApplicationSubmitted'
import TeacherClassroom from './Teacher/TeacherClassroom'
import SubmissionList from './Teacher/SubmissionList'
import PeopleDirectory from './pages/PeopleDirectory'
import AboutChairman from './pages/AboutChairman'
import DepartmentalMeetings from './pages/DepartmentalMeetings'
import ResourceHub from './Student/ResourceHub'
import StudentNotice from './Student/StudentNotice'
import Dashboard from './Student/DashBoard'
import EnrollCourse from './Student/EnrollCourse'
import MyCourses from './Student/MyCourses'
import ArchivedCourses from './Student/ArchivedCourses'
import SettingsPage from './Student/Settings'
import Finance from './Student/Finance'
import AdminFinance from './Admin/AdminFinance'
import NoticeBoard from './pages/NoticeBoard'
import StudentEventShow from './Student/StudentEventShow'
import NotFound from './pages/NotFound'
import Messenger from './components/Messenger'
import StudentResults from './Student/StudentResults'
import StudentCGPA from './Student/StudentCGPA'
import StudentRoutine from './Student/StudentRoutine'
import StudentAttendance from './Student/StudentAttendance'
import StudentPageShell from './Student/StudentPageShell'
import PublicLayout from './components/public/PublicLayout'
import { Toaster } from './components/ui/toast'

function App() {
  return (
    <Router>
      <Toaster />
      <Routes>
        {/* Public pages — shared navbar/footer via PublicLayout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/admission-hub" element={<AdmissionHub />} />
          <Route path="/program/:id" element={<ProgramDetails />} />
          <Route path="/program/:programId/courses" element={<ProgramCourses />} />
          <Route path="/course/:courseId/syllabus" element={<CourseSyllabus />} />
          <Route path="/course/:courseId" element={<CourseDetails />} />
          <Route path="/apply" element={<ApplicationForm />} />
          <Route path="/application-submitted" element={<ApplicationSubmitted />} />
          <Route path="/people" element={<PeopleDirectory />} />
          <Route path="/chairman" element={<AboutChairman />} />
          <Route path="/meetings" element={<DepartmentalMeetings />} />
          <Route path="/notice-board" element={<NoticeBoard />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/studentEventShow" element={<StudentEventShow />} />

        {/* Protected pages */}
        <Route
          path="/student-dashboard"
          element={
            <RequireAuth allowedRole="student">
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/teacher-dashboard"
          element={
            <RequireAuth allowedRole="teacher">
              <TeacherDashboard />
            </RequireAuth>
          }
        >
          <Route index element={<TeacherHome />} />
          <Route path="courses" element={<TeacherCoursesPage />} />
          <Route path="create-course" element={<TeacherCreateCoursePage />} />
          <Route path="meetings" element={<TeacherMeetingPage />} />
          <Route path="attendance" element={<TeacherAttendancePage />} />
          <Route path="routine" element={<TeacherRoutinePage />} />
          <Route path="students" element={<TeacherStudentsPage />} />
          <Route path="gradebook" element={<TeacherGradebookPage />} />
          <Route path="messages" element={<TeacherMessagesPage />} />
          <Route path="profile" element={<TeacherProfilePage />} />
        </Route>
        <Route path="/teacher/classroom/:course_id" element={<TeacherClassroom />} />
        <Route path="/assignments/:assignmentId/submissions" element={<SubmissionList />} />
        <Route
          path="/admin-dashboard"
          element={
            <RequireAuth allowedRole="admin">
              <AdminDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/admin-finance"
          element={
            <RequireAuth allowedRole="admin">
              <AdminFinance />
            </RequireAuth>
          }
        />
        <Route path="/enroll-course" element={<EnrollCourse />} />
        <Route path="/my-courses" element={<MyCourses />} />
        <Route path="/archived-courses" element={<ArchivedCourses />} />
        <Route path="/resource-hub" element={<ResourceHub />} />
        <Route path="/student-notice" element={<StudentNotice />} />
        <Route path='/settingspage' element={<SettingsPage />} />
        <Route path="/finance" element={<Finance />} />
        <Route
          path="/messages"
          element={
            <RequireAuth allowedRole="student">
              <StudentPageShell><Messenger /></StudentPageShell>
            </RequireAuth>
          }
        />
        <Route
          path="/results"
          element={
            <RequireAuth allowedRole="student">
              <StudentPageShell><StudentResults /></StudentPageShell>
            </RequireAuth>
          }
        />
        <Route
          path="/routine"
          element={
            <RequireAuth allowedRole="student">
              <StudentPageShell><StudentRoutine /></StudentPageShell>
            </RequireAuth>
          }
        />
        <Route
          path="/attendance"
          element={
            <RequireAuth allowedRole="student">
              <StudentPageShell><StudentAttendance /></StudentPageShell>
            </RequireAuth>
          }
        />
        <Route
          path="/cgpa-calculator"
          element={
            <RequireAuth allowedRole="student">
              <StudentPageShell><StudentCGPA /></StudentPageShell>
            </RequireAuth>
          }
        />
        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App