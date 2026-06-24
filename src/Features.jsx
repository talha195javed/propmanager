import { Building2, Users, Home, BarChart3, FileText, Wrench, CheckCircle, ArrowRight, ChevronDown, ChevronUp, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'

function Features() {
  const [openFeature, setOpenFeature] = useState(null)
  const [hoveredFeature, setHoveredFeature] = useState(null)

  const features = [
    {
      id: 'payment-uploads',
      title: 'Property Management',
      details: 'Stay organized, reduce manual tracking, and always know how your portfolio is performing.',
      image: '/feature-grid-1.svg'
    },
    {
      id: 'property-tracking',
      title: 'Lease Management',
      details: 'Avoid compliance issues, reduce paperwork, and speed up leasing cycles.',
      image: '/feature-grid-2.svg'
    },
    {
      id: 'lease-management',
      title: 'Payment Processing',
      details: 'Improve cash flow, reduce delays, and eliminate manual follow-ups.',
      image: '/feature-grid-3.svg'
    },
    {
      id: 'maintenance-workflow',
      title: 'Maintenance Management',
      details: 'Deliver better tenant experiences while keeping maintenance under control.',
      image: '/feature-grid-4.svg'
    },
    {
      id: 'rent-reminders',
      title: 'Financial Reporting',
      details: 'Understand your profitability clearly and make data-driven decisions.',
      image: '/feature-grid-5.svg'
    },
    {
      id: 'document-storage',
      title: 'Tenant Communication',
      details: 'Reduce communication gaps and provide a modern tenant experience.',
      image: '/feature-grid-6.svg'
    }
  ]

  const toggleFeature = (id) => {
    // If clicking the same one, close it. If clicking a different one, open it and close any previous
    setOpenFeature(openFeature === id ? null : id)
  }

  const handleMouseEnter = (id) => {
    setHoveredFeature(id)
    // Close any previously clicked feature when hovering over a new one
    setOpenFeature(null)
  }

  const handleMouseLeave = () => {
    setHoveredFeature(null)
  }

  const isOpen = (id) => {
    // Show if hovered OR if clicked
    return hoveredFeature === id || openFeature === id
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-[#F4F4F4] backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="w-full px-28 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-2xl font-bold text-gray-900"><svg width="152" height="29" viewBox="0 0 152 29" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.49513 22.9912L14.5 15L22.4905 22.9912L22.4905 9.99102L14.5 5L6.49275 9.99095L6.49513 22.9912Z" fill="url(#paint0_linear_71_12984)"/>
              <path d="M36.0144 16.7028H32.9554V21.4908H30.5234V7.60184H36.0144C38.8074 7.60184 40.6124 9.42584 40.6124 12.1428C40.6124 14.8218 38.7884 16.7028 36.0144 16.7028ZM35.5394 9.76784H32.9554V14.5368H35.5014C37.1734 14.5368 38.0664 13.6438 38.0664 12.1238C38.0664 10.6038 37.1544 9.76784 35.5394 9.76784ZM48.3961 12.0668V14.2138H47.5411C45.8691 14.2138 44.8241 15.1068 44.8241 16.9308V21.4908H42.5061V12.1238H44.6911L44.8241 13.4918C45.2231 12.5608 46.1161 11.9338 47.3701 11.9338C47.6931 11.9718 48.0161 11.9718 48.3961 12.0668ZM49.2887 16.7788C49.2887 13.8528 51.3977 11.8388 54.3047 11.8388C57.2117 11.8388 59.3207 13.8528 59.3207 16.7788C59.3207 19.7048 57.2117 21.7188 54.3047 21.7188C51.3977 21.7188 49.2887 19.7048 49.2887 16.7788ZM51.6067 16.7788C51.6067 18.4888 52.7087 19.6478 54.3047 19.6478C55.9007 19.6478 57.0027 18.4888 57.0027 16.7788C57.0027 15.0688 55.9007 13.9098 54.3047 13.9098C52.7087 13.9098 51.6067 15.0688 51.6067 16.7788ZM61.3481 25.8418V12.1048H63.4951L63.6471 13.5298C64.2171 12.4468 65.4521 11.8198 66.8771 11.8198C69.5181 11.8198 71.2661 13.7388 71.2661 16.6838C71.2661 19.6098 69.6701 21.7378 66.8771 21.7378C65.4711 21.7378 64.2551 21.1868 63.6661 20.2368V25.8418H61.3481ZM63.6851 16.7978C63.6851 18.4888 64.7301 19.6478 66.3261 19.6478C67.9601 19.6478 68.9291 18.4698 68.9291 16.7978C68.9291 15.1258 67.9601 13.9288 66.3261 13.9288C64.7301 13.9288 63.6851 15.1068 63.6851 16.7978ZM75.9997 21.4908H73.6437V7.60184H75.9997L80.4837 18.6598L84.9677 7.60184H87.3617V21.4908H85.0057V17.2158C85.0057 14.4228 85.0057 13.6058 85.1387 12.6178L81.6047 21.4908H79.3627L75.8477 12.6368C75.9807 13.4728 75.9997 14.7838 75.9997 16.5128V21.4908ZM93.0767 21.7378C91.0817 21.7378 89.8657 20.5788 89.8657 18.8118C89.8657 17.0828 91.1197 15.9998 93.3427 15.8288L96.1547 15.6198V15.4108C96.1547 14.1378 95.3947 13.6248 94.2167 13.6248C92.8487 13.6248 92.0887 14.1948 92.0887 15.1828H90.1127C90.1127 13.1498 91.7847 11.8198 94.3307 11.8198C96.8577 11.8198 98.4157 13.1878 98.4157 15.7908V21.4908H96.3827L96.2117 20.1038C95.8127 21.0728 94.5397 21.7378 93.0767 21.7378ZM93.8367 19.9898C95.2617 19.9898 96.1737 19.1348 96.1737 17.6908V17.1968L94.2167 17.3488C92.7727 17.4818 92.2217 17.9568 92.2217 18.7168C92.2217 19.5718 92.7917 19.9898 93.8367 19.9898ZM103.201 21.4908H100.883V12.1048H103.03L103.22 13.3208C103.809 12.3708 104.949 11.8198 106.222 11.8198C108.578 11.8198 109.794 13.2828 109.794 15.7148V21.4908H107.476V16.2658C107.476 14.6888 106.697 13.9288 105.5 13.9288C104.075 13.9288 103.201 14.9168 103.201 16.4368V21.4908ZM115.054 21.7378C113.059 21.7378 111.843 20.5788 111.843 18.8118C111.843 17.0828 113.097 15.9998 115.32 15.8288L118.132 15.6198V15.4108C118.132 14.1378 117.372 13.6248 116.194 13.6248C114.826 13.6248 114.066 14.1948 114.066 15.1828H112.09C112.09 13.1498 113.762 11.8198 116.308 11.8198C118.835 11.8198 120.393 13.1878 120.393 15.7908V21.4908H118.36L118.189 20.1038C117.79 21.0728 116.517 21.7378 115.054 21.7378ZM115.814 19.9898C117.239 19.9898 118.151 19.1348 118.151 17.6908V17.1968L116.194 17.3488C114.75 17.4818 114.199 17.9568 114.199 18.7168C114.199 19.5718 114.769 19.9898 115.814 19.9898ZM122.329 16.5888C122.329 13.8528 124.115 11.8008 126.794 11.8008C128.2 11.8008 129.302 12.3898 129.853 13.3968L129.986 12.1048H132.133V21.0158C132.133 24.1508 130.252 26.1078 127.212 26.1078C124.514 26.1078 122.671 24.5688 122.386 22.0608H124.704C124.856 23.2768 125.787 23.9988 127.212 23.9988C128.808 23.9988 129.834 22.9918 129.834 21.4338V19.8758C129.245 20.7498 128.086 21.3008 126.737 21.3008C124.077 21.3008 122.329 19.3058 122.329 16.5888ZM124.666 16.5318C124.666 18.1088 125.673 19.2868 127.193 19.2868C128.789 19.2868 129.777 18.1658 129.777 16.5318C129.777 14.9358 128.808 13.8338 127.193 13.8338C125.654 13.8338 124.666 14.9928 124.666 16.5318ZM138.92 21.7378C136.127 21.7378 134.17 19.7048 134.17 16.7978C134.17 13.8528 136.089 11.8198 138.844 11.8198C141.656 11.8198 143.442 13.7008 143.442 16.6268V17.3298L136.374 17.3488C136.545 19.0018 137.419 19.8378 138.958 19.8378C140.231 19.8378 141.067 19.3438 141.333 18.4508H143.48C143.081 20.5028 141.371 21.7378 138.92 21.7378ZM138.863 13.7198C137.495 13.7198 136.659 14.4608 136.431 15.8668H141.143C141.143 14.5748 140.25 13.7198 138.863 13.7198ZM151.378 12.0668V14.2138H150.523C148.851 14.2138 147.806 15.1068 147.806 16.9308V21.4908H145.488V12.1238H147.673L147.806 13.4918C148.205 12.5608 149.098 11.9338 150.352 11.9338C150.675 11.9338 150.998 11.9718 151.378 12.0668Z" fill="url(#paint1_linear_71_12984)"/>
              <defs>
                <linearGradient id="paint0_linear_71_12984" x1="7.634" y1="26.5961" x2="23.279" y2="12.0942" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#0048FF"/>
                  <stop offset="1" stop-color="#187EFD"/>
                </linearGradient>
                <linearGradient id="paint1_linear_71_12984" x1="18.9844" y1="16.9908" x2="145.484" y2="29.4908" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#0048FF"/>
                  <stop offset="1" stop-color="#187EFD"/>
                </linearGradient>
              </defs>
            </svg>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-600 hover:text-gray-900 transition">Home</Link>
              <Link to="/features" className="text-gray-600 hover:text-gray-900 transition">Features</Link>
              <Link to="/pricing" className="text-gray-600 hover:text-gray-900 transition">Pricing</Link>
              <Link to="/about" className="text-gray-600 hover:text-gray-900 transition">About us</Link>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <a href="#login" className="text-gray-600 hover:text-gray-900 transition">Log in</a>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition font-medium">
              Start Free Trial
            </button>
          </div>
          <button className="md:hidden">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 pt-32 pb-14">
        <div className="bg-white ml-24 mr-24 rounded-2xl p-20  items-center feature-hero">
          <div className="bg-white rounded-2xl p-12">
            <h1 className="feature-hero-h1">
              Complete Property Management for the UAE Market
            </h1>
            <p className="feature-hero-p">
              From Ejari compliance to PDC tracking, every feature is designed to meet local regulatory requirements and operational needs.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-10">
        <div className="bg-white ml-24 mr-24 rounded-2xl p-20  items-center ">
          <div className="grid md:grid-cols-2 gap-20 ">
            <div>
              <h1 className="herosection-h1">
                Complete Property Management for the UAE Market
              </h1>
            </div>
            <div>
              <p className="herosection-p">
                Manage every aspect of your real estate operations with a platform purpose-built for the UAE—covering everything from tenant onboarding to financial reporting and compliance.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                  onMouseEnter={() => handleMouseEnter(feature.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    onClick={() => toggleFeature(feature.id)}
                    className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="feature-grid-h4">{feature.title}</h4>
                      </div>
                    </div>
                    {isOpen(feature.id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {isOpen(feature.id) && (
                      <div className=" grid md:grid-cols-2 gap-20 pl-14 pr-8">
                        <p className="herosection-p">
                          {feature.details}
                        </p>
                        <img src={feature.image} alt="Hero Section" className="w-full h-auto" />
                      </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 px-6">
        <div className="cta ml-24 mr-24 rounded-2xl shadow-xl p-20 items-center">
          <h2 className="cta-h2">Ready to automate your UAE portfolio?</h2>
          <div className="flex flex-col md:flex-row items-center w-full gap-6">
            {/* Left 50% */}
            <div className="w-full md:w-1/2">
              <p className="cta-p">
                Join hundreds of landlords and property managers who are saving time,
                reducing errors, and scaling faster with PropManager.
              </p>
            </div>

            {/* Right 50% */}
            <div className="w-full md:w-1/2 flex justify-end gap-4">
              <button className="cta-button1">
                <span style={{color:"#0048FF"}}>Start your 14-Day Free Trial</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                      d="M6 19L19 6M6.52 6H19V18.48"
                      stroke="url(#paint0_linear_71_13114)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                  />
                  <defs>
                    <linearGradient id="paint0_linear_71_13114">
                      <stop stopColor="#0048FF"/>
                      <stop offset="1" stopColor="#187EFD"/>
                    </linearGradient>
                  </defs>
                </svg>
              </button>

              <button className="border-2 border-white text-white px-8 py-4 rounded-full hover:bg-blue-700 transition font-medium text-lg flex items-center gap-2">
                Contact Us
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                      d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6">
        <div className="bg-gray-900 text-gray-400 ml-24 mr-24 rounded-2xl shadow-xl p-20 items-center">
          <div className="grid md:grid-cols-3 gap-12 mb-12 items-start">
            <div className="flex gap-12">
              <div>
                <h4 className="footer-h4">Company</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="footer-li">Features</a></li>
                  <li><a href="#" className="footer-li">Pricing</a></li>
                  <li><a href="#" className="footer-li">About</a></li>
                </ul>
              </div>
              <div>
                <h4 className="footer-h4">Legal</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="footer-li">Terms of Use</a></li>
                  <li><a href="#" className="footer-li">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
            <div></div>
            <div className="md:ml-auto">
              <h3 className="footer-h3">PropManager</h3>
              <p className="footer-p">
                The all-in-one property management solution designed for the UAE market.
              </p>
            </div>
          </div>
          <div className="footer-bottom pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="hover:text-white transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="#" className="hover:text-white transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>
            <p className="text-sm">&copy; 2024 PropManager. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Features
