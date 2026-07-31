export default function Navbar() {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-green-700">
          Artvert Egypt
        </h1>

        <ul className="flex gap-8 text-gray-700 font-medium">
          <li className="hover:text-green-700 cursor-pointer">الرئيسية</li>
          <li className="hover:text-green-700 cursor-pointer">من نحن</li>
          <li className="hover:text-green-700 cursor-pointer">المنتجات</li>
          <li className="hover:text-green-700 cursor-pointer">المحاصيل</li>
          <li className="hover:text-green-700 cursor-pointer">المقالات</li>
          <li className="hover:text-green-700 cursor-pointer">اتصل بنا</li>
        </ul>
      </div>
    </nav>
  );
}