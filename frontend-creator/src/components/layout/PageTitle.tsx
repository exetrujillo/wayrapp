import React from 'react';
import { Helmet } from 'react-helmet-async';

interface PageTitleProps {
  title: string;
  description?: string;
}

const PageTitle: React.FC<PageTitleProps> = ({ title, description }) => {
  return (
    <Helmet>
      <title>{title} | WayrApp Creator</title>
      {description && <meta name="description" content={description} />}
    </Helmet>
  );
};

export default PageTitle;