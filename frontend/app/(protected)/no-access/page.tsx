"use client";
import React from 'react';

export default function NoAccess() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white p-8 text-center shadow-xl rounded-2xl border border-slate-100">
        {/* Icon Section */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className="w-8 h-8"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>

        {/* Text Section */}
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">
          Restricted Access
        </h1>
        
        <p className="text-slate-600 font-medium">
          You don't have the necessary permissions.
        </p>
        
        <p className="mt-2 mb-8 text-sm text-slate-500">
          If you believe this is a mistake, please reach out to your system administrator for assistance.
        </p>

        {/* Action Section */}
        <div className="flex flex-col gap-3">
          <a
            href="/"
            className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Back to Dashboard
          </a>
          
          <button 
            onClick={() => window.location.reload()}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Try Refreshing
          </button>
        </div>
      </div>
    </div>
  );
}