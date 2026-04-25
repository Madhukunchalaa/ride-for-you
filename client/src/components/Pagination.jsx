import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 px-6 py-4 bg-slate-50 dark:bg-dark-200/30 rounded-2xl border border-slate-200 dark:border-slate-800/50">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
        Showing <span className="text-primary-500">{startItem}-{endItem}</span> of <span className="text-primary-500">{totalItems}</span> items
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl bg-white dark:bg-dark-100 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-primary-500 disabled:opacity-30 disabled:hover:text-slate-500 transition-all shadow-sm"
        >
          <ChevronLeft size={18} />
        </button>
        
        <div className="flex items-center gap-1">
          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            // Only show first, last, and pages around current
            if (
              pageNum === 1 || 
              pageNum === totalPages || 
              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
            ) {
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`
                    w-9 h-9 rounded-xl text-xs font-black transition-all
                    ${currentPage === pageNum 
                      ? 'bg-primary-600 text-white shadow-glow-primary' 
                      : 'bg-white dark:bg-dark-100 border border-slate-200 dark:border-slate-800 text-slate-500 hover:border-primary-500/50 hover:text-primary-500 shadow-sm'}
                  `}
                >
                  {pageNum}
                </button>
              );
            } else if (
              pageNum === currentPage - 2 || 
              pageNum === currentPage + 2
            ) {
              return <span key={pageNum} className="px-1 text-slate-400">...</span>;
            }
            return null;
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl bg-white dark:bg-dark-100 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-primary-500 disabled:opacity-30 disabled:hover:text-slate-500 transition-all shadow-sm"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
