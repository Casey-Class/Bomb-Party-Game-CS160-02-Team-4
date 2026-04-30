import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();
  const {
    isAuthenticated,
    isGuest,
    isLoading: isAuthLoading,
    login,
    register,
    loginAsGuest,
  } = useAuth();
  const activeTab =
    searchParams.get("mode") === "register" ? "register" : "login";

  const handleTabChange = (nextTab: string) => {
    navigate(`/login?mode=${nextTab}`, { replace: true });
  };

  useEffect(() => {
    if (!isAuthLoading && (isAuthenticated || isGuest)) {
      navigate("/", { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, isGuest, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(loginForm.username, loginForm.password);
      if (success) {
        navigate("/");
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const success = await register(
        registerForm.username,
        registerForm.password
      );
      if (success) {
        navigate("/");
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestPlay = () => {
    loginAsGuest();
    navigate("/");
  };

  return (
    <main className="flex min-h-[calc(100svh-74px)] items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-bold text-2xl">Bomb Party</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            className="w-full"
            onValueChange={handleTabChange}
            value={activeTab}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <Input
                    disabled={isLoading}
                    id="login-username"
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, username: e.target.value })
                    }
                    placeholder="Enter your username"
                    required
                    type="text"
                    value={loginForm.username}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    disabled={isLoading}
                    id="login-password"
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, password: e.target.value })
                    }
                    placeholder="Enter your password"
                    required
                    type="password"
                    value={loginForm.password}
                  />
                </div>
                <Button className="w-full" disabled={isLoading} type="submit">
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form className="space-y-4" onSubmit={handleRegister}>
                <div className="space-y-2">
                  <Label htmlFor="register-username">Username</Label>
                  <Input
                    disabled={isLoading}
                    id="register-username"
                    minLength={3}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        username: e.target.value,
                      })
                    }
                    placeholder="Choose a username"
                    required
                    type="text"
                    value={registerForm.username}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    disabled={isLoading}
                    id="register-password"
                    minLength={6}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        password: e.target.value,
                      })
                    }
                    placeholder="Choose a password"
                    required
                    type="password"
                    value={registerForm.password}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">
                    Confirm Password
                  </Label>
                  <Input
                    disabled={isLoading}
                    id="register-confirm-password"
                    minLength={6}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm your password"
                    required
                    type="password"
                    value={registerForm.confirmPassword}
                  />
                </div>
                <Button className="w-full" disabled={isLoading} type="submit">
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            disabled={isLoading}
            onClick={handleGuestPlay}
            variant="outline"
          >
            Play as Guest
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
