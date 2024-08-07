import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Input,
  FormControl,
  FormLabel,
  VStack,
  Text,
  HStack,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const Account = () => {
  const [activeTab, setActiveTab] = useState("signup");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await fetch("/api/profile", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            navigate("/profile");
          }
        } catch (err) {
          console.error("Token validation failed", err);
        }
      }
    };
    checkToken();
  }, [navigate]);

  useEffect(() => {
    if (message) {
      navigate("/profile");
    }
  }, [message, navigate]);

  const signup = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
        }),
      });
      if (!response.ok) throw new Error("Failed to create account");
      const data = await response.json();
      setMessage("Account created successfully");
      localStorage.setItem("token", data.access_token);
      toast({
        title: "Account created successfully!",
        description: "You have signed up.",
        position: "top",
        status: "success",
        duration: 5000,
        isClosable: true,
        render: () => (
          <Box color="brand.800" p={3} bg="#DFF2E1">
            <Text fontWeight="bold">Account signed up successfully!</Text>
          </Box>
        ),
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const signin = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: signinEmail,
          password: signinPassword,
        }),
      });
      if (!response.ok) throw new Error("Failed to sign in");
      const data = await response.json();
      setMessage("Signed in successfully");
      localStorage.setItem("token", data.access_token);
      toast({
        title: "Signed in successfully!",
        description: "You have signed in.",
        position: "top",
        status: "success",
        duration: 5000,
        isClosable: true,
        render: () => (
          <Box color="brand.800" p={3} bg="#DFF2E1">
            <Text fontWeight="bold">Account signed in succesfully!</Text>
          </Box>
        ),
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const isSignupFormValid = () => {
    return (
      signupName.length > 0 &&
      signupEmail.length > 0 &&
      signupPassword.length > 0
    );
  };

  const isSigninFormValid = () => {
    return signinEmail.length > 0 && signinPassword.length > 0;
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === "signin") {
      setSigninEmail("annchen@gmail.com");
      setSigninPassword("annchen");
    }
  };
  

  return (
    <Box
      p={5}
      maxW="500px"
      mx="auto"
      mt={10}
      bg="gray.50"
      borderRadius="md"
      boxShadow="md"
    >
      <HStack spacing={4} justify="center" mb={6}>
        <Button
          onClick={() => handleTabClick("signup")}
          colorScheme="teal"
          color={activeTab === "signup" ? "white" : "brand.300"}
          variant={activeTab === "signup" ? "solid" : "outline"}
        >
          Sign Up
        </Button>
        <Button
          onClick={() => handleTabClick("signin")}
          colorScheme="teal"
          color={activeTab === "signin" ? "white" : "brand.300"}
          variant={activeTab === "signin" ? "solid" : "outline"}
        >
          Sign In
        </Button>
      </HStack>


      {activeTab === "signup" && (
        <>
          <form onSubmit={signup}>
            <VStack spacing={4}>
              <FormControl id="signupName" isRequired>
                <FormLabel>Username:</FormLabel>
                <Input
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Enter your username"
                  autocomplete="username"
                />
              </FormControl>
              <FormControl id="signupEmail" isRequired>
                <FormLabel>Email:</FormLabel>
                <Input
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </FormControl>
              <FormControl id="signupPassword" isRequired>
                <FormLabel>Password:</FormLabel>
                <Input
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  type="password"
                  placeholder="Enter your password"
                  autocomplete="new-password"
                />
              </FormControl>
              <Button
                type="submit"
                colorScheme="brand"
                color="white"
                width="full"
                isDisabled={!isSignupFormValid()}
              >
                Sign Up
              </Button>
            </VStack>
          </form>
        </>
      )}

      {activeTab === "signin" && (
        <>
          <form onSubmit={signin}>
            <VStack spacing={4}>
              <FormControl id="signinEmail" isRequired>
                <FormLabel>Email:</FormLabel>
                <Input
                  value={signinEmail}
                  onChange={(e) => setSigninEmail(e.target.value)}
                  placeholder="Email"
                  autocomplete="email"
                />
              </FormControl>
              <FormControl id="signinPassword" isRequired>
                <FormLabel>Password:</FormLabel>
                <Input
                  value={signinPassword}
                  onChange={(e) => setSigninPassword(e.target.value)}
                  type="password"
                  placeholder="Password"
                  autocomplete="current-password"
                />
              </FormControl>
              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                isDisabled={!isSigninFormValid()}
              >
                Sign In
              </Button>
            </VStack>
          </form>
        </>
      )}

        {message && <Text color="green.500">{message}</Text>}
        {error && <Text color="red.500">{error}</Text>}
      
    </Box>
  );
};

export default Account;
