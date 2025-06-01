import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LifeBuoy, Zap, Shield, Users } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <LifeBuoy className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">HelpDesk Portal</h1>
            </div>
            <Button onClick={handleLogin} size="lg">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Internal Support Made Simple
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Get instant help with our AI-powered helpdesk system. Submit tickets, chat with HelpBot, 
            and track your requests all in one place.
          </p>
          <Button onClick={handleLogin} size="lg" className="text-lg px-8 py-4">
            Access HelpDesk Portal
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary-600" />
              </div>
              <CardTitle>AI-Powered Routing</CardTitle>
              <CardDescription>
                Smart ticket routing automatically directs your requests to the right team for faster resolution.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>24/7 HelpBot</CardTitle>
              <CardDescription>
                Get instant answers to common questions with our intelligent chatbot trained on company knowledge.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Role-Based Access</CardTitle>
              <CardDescription>
                Secure, role-based interface tailored for employees, support agents, and administrators.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Departments */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            We Support All Departments
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💻</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">IT Department</h4>
              <p className="text-gray-600">Technical support, software issues, network problems, and more.</p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">HR Department</h4>
              <p className="text-gray-600">Employee policies, benefits, leave requests, and HR inquiries.</p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Administration</h4>
              <p className="text-gray-600">Office supplies, facilities, procedures, and general admin tasks.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 HelpDesk Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
