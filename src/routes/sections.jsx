import PropTypes from 'prop-types';
import { lazy, Suspense } from 'react';
import { Outlet, Navigate, useRoutes } from 'react-router-dom';

import { useAuthStore } from 'src/store';
import DashboardLayout from 'src/layouts/dashboard';
import ApplicationPage from 'src/pages/application';

import Loader from 'src/components/loader';

import { AuditDetailView } from 'src/sections/audit/view';
import { ResetPasswordView } from 'src/sections/reset-password';
import { ForgotPasswordView } from 'src/sections/forget-password';


const IndexPage = lazy(() => import('src/pages/app'));
const UserPage = lazy(() => import('src/pages/user'));
const UserDetailPage = lazy(() => import('src/sections/user/detail/user-detail-page'));
const UserAddPage = lazy(() => import('src/sections/user/add/user-add-page'));
const GroupsPage = lazy(() => import('src/pages/groups'));
const AdmissionPage = lazy(() => import('src/pages/admission'));
const StudentPage = lazy(() => import('src/pages/student'));
const StudentDetailPage = lazy(() => import('src/sections/student/detail/student-detail-page'));
const SettingsPage = lazy(() => import('src/pages/settings'));
const AppSettingsPage = lazy(() => import('src/pages/app-settings'));
const LoginPage = lazy(() => import('src/pages/login'));
const ProgramPage = lazy(() => import('src/pages/program'));
const PaymentPage = lazy(() => import('src/pages/payment'));
const InstructorPage = lazy(() => import('src/pages/instructor'));
const MemoPage = lazy(() => import('src/pages/memo'));
const DocumentPage = lazy(() => import('src/pages/document'));
const CalenderPage = lazy(() => import('src/pages/calender'));
const PreferencePage = lazy(() => import('src/pages/preference'));
const ResultPage = lazy(() => import('src/pages/result'));
const CoursePage = lazy(() => import('src/pages/course'));
const ClassLevelPage = lazy(() => import('src/pages/classlevel'));
const FeePage = lazy(() => import('src/pages/fee'));
const MailPage = lazy(() => import('src/pages/mail'));
const AuditPage = lazy(() => import('src/pages/audit'));
const RolePermissionPage = lazy(() => import('src/pages/role-permission'));
const TemplatePage = lazy(() => import('src/pages/template'));
const TemplateAddPage = lazy(() => import('src/sections/template/add/template-add-page'));
const TemplateDetailPage = lazy(() => import('src/sections/template/detail/template-detail-page'));
const Page404 = lazy(() => import('src/pages/page-not-found'));

// PrivateRoute Component
function PrivateRoute({ children }) {
  const user = useAuthStore((state) => state.user);
  return user ? children : <Navigate to="/auth/login" />;
}
PrivateRoute.propTypes = {
  children: PropTypes.node,
};

// ----------------------------------------------------------------------



export default function Router() {
  const routes = useRoutes([
    {
      element: (
        <DashboardLayout>
          <Suspense
            fallback={
              <Loader />
            }
          >
            <Outlet />
          </Suspense>
        </DashboardLayout>
      ),
      children: [
        {
          element: (
            <PrivateRoute>
              <IndexPage />
            </PrivateRoute>
          ),
          index: true,
        },
        {
          path: 'user',
          element: (
            <PrivateRoute>
              <UserPage />
            </PrivateRoute>
          ),
        },
        {
          path: 'user/new',
          element: (
            <PrivateRoute>
              <UserAddPage />
            </PrivateRoute>
          ),
        },
        {
          path: 'user/:id',
          element: (
            <PrivateRoute>
              <UserDetailPage />
            </PrivateRoute>
          ),
        },
        {
          path: 'groups',
          element: (
            <PrivateRoute>
              <GroupsPage />
            </PrivateRoute>
          ),
        },
        {
          path: 'application',
          element: (
            <PrivateRoute>
              <ApplicationPage />
            </PrivateRoute>
          ),
        },
        {
          path: 'admission',
          element: (
            <PrivateRoute>
              <AdmissionPage />
            </PrivateRoute>
          ),
        },
        {
          path: 'student',
          element: (
            <PrivateRoute>
              <StudentPage />
            </PrivateRoute>
          ),
        },
        {
          path: 'student/:id',
          element: (
            <PrivateRoute>
              <StudentDetailPage />
            </PrivateRoute>
          ),
        },
        {
          path: 'program',
          element: (
            <PrivateRoute>
              <ProgramPage />
            </PrivateRoute>
          ),
        },
        {
          path: 'payment',
          element: (
            <PrivateRoute>
              <PaymentPage />
            </PrivateRoute>
          ),
        },
        {
          path: 'preference',
          element: (
            <PrivateRoute>
              <PreferencePage />
            </PrivateRoute>
          ),
        },
        {
          path: 'memo',
          element: (
            <PrivateRoute>
              <MemoPage />
            </PrivateRoute>
          ),
        },
        {
          path: 'instructor',
          element: (
            <PrivateRoute>
              <InstructorPage />
            </PrivateRoute>
          ),
        },
        {
          path: 'fee',
          element: (
            <PrivateRoute>
              <FeePage />
            </PrivateRoute>
          ),
        },
        {
          path: 'document',
          element: (
            <PrivateRoute>
              <DocumentPage />
            </PrivateRoute>
          ),
        },
        {
          path: 'course',
          element: (
            <PrivateRoute>
              <CoursePage />
            </PrivateRoute>
          ),
        },
        {
          path: 'classlevel',
          element: (
            <PrivateRoute>
              <ClassLevelPage />
            </PrivateRoute>
          ),
        },
        {
          path: 'calender',
          element: (
            <PrivateRoute>
              <CalenderPage />
            </PrivateRoute>
          ),
        },
        {
          path: 'result',
          element: (
            <PrivateRoute>
              <ResultPage />
            </PrivateRoute>
          ),
        },
        {
          path: 'mail',
          element: (
            <PrivateRoute>
              <MailPage />
            </PrivateRoute>
          ),
        },
        {
          path: 'settings',
          element: (
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          ),
        },
        {
          path: 'app-settings',
          element: (
            <PrivateRoute>
              <AppSettingsPage />
            </PrivateRoute>
          ),
        },
        {
          path: 'role-permission',
          element: (
            <PrivateRoute>
              <RolePermissionPage />
            </PrivateRoute>
          ),
        },
        {
          path: 'audit',
          element: (
            <PrivateRoute>
              <AuditPage />
            </PrivateRoute>
          ),
        },
        {
          path: 'audit/:id',
          element: (
            <PrivateRoute>
              <AuditDetailView />
            </PrivateRoute>
          ),
        },
        {
          path: 'template',
          element: (
            <PrivateRoute>
              <TemplatePage />
            </PrivateRoute>
          ),
        },
        {
          path: 'template/new',
          element: (
            <PrivateRoute>
              <TemplateAddPage />
            </PrivateRoute>
          ),
        },
        {
          path: 'template/:id',
          element: (
            <PrivateRoute>
              <TemplateDetailPage />
            </PrivateRoute>
          ),
        },
      ],
    },
    {
      path: 'auth',
      element: <Outlet />,
      children: [
        {
          path: 'login',
          index: true,
          element: <LoginPage />,
        },
        {
          path: 'reset-password',
          element: <ResetPasswordView />,
        },
        {
          path: 'forgot-password',
          element: <ForgotPasswordView />,
        },
      ],
    },
    {
      path: '404',
      element: <Page404 />,
    },
    {
      path: '*',
      element: <Navigate to="/404" replace />,
    },
  ]);

  return routes;
}
