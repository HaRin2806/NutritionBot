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
  BiBluetooth,
  BiMenu,
  BiX
} from 'react-icons/bi';
import { Button } from '../components/common';
import { useApp } from '../contexts/AppContext';

const LandingPage = () => {
  const { userData } = useApp();
  const [activeFeature, setActiveFeature] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const schoolNutritionFeatures = [
    {
      icon: <BiBook className="text-2xl" />,
      title: "Tư Vấn Dinh Dưỡng Theo Độ Tuổi",
      description: "Cung cấp lời khuyên dinh dưỡng phù hợp cho từng nhóm tuổi từ mầm non đến THPT.",
      details: [
        "Thực đơn phù hợp cho từng độ tuổi",
        "Hướng dẫn tính toán khẩu phần ăn",
        "Lời khuyên về chế độ ăn lành mạnh"
      ],
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <BiBowlRice className="text-2xl" />,
      title: "Lập Thực Đơn Học Đường",
      description: "Hỗ trợ tạo thực đơn cân bằng dinh dưỡng cho bữa ăn học đường.",
      details: [
        "Thực đơn 4 tuần không trùng lặp",
        "Tính toán calories và vi chất dinh dưỡng",
        "Phù hợp với điều kiện địa phương"
      ],
      color: "from-green-500 to-green-600"
    },
    {
      icon: <BiShield className="text-2xl" />,
      title: "An Toàn Thực Phẩm",
      description: "Hướng dẫn đảm bảo an toàn vệ sinh thực phẩm tại trường học.",
      details: [
        "Quy trình kiểm tra thực phẩm",
        "Hướng dẫn bảo quản an toàn",
        "Phòng ngừa ngộ độc thực phẩm"
      ],
      color: "from-red-500 to-red-600"
    },
    {
      icon: <BiTrophy className="text-2xl" />,
      title: "Đánh Giá Tình Trạng Dinh Dưỡng",
      description: "Hướng dẫn đánh giá và theo dõi tình trạng dinh dưỡng học sinh.",
      details: [
        "Phương pháp nhân trắc học",
        "Biểu đồ tăng trưởng",
        "Phát hiện sớm vấn đề dinh dưỡng"
      ],
      color: "from-purple-500 to-purple-600"
    }
  ];

  const ageGroups = [
    {
      icon: <BiGroup className="text-2xl text-blue-500" />,
      title: "Mầm Non",
      ageRange: "3-5 tuổi",
      description: "Dinh dưỡng cho giai đoạn phát triển nhanh về thể chất và trí tuệ.",
      features: ["Thực đơn đa dạng màu sắc", "Dễ nhai và tiêu hóa", "Tăng cường vitamin và khoáng chất"]
    },
    {
      icon: <BiBook className="text-2xl text-green-500" />,
      title: "Tiểu Học",
      ageRange: "6-11 tuổi",
      description: "Dinh dưỡng hỗ trợ học tập và hoạt động thể chất tăng cao.",
      features: ["Cân bằng năng lượng", "Hỗ trợ tập trung học tập", "Tăng cường sức đề kháng"]
    },
    {
      icon: <BiTrendingUp className="text-2xl text-purple-500" />,
      title: "THCS",
      ageRange: "12-14 tuổi",
      description: "Dinh dưỡng cho giai đoạn tiền dậy thì với nhu cầu tăng cao.",
      features: ["Tăng cường canxi", "Hỗ trợ phát triển cơ thể", "Cân bằng hormone"]
    },
    {
      icon: <BiRocket className="text-2xl text-orange-500" />,
      title: "THPT",
      ageRange: "15-19 tuổi",
      description: "Dinh dưỡng cho giai đoạn dậy thì và chuẩn bị trưởng thành.",
      features: ["Hỗ trợ học tập căng thẳng", "Tăng cường trí nhớ", "Phát triển toàn diện"]
    }
  ];

  const testimonials = [
    {
      name: "Cô Minh Hương",
      role: "Giáo viên Mầm non",
      content: "Nutribot giúp tôi hiểu rõ hơn về dinh dưỡng phù hợp cho các bé. Thực đơn được gợi ý rất thực tế và dễ thực hiện.",
      rating: 5,
      school: "Trường MN Hoa Sen",
      improvement: "Cải thiện 90%"
    },
    {
      name: "Thầy Văn Đức",
      role: "Hiệu trưởng",
      content: "Hệ thống tư vấn dinh dưỡng toàn diện, giúp nhà trường lập kế hoạch bữa ăn học đường hiệu quả.",
      rating: 5,
      school: "THCS Lê Quý Đôn",
      improvement: "Tăng 85%"
    },
    {
      name: "Cô Thu Thảo",
      role: "Y tế trường học",
      content: "Thông tin về an toàn thực phẩm rất chi tiết và cập nhật. Giúp chúng tôi đảm bảo sức khỏe học sinh tốt hơn.",
      rating: 5,
      school: "THPT Nguyễn Trãi",
      improvement: "Hiệu quả 95%"
    }
  ];

  const nutritionStats = [
    { number: "5", label: "Nhóm tuổi hỗ trợ", icon: <BiGroup className="text-xl" /> },
    { number: "1000+", label: "Câu hỏi được trả lời", icon: <BiChat className="text-xl" /> },
    { number: "24/7", label: "Hỗ trợ không giới hạn", icon: <BiTime className="text-xl" /> },
    { number: "100%", label: "Dựa trên tài liệu chính thức", icon: <BiShield className="text-xl" /> }
  ];

  const faqs = [
    {
      question: "Nutribot hỗ trợ tư vấn cho những độ tuổi nào?",
      answer: "Nutribot hỗ trợ tư vấn dinh dưỡng cho học sinh từ mầm non đến THPT (3-19 tuổi), bao gồm cả trẻ nhà trẻ (1-2 tuổi). Mỗi độ tuổi có những khuyến nghị dinh dưỡng riêng phù hợp với giai đoạn phát triển."
    },
    {
      question: "Thông tin dinh dưỡng có đáng tin cậy không?",
      answer: "Tất cả thông tin được Nutribot cung cấp đều dựa trên tài liệu chính thức của Bộ Giáo dục và Đào tạo Việt Nam về dinh dưỡng và an toàn thực phẩm học đường."
    },
    {
      question: "Nutribot có thể lập thực đơn cho trường học không?",
      answer: "Có, Nutribot có thể hướng dẫn lập thực đơn cân bằng dinh dưỡng cho bữa ăn học đường, tính toán khẩu phần phù hợp với từng độ tuổi và điều kiện của trường."
    },
    {
      question: "Làm sao để sử dụng Nutribot hiệu quả?",
      answer: "Bạn chỉ cần đặt câu hỏi cụ thể về dinh dưỡng, thực đơn, hoặc an toàn thực phẩm. Nutribot sẽ cung cấp thông tin chi tiết và hướng dẫn thực tế dựa trên tài liệu chuyên môn."
    },
    {
      question: "Nutribot có thu phí sử dụng không?",
      answer: "Hiện tại Nutribot miễn phí cho tất cả người dùng. Chỉ cần đăng ký tài khoản là có thể sử dụng đầy đủ các tính năng tư vấn dinh dưỡng."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation - Header thống nhất */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <BiLeaf className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-emerald-900">Nutribot</h1>
                <p className="text-xs text-gray-500">Tư vấn dinh dưỡng học đường</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-green-600 transition-colors">
                Tính năng
              </a>
              <a href="#age-groups" className="text-gray-600 hover:text-green-600 transition-colors">
                Độ tuổi hỗ trợ
              </a>
              <a href="#testimonials" className="text-gray-600 hover:text-green-600 transition-colors">
                Đánh giá
              </a>
              <a href="#faq" className="text-gray-600 hover:text-green-600 transition-colors">
                FAQ
              </a>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex space-x-3">
              {userData ? (
                <Link to="/chat">
                  <Button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all">
                    Vào ứng dụng
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button className="border border-green-500 text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-all">
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all">
                      Đăng ký
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <BiX className="text-xl" /> : <BiMenu className="text-xl" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-100">
              <div className="px-4 py-4 space-y-4">
                <a href="#features" className="block text-gray-600 hover:text-green-600">
                  Tính năng
                </a>
                <a href="#age-groups" className="block text-gray-600 hover:text-green-600">
                  Độ tuổi hỗ trợ
                </a>
                <a href="#testimonials" className="block text-gray-600 hover:text-green-600">
                  Đánh giá
                </a>
                <a href="#faq" className="block text-gray-600 hover:text-green-600">
                  FAQ
                </a>
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  {userData ? (
                    <Link to="/chat" className="block">
                      <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-medium">
                        Vào ứng dụng
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link to="/login" className="block">
                        <Button className="w-full border border-green-500 text-green-600 px-4 py-2 rounded-lg font-medium">
                          Đăng nhập
                        </Button>
                      </Link>
                      <Link to="/register" className="block">
                        <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-medium">
                          Đăng ký
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="mb-6">
                <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                  🤖 AI Tư vấn dinh dưỡng học đường
                </span>
              </div>

              <h1 className="text-3xl lg:text-5xl font-bold leading-tight mb-6">
                <span className="text-gray-900">Tư vấn dinh dưỡng</span>
                <br />
                <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  học đường thông minh
                </span>
              </h1>

              <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-xl">
                Chatbot AI tư vấn dinh dưỡng học đường. 
                Cung cấp lời khuyên chuyên môn dựa trên tài liệu chính thức của Bộ GD&ĐT.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                {userData ? (
                  <Link to="/chat">
                    <Button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-medium text-base hover:from-green-600 hover:to-green-700 transition-all shadow-lg">
                      <BiChat className="mr-2" />
                      Bắt đầu tư vấn
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/register">
                      <Button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-medium text-base hover:from-green-600 hover:to-green-700 transition-all shadow-lg">
                        <BiRocket className="mr-2" />
                        Đăng ký miễn phí
                      </Button>
                    </Link>
                    <a href="#features">
                      <Button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium text-base hover:bg-gray-50 transition-all">
                        <BiBook className="mr-2" />
                        Tìm hiểu thêm
                      </Button>
                    </a>
                  </>
                )}
              </div>

              {/* Quick Info */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-gray-600">
                    <BiShield className="text-green-500 mr-1" />
                    Miễn phí 100%
                  </span>
                  <span className="flex items-center text-gray-600">
                    <BiUser className="text-blue-500 mr-1" />
                    Hỗ trợ 0-19 tuổi
                  </span>
                  <span className="flex items-center text-gray-600">
                    <BiTime className="text-purple-500 mr-1" />
                    24/7
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side - Demo Preview */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-blue-500"></div>

                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-gray-500 ml-auto">Nutribot Demo</span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-gray-700 text-sm">
                        "Thực đơn nào phù hợp cho học sinh tiểu học?"
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <BiLeaf className="text-green-500 text-sm" />
                        <span className="font-medium text-xs text-gray-700">Nutribot</span>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Học sinh tiểu học (6-11 tuổi) cần chế độ ăn cân bằng với 8-13 đơn vị ngũ cốc, 
                        2-3 đơn vị rau củ, và 4-6 đơn vị protein mỗi ngày...
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mini Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-green-400 to-green-500 p-3 rounded-lg text-white text-center">
                    <div className="text-lg font-bold">5</div>
                    <div className="text-xs opacity-90">Nhóm tuổi</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-400 to-blue-500 p-3 rounded-lg text-white text-center">
                    <div className="text-lg font-bold">AI</div>
                    <div className="text-xs opacity-90">Công nghệ</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {nutritionStats.map((stat, index) => (
              <div key={index} className="text-center group hover:scale-105 transition-transform">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3 text-white group-hover:shadow-lg transition-shadow">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.number}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tính năng <span className="text-green-600">nổi bật</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Nutribot cung cấp tư vấn toàn diện về dinh dưỡng và an toàn thực phẩm học đường
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              {schoolNutritionFeatures.map((feature, index) => (
                <div
                  key={index}
                  className={`cursor-pointer transition-all duration-300 ${activeFeature === index ? 'scale-105' : ''
                    }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className={`rounded-xl p-6 border-2 transition-all ${activeFeature === index
                    ? 'bg-white shadow-lg border-green-500'
                    : 'bg-white/50 border-gray-200 hover:border-green-300'
                    }`}>
                    <div className="flex items-center space-x-4 mb-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white bg-gradient-to-r ${feature.color}`}>
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{feature.title}</h3>
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className={`text-center mb-6 p-4 rounded-xl bg-gradient-to-r ${schoolNutritionFeatures[activeFeature].color} text-white`}>
                  <div className="text-3xl mb-2">{schoolNutritionFeatures[activeFeature].icon}</div>
                  <h3 className="text-lg font-bold">{schoolNutritionFeatures[activeFeature].title}</h3>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Nutribot có thể giúp:</h4>
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

      {/* Age Groups Section */}
      <section id="age-groups" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Hỗ trợ <span className="text-green-600">mọi độ tuổi</span>
            </h2>
            <p className="text-lg text-gray-600">
              Từ mầm non đến THPT, Nutribot cung cấp tư vấn phù hợp với từng giai đoạn phát triển
            </p>
          </div>

          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
            {ageGroups.map((group, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all hover:border-green-300">
                <div className="flex items-center space-x-3 mb-4">
                  {group.icon}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{group.title}</h3>
                    <span className="text-green-600 font-medium text-sm">{group.ageRange}</span>
                  </div>
                </div>

                <p className="text-gray-600 mb-4 text-sm leading-relaxed">{group.description}</p>

                <div className="space-y-2">
                  {group.features.map((feature, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <BiCheckCircle className="text-green-500 flex-shrink-0 text-sm" />
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Đánh giá từ người dùng</h2>
            <p className="text-lg text-green-100 max-w-2xl mx-auto">
              Những phản hồi tích cực từ các giáo viên và nhân viên y tế trường học
            </p>
          </div>

          <div className="relative">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
              <div className="flex justify-center mb-4">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <BiStar key={i} className="text-yellow-400 text-lg" />
                ))}
              </div>

              <blockquote className="text-lg font-medium mb-6 leading-relaxed">
                "{testimonials[currentTestimonial].content}"
              </blockquote>

              <div className="flex items-center justify-center space-x-6 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-300">{testimonials[currentTestimonial].school}</div>
                  <div className="text-sm text-gray-300">Trường học</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-300">{testimonials[currentTestimonial].improvement}</div>
                  <div className="text-sm text-gray-300">Cải thiện</div>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center">
                  <BiUser className="text-white text-lg" />
                </div>
                <div className="text-left">
                  <div className="font-bold">{testimonials[currentTestimonial].name}</div>
                  <div className="text-green-200 text-sm">{testimonials[currentTestimonial].role}</div>
                </div>
              </div>
            </div>

            {/* Testimonial Indicators */}
            <div className="flex justify-center space-x-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-all ${currentTestimonial === index ? 'bg-white scale-125' : 'bg-white/50'
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Câu hỏi <span className="text-green-600">thường gặp</span>
            </h2>
            <p className="text-lg text-gray-600">
              Giải đáp những thắc mắc về Nutribot
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
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
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-green-900 to-blue-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Sẵn sàng bắt đầu <span className="text-green-300">tư vấn dinh dưỡng</span>?
          </h2>
          <p className="text-lg text-green-100 mb-8 leading-relaxed">
            Đăng ký miễn phí ngay hôm nay để nhận tư vấn chuyên nghiệp về dinh dưỡng học đường
            từ Nutribot - trợ lý AI thông minh của bạn.
          </p>

          <div className="space-y-4">
            {userData ? (
              <Link to="/chat">
                <Button className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-green-50 transition-all shadow-lg hover:shadow-xl flex items-center justify-center w-auto mx-auto">
                  <BiChat className="mr-2" />
                  Bắt đầu tư vấn ngay
                </Button>
              </Link>
            ) : (
              <Link to="/register">
                <Button className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-green-50 transition-all shadow-lg hover:shadow-xl flex items-center justify-center w-auto mx-auto">
                  <BiRocket className="mr-2" />
                  Đăng ký miễn phí
                </Button>
              </Link>
            )}

            <div className="text-green-200 mt-6">
              <p>✓ Hoàn toàn miễn phí</p>
              <p className="text-sm opacity-75">✓ Không cần thông tin thanh toán</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <BiLeaf className="text-white text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Nutribot</h2>
                  <p className="text-gray-400 text-sm">Tư vấn dinh dưỡng học đường</p>
                </div>
              </div>

              <p className="text-gray-300 leading-relaxed mb-4 text-sm">
                Chatbot AI tư vấn dinh dưỡng học đường,
                dựa trên tài liệu chính thức của Bộ Giáo dục và Đào tạo.
              </p>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gray-300 text-sm">
                  <BiEnvelope className="text-lg" />
                  <span>support@nutribot.vn</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300 text-sm">
                  <BiMapPin className="text-lg" />
                  <span>Việt Nam</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Tính năng</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="text-gray-300">Tư vấn dinh dưỡng</span></li>
                <li><span className="text-gray-300">Lập thực đơn</span></li>
                <li><span className="text-gray-300">An toàn thực phẩm</span></li>
                <li><span className="text-gray-300">Đánh giá phát triển</span></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Hỗ trợ</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="text-gray-300">Trẻ nhỏ (0-2 tuổi)</span></li>
                <li><span className="text-gray-300">Mầm non (3-5 tuổi)</span></li>
                <li><span className="text-gray-300">Tiểu học (6-11 tuổi)</span></li>
                <li><span className="text-gray-300">THCS (12-14 tuổi)</span></li>
                <li><span className="text-gray-300">THPT (15-19 tuổi)</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2025 Nutribot. Tất cả quyền được bảo lưu tại Việt Nam.
              </p>

              <div className="flex items-center space-x-6 mt-4 md:mt-0 text-sm">
                <span className="text-gray-400">Dựa trên tài liệu Bộ GD&ĐT</span>
                <span className="text-gray-400">AI Technology</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;