import React from 'react';
import { Link } from 'react-router-dom';
import { BiLeaf, BiMessageDetail, BiShield, BiUser, BiRocket } from 'react-icons/bi';
import { Button } from '../components/common';
import { useApp } from '../hooks/useContext';

const LandingPage = () => {
  const { userData } = useApp();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white py-4 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BiLeaf className="text-3xl text-mint-600" style={{ color: "#36B37E" }} />
            <span className="text-xl font-bold">Nutribot</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/about" className="text-gray-600 hover:text-mint-600 transition" style={{ color: "#36B37E" }}>
              Giới thiệu
            </Link>
            <Link to="/features" className="text-gray-600 hover:text-mint-600 transition" style={{ color: "#36B37E" }}>
              Tính năng
            </Link>
            {userData ? (
              <Link to="/chat">
                <Button color="mint">
                  Vào ứng dụng
                </Button>
              </Link>
            ) : (
              <div className="flex space-x-2">
                <Link to="/login">
                  <Button color="mint" outline>
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register">
                  <Button color="mint">
                    Đăng ký
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="pt-20 pb-16 md:pt-28 md:pb-24 bg-gradient-to-br from-mint-50 to-white"
        style={{ backgroundColor: "#F7FFFA" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
              Tư vấn dinh dưỡng <br />
              <span className="text-mint-600" style={{ color: "#36B37E" }}>thông minh và chính xác</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Nutribot giúp bạn và gia đình tiếp cận thông tin dinh dưỡng, thực phẩm an toàn dựa trên kiến thức chuyên môn từ bộ Y tế.
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <Link to={userData ? "/chat" : "/register"}>
                <Button 
                  color="mint" 
                  size="lg"
                  icon={<BiRocket className="mr-2" />}
                  className="w-full sm:w-auto"
                >
                  {userData ? "Bắt đầu trò chuyện" : "Tạo tài khoản miễn phí"}
                </Button>
              </Link>
              <Link to="/about">
                <Button 
                  color="mint" 
                  outline
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Tìm hiểu thêm
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 md:pl-10">
            <div className="relative">
              <div className="bg-white p-6 rounded-xl shadow-xl transform rotate-1 z-10">
                <div className="bg-mint-50 p-4 rounded-lg mb-4" style={{ backgroundColor: "#E6F7EF" }}>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-mint-600 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#36B37E" }}>
                      <BiUser className="text-white" />
                    </div>
                    <div className="flex-1 bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-gray-700">Trẻ 2 tuổi nên ăn gì để phát triển tốt nhất?</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-mint-600 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#36B37E" }}>
                    <BiMessageDetail className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-mint-50 p-3 rounded-lg" style={{ backgroundColor: "#E6F7EF" }}>
                      <p className="text-gray-700">
                        Trẻ 2 tuổi nên có chế độ ăn đa dạng bao gồm:
                      </p>
                      <ul className="mt-2 space-y-1 text-gray-700">
                        <li>• Protein từ thịt, cá, trứng, đậu phụ</li>
                        <li>• Rau củ đa dạng màu sắc</li>
                        <li>• Trái cây tươi theo mùa</li>
                        <li>• Ngũ cốc nguyên hạt</li>
                        <li>• Sữa và các sản phẩm từ sữa</li>
                      </ul>
                      <p className="mt-2 text-gray-700">
                        Nên chia nhỏ bữa ăn thành 3 bữa chính và 2 bữa phụ, cung cấp đủ nước. Hạn chế thực phẩm chế biến sẵn và đồ ngọt.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-mint-200 rounded-xl transform -rotate-2" style={{ backgroundColor: "#C5E0D5", zIndex: -1 }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Tại sao nên sử dụng Nutribot?
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Nutribot giúp cung cấp thông tin dinh dưỡng chính xác dựa trên hướng dẫn của Bộ Y tế, điều chỉnh theo độ tuổi để đưa ra tư vấn phù hợp nhất.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-mint-50 rounded-xl p-8 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1" style={{ backgroundColor: "#F7FFFA" }}>
              <div className="w-14 h-14 rounded-full bg-mint-100 flex items-center justify-center mb-6" style={{ backgroundColor: "#E6F7EF" }}>
                <BiMessageDetail className="text-2xl text-mint-600" style={{ color: "#36B37E" }} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Tư vấn dinh dưỡng thông minh
              </h3>
              <p className="text-gray-600">
                Nhận thông tin dinh dưỡng chi tiết, công thức nấu ăn, và kế hoạch bữa ăn được cá nhân hóa theo độ tuổi và nhu cầu của bạn.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-mint-50 rounded-xl p-8 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1" style={{ backgroundColor: "#F7FFFA" }}>
              <div className="w-14 h-14 rounded-full bg-mint-100 flex items-center justify-center mb-6" style={{ backgroundColor: "#E6F7EF" }}>
                <BiUser className="text-2xl text-mint-600" style={{ color: "#36B37E" }} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Phù hợp với mọi độ tuổi
              </h3>
              <p className="text-gray-600">
                Nutribot điều chỉnh tư vấn dựa trên độ tuổi, từ trẻ sơ sinh đến người cao tuổi, đảm bảo thông tin phù hợp với nhu cầu cụ thể theo từng giai đoạn phát triển.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-mint-50 rounded-xl p-8 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1" style={{ backgroundColor: "#F7FFFA" }}>
              <div className="w-14 h-14 rounded-full bg-mint-100 flex items-center justify-center mb-6" style={{ backgroundColor: "#E6F7EF" }}>
                <BiShield className="text-2xl text-mint-600" style={{ color: "#36B37E" }} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Nguồn thông tin đáng tin cậy
              </h3>
              <p className="text-gray-600">
                Thông tin được dựa trên hướng dẫn chính thức của Bộ Y tế và các nguồn khoa học đáng tin cậy, giúp bạn yên tâm về độ chính xác của nội dung.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-mint-600" style={{ backgroundColor: "#36B37E" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-6">
            Bắt đầu hành trình dinh dưỡng của bạn ngay hôm nay
          </h2>
          <p className="text-mint-100 text-lg mb-8 max-w-3xl mx-auto" style={{ color: "#E6F7EF" }}>
            Tham gia cùng hàng nghìn người dùng khác và nhận tư vấn dinh dưỡng được cá nhân hóa ngay lập tức.
          </p>
          <Link to={userData ? "/chat" : "/register"}>
            <Button 
              size="lg"
              className="bg-white text-mint-600 hover:bg-mint-50"
              style={{ color: "#36B37E" }}
            >
              {userData ? "Bắt đầu trò chuyện" : "Đăng ký miễn phí"}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BiLeaf className="text-2xl text-mint-600" style={{ color: "#36B37E" }} />
                <span className="text-lg font-bold">Nutribot</span>
              </div>
              <p className="text-gray-600 mb-4">
                Tư vấn dinh dưỡng thông minh, chính xác và được cá nhân hóa.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Về chúng tôi</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-600 hover:text-mint-600">Giới thiệu</Link></li>
                <li><Link to="/team" className="text-gray-600 hover:text-mint-600">Đội ngũ</Link></li>
                <li><Link to="/careers" className="text-gray-600 hover:text-mint-600">Tuyển dụng</Link></li>
                <li><Link to="/contact" className="text-gray-600 hover:text-mint-600">Liên hệ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Tài nguyên</h3>
              <ul className="space-y-2">
                <li><Link to="/blog" className="text-gray-600 hover:text-mint-600">Blog</Link></li>
                <li><Link to="/guides" className="text-gray-600 hover:text-mint-600">Hướng dẫn</Link></li>
                <li><Link to="/faq" className="text-gray-600 hover:text-mint-600">FAQ</Link></li>
                <li><Link to="/support" className="text-gray-600 hover:text-mint-600">Hỗ trợ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Pháp lý</h3>
              <ul className="space-y-2">
                <li><Link to="/terms" className="text-gray-600 hover:text-mint-600">Điều khoản</Link></li>
                <li><Link to="/privacy" className="text-gray-600 hover:text-mint-600">Chính sách bảo mật</Link></li>
                <li><Link to="/cookies" className="text-gray-600 hover:text-mint-600">Chính sách cookie</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Nutribot. Bản quyền thuộc về công ty. Mọi quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;