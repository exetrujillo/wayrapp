import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface BreadcrumbProps {
  title?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ title }) => {
  const { t } = useTranslation();
  const location = useLocation();
  
  // Generate breadcrumb items based on the current path
  const generateBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    
    // Start with home
    const breadcrumbs = [
      { path: '/', label: 'Home' }
    ];
    
    // Add path segments
    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      
      // Skip the last item if a title is provided
      if (title && index === paths.length - 1) {
        return;
      }
      
      // Translate path to readable label
      let label = path.charAt(0).toUpperCase() + path.slice(1);
      
      // Try to get translation
      const translationKey = `common.navigation.${path.toLowerCase()}`;
      const translated = t(translationKey);
      if (translated !== translationKey) {
        label = translated;
      }
      
      breadcrumbs.push({
        path: currentPath,
        label
      });
    });
    
    // Add the title as the last item if provided
    if (title) {
      breadcrumbs.push({
        path: location.pathname,
        label: title
      });
    }
    
    return breadcrumbs;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  return (
    <nav className="mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.path} className="flex items-center">
            {index > 0 && <span className="mx-2 text-neutral-400">/</span>}
            {index === breadcrumbs.length - 1 ? (
              <span className="text-neutral-700 font-medium" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link 
                to={crumb.path} 
                className="text-primary-500 hover:text-primary-700"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;