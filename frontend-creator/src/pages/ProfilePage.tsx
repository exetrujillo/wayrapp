import React from 'react';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const pageTitle = t('common.navigation.profile');
  
  return (
    <>
      <PageTitle title={pageTitle} />
      <Layout title={pageTitle}>
        <div className="bg-white shadow rounded-lg p-6">
          {user && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-neutral-700">User Information</h3>
                <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-500">Name</label>
                    <div className="mt-1 text-neutral-900">{user.name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-500">Email</label>
                    <div className="mt-1 text-neutral-900">{user.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-500">Role</label>
                    <div className="mt-1 text-neutral-900">{user.role}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-500">Member Since</label>
                    <div className="mt-1 text-neutral-900">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-neutral-200">
                <h3 className="text-lg font-medium text-neutral-700">Account Settings</h3>
                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default ProfilePage;