import React from 'react';
import { Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PagesLibrary({ pages, onEditPage, onDeletePage, onToggleStatus }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pages Library</h2>
          <p className="text-sm text-gray-500 mt-1">Published and draft content with live website slugs.</p>
        </div>
        <div className="text-sm text-gray-500 font-medium">
          {pages.length} total pages
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Page</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Footer</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Updated</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pages.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-500">No pages found. Create one to get started!</td>
              </tr>
            ) : (
              pages.map((page) => (
                <tr key={page._id || page.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 align-top max-w-sm">
                    <div className="font-bold text-gray-900">{page.title || 'Untitled Page'}</div>
                    <div className="text-sm text-green-600 hover:underline cursor-pointer mt-0.5 mb-2">{page.slug || '/'}</div>
                    <div className="text-sm text-gray-600 line-clamp-2">{page.summary}</div>
                  </td>
                  <td className="py-4 px-6 align-top">
                    <span className="text-sm font-medium text-gray-700">{page.footer || '-'}</span>
                  </td>
                  <td className="py-4 px-6 align-top">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        page.status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {page.status}
                      </span>
                      <button 
                        onClick={() => onToggleStatus(page._id || page.id)}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${page.status === 'Published' ? 'bg-green-500' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${page.status === 'Published' ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </td>

                  <td className="py-4 px-6 align-top">
                    <div className="text-sm font-medium text-gray-900">{page.updatedAt}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Created {page.createdAt}</div>
                  </td>
                  <td className="py-4 px-6 align-top text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => onEditPage(page)}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-gray-200 hover:border-green-200"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDeletePage(page._id || page.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100 hover:border-red-200 bg-red-50/50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
        <div>Page 1 of 1</div>
        <div className="flex gap-4">
          <button className="flex items-center gap-1 hover:text-gray-900 transition-colors disabled:opacity-50" disabled>
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <button className="flex items-center gap-1 hover:text-gray-900 transition-colors disabled:opacity-50" disabled>
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
