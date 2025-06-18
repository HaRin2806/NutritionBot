import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BiLeaf, BiChat, BiShield, BiUser, BiRocket, BiStar,
  BiHeart, BiBrain, BiTime, BiTrendingUp,
  BiCheckCircle, BiPlus, BiMinus, BiEnvelope,
  BiBook, BiHappy, BiTrophy, BiGroup,
  BiCake, BiCoffee, BiDish, BiSun, BiMoon,
  BiBowlRice,
  BiMapPin,
  BiBluetooth
} from 'react-icons/bi';
import { Button } from '../components/base/index.jsx';
import { useApp } from '../contexts/AppContext';

const LandingPage = () => {
  const { userData } = useApp();
  const [activeFeature, setActiveFeature] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Auto rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const schoolNutritionFeatures = [
    {
      icon: <BiBook className="text-3xl" />,
      title: "Chương Trình Dinh Dưỡng Học Đường",
      description: "Hướng dẫn chi tiết về dinh dưỡng cho học sinh từ mầm non đến THPT theo tiêu chuẩn Bộ GD&ĐT.",
      details: [
        "Thực đơn chuẩn cho từng độ tuổi",
        "Hướng dẫn chế biến an toàn thực phẩm",
        "Đánh giá tình trạng dinh dưỡng học sinh"
      ],
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <BiBowlRice className="text-3xl" />,
      title: "Thực Đơn Thông Minh",
      description: "AI tự động tạo thực đơn cân bằng dinh dưỡng phù hợp với điều kiện kinh tế và khẩu vị địa phương.",
      details: [
        "Thực đơn 4 tuần không trùng lặp",
        "Tính toán chính xác calories & vitamin",
        "Thích ứng với ngân sách trường học"
      ],
      color: "from-green-500 to-green-600"
    },
    {
      icon: <BiShield className="text-3xl" />,
      title: "An Toàn Thực Phẩm",
      description: "Kiểm soát chất lượng thực phẩm và quy trình chế biến đảm bảo sức khỏe học sinh.",
      details: [
        "Checklist kiểm tra thực phẩm hàng ngày",
        "Hướng dẫn bảo quản thực phẩm",
        "Quy trình xử lý sự cố thực phẩm"
      ],
      color: "from-red-500 to-red-600"
    },
    {
      icon: <BiTrophy className="text-3xl" />,
      title: "Theo Dõi Phát Triển",
      description: "Giám sát tình trạng dinh dưỡng và sự phát triển thể chất của học sinh theo thời gian.",
      details: [
        "Biểu đồ tăng trưởng cá nhân",
        "Báo cáo dinh dưỡng định kỳ",
        "Cảnh báo sớm các vấn đề sức khỏe"
      ],
      color: "from-purple-500 to-purple-600"
    }
  ];

  const schoolUseCases = [
    {
      icon: <BiGroup className="text-3xl text-blue-500" />,
      title: "Trường Mầm Non",
      studentAge: "3-5 tuổi",
      challenge: "Làm sao để các bé ăn đủ chất dinh dưỡng mà vẫn ngon miệng?",
      solution: "Thực đơn nhiều màu sắc, dễ nhai, giàu vitamin và khoáng chất phù hợp với sự phát triển não bộ và xương khớp.",
      benefits: ["Hỗ trợ tăng trưởng chiều cao", "Cải thiện thói quen ăn uống", "Bổ sung dinh dưỡng cần thiết"]
    },
    {
      icon: <BiBook className="text-3xl text-green-500" />,
      title: "Trường Tiểu Học",
      studentAge: "6-11 tuổi",
      challenge: "Học sinh cần năng lượng học tập và vận động, nhưng không được béo phì.",
      solution: "Cân bằng protein, carb và chất béo tốt. Nhiều rau xanh, hạn chế đồ ngọt và nước có gas.",
      benefits: ["Hỗ trợ khả năng tập trung", "Cân bằng dinh dưỡng", "Tăng cường sức đề kháng"]
    },
    {
      icon: <BiTrendingUp className="text-3xl text-purple-500" />,
      title: "Trường THCS & THPT",
      studentAge: "12-18 tuổi",
      challenge: "Thời kỳ dậy thì cần nhiều dinh dưỡng, áp lực học tập cao.",
      solution: "Thực đơn giàu protein, omega-3, vitamin B để hỗ trợ phát triển não bộ và cơ thể.",
      benefits: ["Hỗ trợ học tập hiệu quả", "Giảm stress", "Phát triển thể chất toàn diện"]
    }
  ];

  // Thông tin testimonial thực tế về dự án (không phải khách hàng thật)
  const testimonials = [
    {
      name: "Dự án nghiên cứu",
      role: "Đề tài tốt nghiệp",
      content: "Đây là một dự án nghiên cứu nhằm phát triển chatbot AI hỗ trợ tư vấn dinh dưỡng học đường.",
      rating: 5,
      students: "Dự án R&D",
      improvement: "Trong phát triển"
    },
    {
      name: "Công nghệ RAG",
      role: "Retrieval-Augmented Generation",
      content: "Sử dụng công nghệ RAG kết hợp tài liệu Bộ GD&ĐT để cung cấp thông tin chính xác về dinh dưỡng.",
      rating: 5,
      students: "AI/ML",
      improvement: "Tiên tiến"
    },
    {
      name: "Mục tiêu nghiên cứu",
      role: "Hỗ trợ giáo dục",
      content: "Mong muốn tạo ra công cụ hữu ích cho các trường học trong việc quản lý dinh dưỡng học sinh.",
      rating: 5,
      students: "Tương lai",
      improvement: "Tiềm năng"
    }
  ];

  // Thống kê thực tế về dự án
  const nutritionStats = [
    { number: "1", label: "Dự án nghiên cứu", icon: <BiGroup className="text-2xl" /> },
    { number: "RAG", label: "Công nghệ AI", icon: <BiUser className="text-2xl" /> },
    { number: "Beta", label: "Phiên bản thử nghiệm", icon: <BiDish className="text-2xl" /> },
    { number: "R&D", label: "Giai đoạn phát triển", icon: <BiHeart className="text-2xl" /> }
  ];

  const faqs = [
    {
      question: "Nutribot hiện tại ở giai đoạn nào?",
      answer: "Nutribot hiện đang trong giai đoạn nghiên cứu và phát triển như một đề tài tốt nghiệp. Đây là phiên bản thử nghiệm (beta) chưa được triển khai thương mại."
    },
    {
      question: "Tôi có thể sử dụng Nutribot cho trường của mình không?",
      answer: "Hiện tại Nutribot chỉ là dự án nghiên cứu và chưa sẵn sàng cho việc sử dụng thương mại. Chúng tôi sẽ cân nhắc phát triển thêm nếu kết quả nghiên cứu tích cực."
    },
    {
      question: "Nguồn dữ liệu của Nutribot từ đâu?",
      answer: "Nutribot sử dụng tài liệu chính thức từ Bộ Giáo dục và Đào tạo Việt Nam về dinh dưỡng học đường làm nguồn dữ liệu chính."
    },
    {
      question: "Công nghệ nào được sử dụng trong Nutribot?",
      answer: "Nutribot sử dụng công nghệ RAG (Retrieval-Augmented Generation) kết hợp với mô hình ngôn ngữ lớn để cung cấp thông tin chính xác về dinh dưỡng."
    },
    {
      question: "Khi nào Nutribot sẽ được triển khai thực tế?",
      answer: "Việc triển khai thực tế sẽ phụ thuộc vào kết quả nghiên cứu và đánh giá từ các chuyên gia giáo dục. Hiện tại chúng tôi tập trung hoàn thiện hệ thống."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                <BiLeaf className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-emerald-900">Nutribot</h1>
                <p className="text-xs text-gray-500">Dự án nghiên cứu</p>
              </div>
            </div>

            {userData ? (
              <Link to="/chat">
                <Button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-full font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg">
                  Vào ứng dụng
                </Button>
              </Link>
            ) : (
              <div className="flex space-x-3">
                <Link to="/login">
                  <Button className="border-2 border-green-500 text-green-600 px-6 py-2 rounded-full font-semibold hover:bg-green-50 transition-all">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-full font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg">
                    Dùng thử nghiệm
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 pt-20 pb-32">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-blue-200 rounded-full opacity-15 animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-200 rounded-full opacity-10 animate-pulse delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left">
              <div className="mb-6">
                <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
                  🚧 Dự án nghiên cứu & phát triển
                </span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-8">
                <span className="text-gray-900">Dinh dưỡng</span>
                <br />
                <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  học đường
                </span>
                <br />
                <span className="text-gray-900">thông minh</span>
              </h1>

              <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl">
                Dự án nghiên cứu chatbot AI đầu tiên tại Việt Nam chuyên về dinh dưỡng học đường,
                sử dụng công nghệ RAG để cung cấp thông tin chính xác từ tài liệu Bộ GD&ĐT.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Link to={userData ? "/chat" : "/register"}>
                  <Button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-green-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                    <BiRocket className="mr-2" />
                    Thử nghiệm Beta
                  </Button>
                </Link>
                <a href="#features">
                  <Button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all">
                    <BiBook className="mr-2" />
                    Tìm hiểu thêm
                  </Button>
                </a>
              </div>

              {/* Project Status */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <BiTime className="text-blue-500 mr-2" />
                  Tiến độ dự án:
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Nghiên cứu & thu thập dữ liệu</span>
                    <span className="text-green-600 font-medium">✓ Hoàn thành</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Phát triển mô hình RAG</span>
                    <span className="text-green-600 font-medium">✓ Hoàn thành</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Testing & Đánh giá</span>
                    <span className="text-blue-400 font-medium">🔄 Đang thực hiện</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Demo Preview */}
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-blue-500"></div>

                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-gray-500 ml-auto">Demo Preview</span>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <p className="text-gray-700 text-sm">
                        "Chế độ ăn nào phù hợp cho học sinh tiểu học?"
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <BiLeaf className="text-green-500" />
                        <span className="font-medium text-sm text-gray-700">Nutribot Beta</span>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Theo tài liệu của Bộ GD&ĐT, học sinh tiểu học cần chế độ ăn cân bằng với
                        đủ protein, vitamin và khoáng chất để hỗ trợ quá trình phát triển...
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-400 to-green-500 p-4 rounded-xl text-white text-center">
                    <div className="text-2xl font-bold">Beta</div>
                    <div className="text-sm opacity-90">Phiên bản</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-400 to-blue-500 p-4 rounded-xl text-white text-center">
                    <div className="text-2xl font-bold">R&D</div>
                    <div className="text-sm opacity-90">Giai đoạn</div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-yellow-300 rounded-full flex items-center justify-center animate-bounce">
                <BiSun className="text-yellow-600 text-2xl" />
              </div>
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-pink-300 rounded-full flex items-center justify-center animate-bounce delay-1000">
                <BiHeart className="text-pink-600 text-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Thông tin thực tế về dự án */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {nutritionStats.map((stat, index) => (
              <div key={index} className="text-center group hover:scale-105 transition-transform">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white group-hover:shadow-lg transition-shadow">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Tính năng <span className="text-green-600">nghiên cứu</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Khám phá các tính năng đang được phát triển trong dự án Nutribot
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {schoolNutritionFeatures.map((feature, index) => (
                <div
                  key={index}
                  className={`cursor-pointer transition-all duration-300 ${activeFeature === index ? 'scale-105' : ''
                    }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className={`rounded-2xl p-6 border-2 transition-all ${activeFeature === index
                    ? 'bg-white shadow-xl border-green-500'
                    : 'bg-white/50 border-gray-200 hover:border-green-300'
                    }`}>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white bg-gradient-to-r ${feature.color}`}>
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                        <span className="text-sm text-gray-500">Tính năng nghiên cứu</span>
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                <div className={`text-center mb-6 p-4 rounded-xl bg-gradient-to-r ${schoolNutritionFeatures[activeFeature].color} text-white`}>
                  <div className="text-4xl mb-2">{schoolNutritionFeatures[activeFeature].icon}</div>
                  <h3 className="text-xl font-bold">{schoolNutritionFeatures[activeFeature].title}</h3>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Khả năng dự kiến:</h4>
                  {schoolNutritionFeatures[activeFeature].details.map((detail, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <BiCheckCircle className="text-green-500 flex-shrink-0" />
                      <span className="text-gray-600">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Ứng dụng <span className="text-green-600">tiềm năng</span>
            </h2>
            <p className="text-xl text-gray-600">
              Các trường hợp sử dụng dự kiến cho từng cấp học
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {schoolUseCases.map((useCase, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 border border-gray-200 hover:shadow-xl transition-all hover:border-green-300">
                <div className="flex items-center space-x-4 mb-6">
                  {useCase.icon}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{useCase.title}</h3>
                    <span className="text-green-600 font-medium">{useCase.studentAge}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <BiHappy className="text-orange-500 mr-2" />
                      Thách thức:
                    </h4>
                    <p className="text-gray-600 leading-relaxed">{useCase.challenge}</p>
                  </div>

                  <div className="bg-green-50 rounded-2xl p-6 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <BiBrain className="text-green-500 mr-2" />
                      Giải pháp dự kiến:
                    </h4>
                    <p className="text-gray-700 leading-relaxed">{useCase.solution}</p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <BiTrophy className="text-yellow-500 mr-2" />
                      Lợi ích tiềm năng:
                    </h4>
                    {useCase.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <BiCheckCircle className="text-green-500 flex-shrink-0" />
                        <span className="text-gray-600">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Về dự án */}
      <section id="testimonials" className="py-24 bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-6xl mx-auto px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">Về dự án nghiên cứu</h2>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              Thông tin về quá trình phát triển và mục tiêu của Nutribot
            </p>
          </div>

          <div className="relative">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 text-center">
              <div className="flex justify-center mb-6">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <BiStar key={i} className="text-yellow-400 text-2xl" />
                ))}
              </div>

              <blockquote className="text-2xl font-medium mb-8 leading-relaxed">
                "{testimonials[currentTestimonial].content}"
              </blockquote>

              <div className="flex items-center justify-center space-x-8 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-300">{testimonials[currentTestimonial].students}</div>
                  <div className="text-sm text-gray-300">Loại dự án</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-300">{testimonials[currentTestimonial].improvement}</div>
                  <div className="text-sm text-gray-300">Tình trạng</div>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center">
                  <BiUser className="text-white text-2xl" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-xl">{testimonials[currentTestimonial].name}</div>
                  <div className="text-green-200">{testimonials[currentTestimonial].role}</div>
                </div>
              </div>
            </div>

            {/* Testimonial Indicators */}
            <div className="flex justify-center space-x-3 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all ${currentTestimonial === index ? 'bg-white scale-125' : 'bg-white/50'
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Câu hỏi <span className="text-green-600">thường gặp</span>
            </h2>
            <p className="text-xl text-gray-600">
              Giải đáp những thắc mắc về dự án nghiên cứu Nutribot
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <button
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  {openFaq === index ? (
                    <BiMinus className="text-gray-500 flex-shrink-0" />
                  ) : (
                    <BiPlus className="text-gray-500 flex-shrink-0" />
                  )}
                </button>

                {openFaq === index && (
                  <div className="px-8 pb-6">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-gradient-to-br from-green-900 to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold mb-8">
            Quan tâm đến <span className="text-green-300">dự án</span>?
          </h2>
          <p className="text-xl text-green-100 mb-12 leading-relaxed">
            Nếu bạn là nhà giáo dục, nhà nghiên cứu hoặc quan tâm đến việc ứng dụng AI trong giáo dục,
            hãy liên hệ để tìm hiểu thêm về dự án.
          </p>

          <div className="space-y-6">
            <Link to={userData ? "/chat" : "/register"}>
              <Button className="bg-white text-green-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-green-50 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center w-auto mx-auto">
                <BiRocket className="mr-2" />
                Thử nghiệm ngay
              </Button>
            </Link>

            <div className="text-green-200 mt-8">
              <p>Dự án đang trong giai đoạn nghiên cứu và phát triển</p>
              <p className="text-sm opacity-75">Chưa sẵn sàng cho việc sử dụng thương mại</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <BiLeaf className="text-white text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Nutribot</h2>
                  <p className="text-gray-400">Dự án nghiên cứu AI</p>
                </div>
              </div>

              <p className="text-gray-300 leading-relaxed mb-6">
                Dự án nghiên cứu chatbot AI chuyên về dinh dưỡng học đường,
                sử dụng công nghệ RAG để cung cấp thông tin chính xác từ tài liệu chính thức.
              </p>

              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-300">
                  <BiEnvelope className="text-xl" />
                  <span>Dự án R&D - Chưa có thông tin liên hệ thương mại</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <BiMapPin className="text-xl" />
                  <span>Việt Nam - Dự án nghiên cứu học thuật</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-xl mb-6">Nghiên cứu</h3>
              <ul className="space-y-3">
                <li><span className="text-gray-300">Công nghệ RAG</span></li>
                <li><span className="text-gray-300">AI trong giáo dục</span></li>
                <li><span className="text-gray-300">Dinh dưỡng học đường</span></li>
                <li><span className="text-gray-300">NLP tiếng Việt</span></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-xl mb-6">Tài liệu</h3>
              <ul className="space-y-3">
                <li><span className="text-gray-300">Tài liệu Bộ GD&ĐT</span></li>
                <li><span className="text-gray-300">Nghiên cứu khoa học</span></li>
                <li><span className="text-gray-300">Dữ liệu thử nghiệm</span></li>
                <li><span className="text-gray-300">Đánh giá mô hình</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400">
                © 2025 Nutribot Research Project. Dự án nghiên cứu học thuật về AI trong giáo dục 🇻🇳
              </p>

              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <span className="text-gray-400">Chỉ mục đích nghiên cứu</span>
                <span className="text-gray-400">Phiên bản Beta</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;