import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";

const departmentLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  department: z.string().min(1),
});

type DepartmentLoginForm = z.infer<typeof departmentLoginSchema>;

const departments = [
  { value: "IT", label: "IT Department" },
  { value: "HR", label: "HR Department" },
  { value: "Admin", label: "Admin Department" },
  { value: "Finance", label: "Finance Department" },
  { value: "Facilities", label: "Facilities Department" },
];

export default function AuthDepartmentLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<DepartmentLoginForm>({
    resolver: zodResolver(departmentLoginSchema),
    defaultValues: {
      email: "",
      password: "",
      department: "",
    },
  });

  const onSubmit = async (data: DepartmentLoginForm) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/auth/login-department", data);
      const result = await response.json();
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // Force a page refresh to ensure authentication state is properly loaded
      window.location.href = result.redirectTo;
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Department Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your department dashboard
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Department Staff Sign In</CardTitle>
            <CardDescription>
              Select your department and enter your credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="your.email@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.value} value={dept.value}>
                              {dept.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Regular employee?{" "}
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-500">
                  Use Employee Portal
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}