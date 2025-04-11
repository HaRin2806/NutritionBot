import React from 'react';
import { Link } from 'react-router-dom';
import { BiChat, BiShield, BiBook, BiLike, BiRocket, BiLockOpen, BiStar, BiCog } from 'react-icons/bi';

const LandingPage = () => {
  return (
    <div className="bg-white">
      {/* Hero section */}
      <div 
        className="relative overflow-hidden" 
        style={{ 
          background: 'linear-gradient(to right, #F7FFFA, #E6F7EF)',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 lg:mt-16 lg:px-8 xl:mt-20">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Truy vấn thông tin</span>
                  <span className="block text-mint-600" style={{ color: '#36B37E' }}>
                    dinh dưỡng thông minh
                  </span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Nutribot - Người bạn đồng hành giúp bạn tra cứu và hiểu biết về dinh dưỡng, an toàn thực phẩm và chế độ ăn uống hợp lý cho sức khỏe tối ưu.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      to="/chat"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-mint-600 hover:bg-mint-700 md:py-4 md:text-lg md:px-10"
                      style={{ backgroundColor: '#36B37E' }}
                    >
                      <BiChat className="mr-2" />
                      Bắt đầu trò chuyện
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      to="/about"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-mint-700 bg-mint-100 hover:bg-mint-200 md:py-4 md:text-lg md:px-10"
                      style={{ backgroundColor: '#E6F7EF' }}
                    >
                      Tìm hiểu thêm
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <img
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
            src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"
            alt="Healthy food"
          />
        </div>
      </div>

      {/* Feature section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 
              className="text-base text-mint-600 font-semibold tracking-wide uppercase"
              style={{ color: '#36B37E' }}
            >
              Tính năng
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Trải nghiệm tối ưu cho mọi câu hỏi dinh dưỡng
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Nutribot cung cấp đầy đủ thông tin về dinh dưỡng, an toàn thực phẩm và chế độ ăn uống dựa trên nguồn tài liệu tin cậy và cập nhật.
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-mint-500 text-white" style={{ backgroundColor: '#36B37E' }}>
                  <BiBook className="h-6 w-6" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Thông tin tin cậy</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Dữ liệu được trích xuất từ tài liệu học phần Dinh dưỡng và An toàn thực phẩm của Bộ Giáo dục và Đào tạo.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-mint-500 text-white" style={{ backgroundColor: '#36B37E' }}>
                  <BiRocket className="h-6 w-6" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Phản hồi nhanh chóng</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Trả lời tức thì mọi thắc mắc về dinh dưỡng, an toàn thực phẩm và chế độ ăn uống phù hợp với mọi độ tuổi.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-mint-500 text-white" style={{ backgroundColor: '#36B37E' }}>
                  <BiLike className="h-6 w-6" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Giao diện thân thiện</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Thiết kế dễ sử dụng, trực quan giúp người dùng dễ dàng tra cứu và tìm kiếm thông tin cần thiết.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-mint-500 text-white" style={{ backgroundColor: '#36B37E' }}>
                  <BiShield className="h-6 w-6" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Bảo mật thông tin</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Cam kết bảo vệ thông tin cá nhân và lịch sử tra cứu của người dùng.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-mint-50" style={{ backgroundColor: '#F7FFFA' }}>
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            <span className="block">Sẵn sàng bắt đầu?</span>
            <span className="block text-mint-600" style={{ color: '#36B37E' }}>Đăng ký tài khoản ngay hôm nay.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-mint-600 hover:bg-mint-700"
                style={{ backgroundColor: '#36B37E' }}
              >
                <BiLockOpen className="mr-2" />
                Đăng ký
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-mint-600 bg-white hover:bg-mint-50"
              >
                Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tích hợp khoa học và Giáo dục */}
      <div className="bg-mint-50 py-16" style={{ backgroundColor: '#F7FFFA' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 
              className="text-base text-mint-600 font-semibold tracking-wide uppercase"
              style={{ color: '#36B37E' }}
            >
              Khoa học và Giáo dục
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Nền tảng kiến thức chuyên sâu
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Nutribot được xây dựng dựa trên các tài liệu chuyên môn, hướng tới mục tiêu nâng cao nhận thức dinh dưỡng cho cộng đồng.
            </p>
          </div>
          
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <BiBook className="h-12 w-12 text-mint-600" style={{ color: '#36B37E' }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Tài liệu Chính thống</h3>
              <p className="text-gray-600">
                Dữ liệu được trích xuất từ tài liệu chính thức của Bộ Giáo dục và Đào tạo
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <BiCog className="h-12 w-12 text-mint-600" style={{ color: '#36B37E' }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Cập nhật Liên tục</h3>
              <p className="text-gray-600">
                Thông tin luôn được kiểm chứng và cập nhật từ các nguồn tin cậy
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <BiRocket className="h-12 w-12 text-mint-600" style={{ color: '#36B37E' }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Công nghệ Tiên tiến</h3>
              <p className="text-gray-600">
                Sử dụng công nghệ AI hiện đại để trả lời chính xác và nhanh chóng
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;