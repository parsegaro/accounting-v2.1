import React from 'react';

const PageNotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-6xl font-bold text-[var(--text-primary)]">404</h1>
      <p className="text-xl text-[var(--text-secondary)] mt-4">صفحه‌ی مورد نظر یافت نشد.</p>
      <a href="#/" className="btn btn-primary mt-6">
        بازگشت به داشبورد
      </a>
    </div>
  );
};

export default PageNotFound;