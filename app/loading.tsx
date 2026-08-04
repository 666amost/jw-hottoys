export default function Loading() {
  return (
    <div className="container-shell py-5 sm:py-8" role="status" aria-label="Memuat halaman">
      <span className="sr-only">Memuat halaman...</span>
      <div className="skeleton-block h-[26rem] rounded-[1.6rem] sm:h-[32rem]" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => <div key={index} className="skeleton-block h-40 rounded-2xl" />)}
      </div>
      <div className="mt-10 h-7 w-52 rounded-lg skeleton-block" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton-block h-80 rounded-2xl" />)}
      </div>
    </div>
  );
}
