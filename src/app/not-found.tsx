import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-20 text-center">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        페이지를 찾을 수 없습니다
      </h2>
      <p className="text-gray-600 mb-8">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <Link
        href="/"
        className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
