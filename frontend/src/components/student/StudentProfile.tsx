import { UserProfile, Group } from '../../types/student';
import Card from '../ui/Card';

interface StudentProfileProps {
  user: UserProfile | null;
  group: Group | null;
}

const StudentProfile = ({ user, group }: StudentProfileProps) => {
  return (
    <Card variant="default" className="w-full max-w-7xl bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 shadow-xl">
      <div className="p-4 sm:p-6">
        <div className="relative flex flex-col items-center">
          {/* Profile Picture */}
          <div className="relative z-20 flex items-center justify-center" style={{ marginBottom: '-40px' }}>
            <div className="relative">
              {user?.profilePictureUrl ? (
                <>
                  <img
                    src={user.profilePictureUrl}
                    alt={`${user.firstName}'s profile`}
                    className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover ring-4 ring-white dark:ring-neutral-800 shadow-xl bg-white dark:bg-neutral-800"
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/60 to-transparent" />
                </>
              ) : (
                <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 dark:from-primary-500 dark:to-primary-700 flex items-center justify-center text-white text-2xl sm:text-4xl font-bold ring-4 ring-white dark:ring-neutral-800 shadow-xl">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </div>
              )}
            </div>
          </div>

          {/* Name and Role */}
          <div className="flex flex-col items-center mt-4 mb-2 z-20 text-center">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-white leading-tight">
              {user?.firstName} {user?.middleName ? `${user.middleName} ` : ''}{user?.lastName}{user?.suffix ? ` ${user.suffix}` : ''}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <span className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Student
              </span>
              {group && (
                <span className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-sm">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {group.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StudentProfile;
