import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, HelpCircle, ChevronDown, BookOpen } from "lucide-react";
import { useState } from "react";

export default function FAQs() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["/api/faqs"],
    retry: false,
    enabled: !!user,
  });

  const filteredFAQs = faqs.filter((faq: any) => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...new Set(faqs.map((faq: any) => faq.category))];

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "technical":
        return "🔧";
      case "account":
        return "👤";
      case "billing":
        return "💳";
      case "general":
        return "ℹ️";
      default:
        return "❓";
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header title="Frequently Asked Questions" />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-6 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="mb-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/30 card-shadow">
              <div className="text-center">
                <div className="h-16 w-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  Frequently Asked Questions
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-lg">
                  Find quick answers to common questions and get help faster
                </p>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="mb-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-4 border border-white/20 dark:border-slate-700/30 card-shadow">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
                    <Input
                      placeholder="Search FAQs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      className="cursor-pointer capitalize"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category !== "all" && getCategoryIcon(category)} {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* FAQs List */}
            <Card className="border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  FAQs ({filteredFAQs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredFAQs.length > 0 ? (
                  <Accordion type="single" collapsible className="space-y-2">
                    {filteredFAQs.map((faq: any, index: number) => (
                      <AccordionItem 
                        key={faq.id || index} 
                        value={`item-${index}`}
                        className="border border-gray-200 dark:border-slate-700 rounded-lg px-4"
                      >
                        <AccordionTrigger className="text-left hover:no-underline">
                          <div className="flex items-start space-x-3">
                            <span className="text-lg">{getCategoryIcon(faq.category)}</span>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {faq.question}
                              </div>
                              <Badge variant="outline" className="mt-1 capitalize">
                                {faq.category}
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                          <div className="text-gray-700 dark:text-slate-300 leading-relaxed pl-8">
                            {faq.answer}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 dark:text-slate-500 mb-4">
                      <Search className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {searchTerm || selectedCategory !== "all" ? "No FAQs match your search" : "No FAQs available"}
                    </h3>
                    <p className="text-gray-600 dark:text-slate-300">
                      {searchTerm || selectedCategory !== "all" 
                        ? "Try adjusting your search terms or category filter"
                        : "FAQs will appear here once they are added by administrators"
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}