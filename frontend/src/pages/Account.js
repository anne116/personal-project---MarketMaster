import React, { useState } from 'react';
import { Box, Button, Input, FormControl, FormLabel, Heading, VStack, Text } from '@chakra-ui/react';

function Account() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const signup = async () => {
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('http://localhost:8000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) throw new Error('Failed to create account');
      const data = await response.json();
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    }
  };

  const login = async () => {
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) throw new Error('Failed to login');
      const data = await response.json();
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    }
  };

  const isFormValid = () => {
    return username.length > 0 && password.length > 0;
  };

  return (
    <Box p={5} maxW="500px" mx="auto" mt={10} bg="gray.50" borderRadius="md" boxShadow="md">
      <Heading as="h2" size="lg" textAlign="center" mb={6}>Account</Heading>
      <VStack spacing={4}>
        <FormControl id="username" isRequired>
          <FormLabel>Username</FormLabel>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />
        </FormControl>
        <FormControl id="password" isRequired>
          <FormLabel>Password</FormLabel>
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Enter your password"
          />
        </FormControl>
        <Button
          colorScheme="teal"
          width="full"
          onClick={signup}
          isDisabled={!isFormValid()}
        >
          Sign Up
        </Button>
        <Button
          colorScheme="blue"
          width="full"
          onClick={login}
          isDisabled={!isFormValid()}
        >
          Log In
        </Button>
        {message && <Text color="green.500">{message}</Text>}
        {error && <Text color="red.500">{error}</Text>}
      </VStack>
    </Box>
  );
}

export default Account;
