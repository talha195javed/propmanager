import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Mail, Lock, User, Phone, ArrowRight, Check, MapPin, Building as BuildingIcon } from 'lucide-react'
import { useAuth } from './AuthContext'

function Signup() {
  const { login } = useAuth()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    businessName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+971',
    address: '',
    city: '',
    emirate: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    role: 'landlord'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value
    })
  }

  const handleNext = () => {
    if (step === 1) {
      if (!formData.businessName || !formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        setError('Please fill in all required fields')
        return
      }
    }
    if (step === 2) {
      if (!formData.address || !formData.city || !formData.emirate) {
        setError('Please fill in all address fields')
        return
      }
    }
    if (step === 3) {
      if (!formData.password || !formData.confirmPassword) {
        setError('Please fill in all password fields')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
      if (!formData.acceptTerms) {
        setError('Please accept the terms and conditions')
        return
      }
    }
    setError('')
    setStep(step + 1)
  }

  const handleBack = () => {
    setError('')
    setStep(step - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    setLoading(true)

    try {
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessName: formData.businessName,
          firstName: formData.firstName,
          lastName: formData.lastName,
          fullName: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: `${formData.countryCode} ${formData.phone}`,
          address: formData.address,
          city: formData.city,
          emirate: formData.emirate,
          password: formData.password,
          role: formData.role
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      // Store token + user in auth context (also persists to localStorage)
      login(data.token, data.user)

      // Redirect to dashboard
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <svg width="152" height="29" viewBox="0 0 152 29" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        </div>

        {/* Signup Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create account</h1>
          <p className="text-gray-600 mb-8">Start managing your properties today</p>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step >= stepNum 
                    ? 'border-blue-600 bg-blue-600 text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {step > stepNum ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="font-medium">{stepNum}</span>
                  )}
                </div>
                {stepNum < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNum ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Labels */}
          <div className="flex justify-center mb-8 text-sm">
            <div className={`w-24 text-center ${step === 1 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>Basic Details</div>
            <div className={`w-24 text-center ${step === 2 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>Address</div>
            <div className={`w-24 text-center ${step === 3 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>Security</div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            {/* Step 1: Basic Details */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                  <div className="relative">
                    <BuildingIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Your Business Name"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="John"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="flex gap-2">
                    <select
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleChange}
                      className="w-32 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="+971">+971 (UAE)</option>
                      <option value="+1">+1 (USA)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+91">+91 (India)</option>
                      <option value="+966">+966 (KSA)</option>
                      <option value="+974">+974 (Qatar)</option>
                      <option value="+965">+965 (Kuwait)</option>
                      <option value="+973">+973 (Bahrain)</option>
                      <option value="+968">+968 (Oman)</option>
                      <option value="+20">+20 (Egypt)</option>
                    </select>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="XX XXX XXXX"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Address */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Street Address"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Dubai"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Emirate</label>
                    <select
                      name="emirate"
                      value={formData.emirate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    >
                      <option value="">Select Emirate</option>
                      <option value="Abu Dhabi">Abu Dhabi</option>
                      <option value="Dubai">Dubai</option>
                      <option value="Sharjah">Sharjah</option>
                      <option value="Ajman">Ajman</option>
                      <option value="Umm Al Quwain">Umm Al Quwain</option>
                      <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                      <option value="Fujairah">Fujairah</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Security */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <label className="text-sm text-gray-600">
                    I accept the <Link to="/terms" className="text-blue-600 hover:text-blue-700">Terms and Conditions</Link> and <Link to="/privacy" className="text-blue-600 hover:text-blue-700">Privacy Policy</Link>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  step === 1 ? 'ml-auto' : ''
                }`}
              >
                {loading ? 'Creating account...' : (
                  <>
                    {step === 3 ? 'Create account' : 'Next'}
                    {step < 3 && <ArrowRight className="w-5 h-5" />}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          <Link to="/" className="hover:text-gray-700">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}

export default Signup
