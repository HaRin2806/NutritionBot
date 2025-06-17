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
      benefits: ["Tăng 25% lượng thức ăn bé ăn được", "Giảm 40% số trẻ biếng ăn", "Tăng trưởng chiều cao đều đặn"]
    },
    {
      icon: <BiBook className="text-3xl text-green-500" />,
      title: "Trường Tiểu Học", 
      studentAge: "6-11 tuổi",
      challenge: "Học sinh cần năng lượng học tập và vận động, nhưng không được béo phì.",
      solution: "Cân bằng protein, carb và chất béo tốt. Nhiều rau xanh, hạn chế đồ ngọt và nước có gas.",
      benefits: ["Tăng 30% khả năng tập trung", "Giảm 50% tỷ lệ béo phì", "Tăng sức đề kháng"]
    },
    {
      icon: <BiTrendingUp className="text-3xl text-purple-500" />,
      title: "Trường THCS & THPT",
      studentAge: "12-18 tuổi",
      challenge: "Thời kỳ dậy thì cần nhiều dinh dưỡng, áp lực học tập cao.",
      solution: "Thực đơn giàu protein, omega-3, vitamin B để hỗ trợ phát triển não bộ và cơ thể.",
      benefits: ["Tăng 20% điểm trung bình", "Giảm stress học tập", "Phát triển thể chất tốt"]
    }
  ];

  const testimonials = [
    {
      name: "Cô Nguyễn Thị Hoa",
      role: "Hiệu trưởng Trường Mầm non Hoa Sen",
      content: "Sau khi áp dụng Nutribot, các bé ăn ngon hơn hẳn. Phụ huynh rất hài lòng với sự thay đổi.",
      rating: 5,
      students: "120 học sinh",
      improvement: "↑ 35% lượng ăn"
    },
    {
      name: "Thầy Trần Văn Nam",
      role: "Phó Hiệu trưởng THCS Lê Quý Đôn",
      content: "Thực đơn khoa học giúp học sinh tập trung học tập tốt hơn. Tỷ lệ ốm vặt giảm rõ rệt.",
      rating: 5,
      students: "800 học sinh", 
      improvement: "↓ 45% ốm vặt"
    },
    {
      name: "Cô Lê Thị Mai",
      role: "Trưởng bộ phận dinh dưỡng THPT Chu Văn An",
      content: "Nutribot giúp chúng tôi quản lý thực đơn hiệu quả, tiết kiệm thời gian và chi phí.",
      rating: 5,
      students: "1200 học sinh",
      improvement: "↓ 20% chi phí"
    }
  ];

  const nutritionStats = [
    { number: "500+", label: "Trường học tin dùng", icon: <BiGroup className="text-2xl" /> },
    { number: "50,000+", label: "Học sinh được hỗ trợ", icon: <BiUser className="text-2xl" /> },
    { number: "1,000+", label: "Thực đơn chuẩn", icon: <BiDish className="text-2xl" /> },
    { number: "99.8%", label: "Độ hài lòng", icon: <BiHeart className="text-2xl" /> }
  ];

  const faqs = [
    {
      question: "Nutribot có phù hợp với mọi cấp học không?",
      answer: "Có, Nutribot được thiết kế cho tất cả cấp học từ mầm non đến THPT. Hệ thống tự động điều chỉnh thực đơn phù hợp với từng độ tuổi và nhu cầu dinh dưỡng cụ thể."
    },
    {
      question: "Chi phí sử dụng Nutribot như thế nào?",
      answer: "Nutribot có gói miễn phí cho các tính năng cơ bản và gói premium cho trường học với nhiều tính năng nâng cao. Liên hệ với chúng tôi để được tư vấn gói phù hợp."
    },
    {
      question: "Thực đơn có phù hợp với điều kiện kinh tế không?",
      answer: "Nutribot cho phép tùy chỉnh ngân sách và tự động đề xuất thực đơn tối ưu trong khung chi phí của trường. Hệ thống ưu tiên nguyên liệu địa phương để giảm chi phí."
    },
    {
      question: "Có hỗ trợ đào tạo sử dụng không?",
      answer: "Có, chúng tôi cung cấp đào tạo miễn phí cho đội ngũ nhà bếp và quản lý. Bao gồm cả hướng dẫn trực tuyến và tại trường khi cần thiết."
    },
    {
      question: "Nutribot có đảm bảo an toàn thực phẩm không?",
      answer: "Nutribot tích hợp đầy đủ tiêu chuẩn an toàn thực phẩm theo quy định của Bộ Y tế, bao gồm quy trình kiểm tra, bảo quản và chế biến thực phẩm."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navbar */}
      <nav className="bg-white py-4 px-6 shadow-lg sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link 
            to="/" 
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <BiLeaf className="text-white text-xl" />
            </div>
            <span className="text-xl font-bold text-mint-900">Nutribot</span>
          </Link>
          
          <div className="hidden lg:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-green-600 transition font-medium">Tính năng</a>
            <a href="#schools" className="text-gray-600 hover:text-green-600 transition font-medium">Ứng dụng</a>
            <a href="#testimonials" className="text-gray-600 hover:text-green-600 transition font-medium">Đánh giá</a>
            <a href="#faq" className="text-gray-600 hover:text-green-600 transition font-medium">FAQ</a>
          </div>
          
          <div className="flex items-center space-x-3">
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
                    Dùng miễn phí
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
                Nền tảng AI đầu tiên tại Việt Nam chuyên về dinh dưỡng học đường, 
                giúp các trường học xây dựng thực đơn khoa học và an toàn cho học sinh.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Link to={userData ? "/chat" : "/register"}>
                  <Button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-2xl w-full sm:w-auto">
                    <BiRocket className="mr-2" />
                    {userData ? "Bắt đầu ngay" : "Dùng thử miễn phí"}
                  </Button>
                </Link>
                <Button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full text-lg font-semibold hover:border-green-500 hover:text-green-600 transition-all w-full sm:w-auto">
                  <BiChat className="mr-2" />
                  Xem demo
                </Button>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-8 text-sm text-gray-500">
                <div className="flex items-center">
                  <BiCheckCircle className="text-green-500 mr-2" />
                  Miễn phí
                </div>
                <div className="flex items-center">
                  <BiCheckCircle className="text-green-500 mr-2" />
                  Không cần thẻ tín dụng
                </div>
                <div className="flex items-center">
                  <BiCheckCircle className="text-green-500 mr-2" />
                  Hỗ trợ 24/7
                </div>
              </div>
            </div>
            
            {/* Hero Image/Demo */}
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-8 transform rotate-2 hover:rotate-0 transition-transform duration-700">
                <div className="space-y-6">
                  {/* Chat Demo */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-2xl">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                        <BiUser className="text-white" />
                      </div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm flex-1">
                        <p className="text-gray-700 font-medium">Làm thế nào để lập thực đơn cho 200 học sinh tiểu học?</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <BiChat className="text-white" />
                      </div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm flex-1">
                        <p className="text-gray-700 mb-3">
                          <strong>Nutribot sẽ giúp bạn:</strong>
                        </p>
                        <ul className="space-y-2 text-gray-600">
                          <li className="flex items-center">
                            <BiBowlRice className="text-green-500 mr-2" />
                            Thực đơn 4 tuần cân bằng dinh dưỡng
                          </li>
                          <li className="flex items-center">
                            <BiDish className="text-blue-500 mr-2" />
                            Tính toán chính xác nguyên liệu
                          </li>
                          <li className="flex items-center">
                            <BiShield className="text-purple-500 mr-2" />
                            Đảm bảo an toàn thực phẩm
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-green-400 to-green-500 p-4 rounded-xl text-white text-center">
                      <div className="text-2xl font-bold">98%</div>
                      <div className="text-sm opacity-90">Hài lòng</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-400 to-blue-500 p-4 rounded-xl text-white text-center">
                      <div className="text-2xl font-bold">50K+</div>
                      <div className="text-sm opacity-90">Học sinh</div>
                    </div>
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

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {nutritionStats.map((stat, index) => (
              <div key={index} className="text-center group hover:scale-105 transition-transform">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg transition-shadow">
                  <div className="text-white">{stat.icon}</div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Tính năng <span className="text-green-600">đột phá</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Nutribot mang đến giải pháp toàn diện cho dinh dưỡng học đường với công nghệ AI tiên tiến
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              {schoolNutritionFeatures.map((feature, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 ${
                    activeFeature === index 
                      ? 'bg-white shadow-2xl scale-105 border-2 border-green-200' 
                      : 'bg-white/70 hover:bg-white hover:shadow-lg'
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white bg-gradient-to-r ${feature.color}`}>
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center space-x-4 mb-8">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white bg-gradient-to-r ${schoolNutritionFeatures[activeFeature].color}`}>
                  {schoolNutritionFeatures[activeFeature].icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {schoolNutritionFeatures[activeFeature].title}
                </h3>
              </div>
              
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                {schoolNutritionFeatures[activeFeature].description}
              </p>
              
              <ul className="space-y-4">
                {schoolNutritionFeatures[activeFeature].details.map((detail, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <BiCheckCircle className="text-green-500 text-xl mt-1 flex-shrink-0" />
                    <span className="text-gray-700 text-lg">{detail}</span>
                  </li>
                ))}
              </ul>
              
              <Link to={userData ? "/chat" : "/register"}>
                <Button className="mt-8 w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl text-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all">
                  Trải nghiệm ngay
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* School Use Cases */}
      <section id="schools" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Phù hợp mọi <span className="text-blue-600">cấp học</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Từ mầm non đến THPT, Nutribot tối ưu dinh dưỡng cho từng giai đoạn phát triển
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {schoolUseCases.map((useCase, index) => (
              <div key={index} className="group hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 shadow-xl group-hover:shadow-2xl border border-gray-100">
                  <div className="flex items-center space-x-4 mb-6">
                    {useCase.icon}
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{useCase.title}</h3>
                      <span className="text-green-600 font-semibold">{useCase.studentAge}</span>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-2xl p-6 mb-6 border-l-4 border-blue-400">
                    <p className="text-gray-700 italic font-medium">"{useCase.challenge}"</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-2xl p-6 mb-6">
                    <p className="text-gray-700 leading-relaxed">{useCase.solution}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <BiTrophy className="text-yellow-500 mr-2" />
                      Kết quả đạt được:
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

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-6xl mx-auto px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">Các trường học nói gì?</h2>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              Hàng trăm trường học đã tin tưởng và đạt được kết quả tuyệt vời
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
                  <div className="text-sm text-gray-300">Học sinh</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-300">{testimonials[currentTestimonial].improvement}</div>
                  <div className="text-sm text-gray-300">Cải thiện</div>
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
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentTestimonial === index ? 'bg-white scale-125' : 'bg-white/50'
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
              Giải đáp những thắc mắc phổ biến về Nutribot
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <button
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-semibold text-lg text-gray-900">{faq.question}</span>
                  <div className={`transform transition-transform ${openFaq === index ? 'rotate-180' : ''}`}>
                    {openFaq === index ? (
                      <BiMinus className="text-green-600 text-2xl" />
                    ) : (
                      <BiPlus className="text-green-600 text-2xl" />
                    )}
                  </div>
                </button>
                
                {openFaq === index && (
                  <div className="px-8 pb-6">
                    <p className="text-gray-600 leading-relaxed text-lg">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center relative">
          <h2 className="text-5xl font-bold text-white mb-8">
            Sẵn sàng cách mạng hóa dinh dưỡng học đường?
          </h2>
          <p className="text-xl text-green-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Hãy để Nutribot giúp trường bạn xây dựng hệ thống dinh dưỡng khoa học, 
            an toàn và hiệu quả ngay hôm nay.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Link to={userData ? "/chat" : "/register"}>
              <Button className="bg-white text-green-600 px-12 py-5 rounded-full text-xl font-bold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl">
                <BiRocket className="mr-3" />
                {userData ? "Bắt đầu ngay" : "Dùng thử miễn phí 30 ngày"}
              </Button>
            </Link>
            
            <div className="flex items-center space-x-6 text-green-100">
              <div className="flex items-center space-x-2">
                <BiCheckCircle className="text-2xl" />
                <span className="text-lg">Không cam kết dài hạn</span>
              </div>
              <div className="flex items-center space-x-2">
                <BiCheckCircle className="text-2xl" />
                <span className="text-lg">Hỗ trợ 24/7</span>
              </div>
            </div>
          </div>
          
          <div className="text-green-100">
            <p className="text-lg">🎉 <strong>Ưu đãi đặc biệt:</strong> Miễn phí hoàn toàn cho 10 trường đăng ký đầu tiên!</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                  <BiLeaf className="text-white text-xl" />
                </div>
                <span className="text-2xl font-bold">Nutribot</span>
                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">Học Đường</span>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed text-lg">
                Nền tảng AI hàng đầu Việt Nam cho dinh dưỡng học đường, 
                mang đến giải pháp toàn diện cho sức khỏe học sinh.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-300">
                  <BiEnvelope className="text-xl" />
                  <span>truong@nutribot.vn</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <BiBluetooth className="text-xl" />
                  <span>1900-NUTRIBOT</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <BiMapPin className="text-xl" />
                  <span>Tòa nhà FPT, Nam Từ Liêm, Hà Nội</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-xl mb-6">Giải pháp</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-300 hover:text-green-400 transition">Dinh dưỡng mầm non</a></li>
                <li><a href="#" className="text-gray-300 hover:text-green-400 transition">Thực đơn tiểu học</a></li>
                <li><a href="#" className="text-gray-300 hover:text-green-400 transition">THCS & THPT</a></li>
                <li><a href="#" className="text-gray-300 hover:text-green-400 transition">Quản lý bếp ăn</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-xl mb-6">Hỗ trợ</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-300 hover:text-green-400 transition">Hướng dẫn sử dụng</a></li>
                <li><a href="#" className="text-gray-300 hover:text-green-400 transition">Đào tạo</a></li>
                <li><a href="#" className="text-gray-300 hover:text-green-400 transition">Liên hệ</a></li>
                <li><a href="#" className="text-gray-300 hover:text-green-400 transition">Báo cáo lỗi</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400">
                &copy; 2024 Nutribot. Bản quyền thuộc về công ty. Phát triển bởi đội ngũ Việt Nam 🇻🇳
              </p>
              
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-green-400 transition">Chính sách bảo mật</a>
                <a href="#" className="text-gray-400 hover:text-green-400 transition">Điều khoản</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;