import { useState, useEffect } from 'react'
import { Building2, Users, DollarSign, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react'

function Dashboard() {
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalTenants: 0,
    totalRevenue: 0,
    pendingPayments: 0
  })

  useEffect(() => {
    // Fetch dashboard stats from API
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:5001/api/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: 'Total Properties',
      value: stats.totalProperties,
      icon: Building2,
      color: 'blue',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Total Tenants',
      value: stats.totalTenants,
      icon: Users,
      color: 'green',
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Total Revenue',
      value: `AED ${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'purple',
      change: '+15%',
      trend: 'up'
    },
    {
      title: 'Pending Payments',
      value: stats.pendingPayments,
      icon: DollarSign,
      color: 'orange',
      change: '-5%',
      trend: 'down'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Properties</h2>
          <div className="space-y-4">
            {[
              { name: 'Dubai Marina Apartment', status: 'occupied', rent: 'AED 8,500' },
              { name: 'Downtown Villa', status: 'vacant', rent: 'AED 25,000' },
              { name: 'JBR Studio', status: 'occupied', rent: 'AED 6,000' }
            ].map((property, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{property.name}</p>
                  <p className="text-sm text-gray-500">{property.rent}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  property.status === 'occupied' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {property.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h2>
          <div className="space-y-4">
            {[
              { tenant: 'Ahmed Ali', amount: 'AED 8,500', status: 'paid', date: '2024-01-15' },
              { tenant: 'Sarah Hassan', amount: 'AED 6,000', status: 'pending', date: '2024-01-20' },
              { tenant: 'Omar Khan', amount: 'AED 25,000', status: 'paid', date: '2024-01-10' }
            ].map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{payment.tenant}</p>
                  <p className="text-sm text-gray-500">{payment.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{payment.amount}</p>
                  <span className={`text-xs font-medium ${
                    payment.status === 'paid' 
                      ? 'text-green-600' 
                      : 'text-orange-600'
                  }`}>
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h2>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-2" />
            <p>Revenue chart will be displayed here</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
