import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, Spinner, useToast, Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Please sign in or sign up.',
          isClosable: true,
          position: 'top',
          status: 'error',
        });
        navigate('/signin');
        return;
      }
      try {
        const response = await fetch('http://localhost:8000/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch profile');
        const data = await response.json();
        setUserData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate, toast]);

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' mt={4}>
        <Spinner mr={2} />
        <Text>Loading your profile...</Text>
      </Box>
    );
  }

  const handleSignOut = async() => {
    localStorage.removeItem('token');
    navigate('/account');
  }

  if (error) {
    return (
      <Box display='flex' justifyContent='center' mt={4}>
        <Text color='red.500'>{error}</Text>
      </Box>
    );
  }

  return (
    <Box p={5} bg='gray.50' minH='100vh'>
      <Box maxW='1200px' mx='auto'>
        <Heading as='h3' size='lg' mt={20} mb={30} textAlign='center'>
          Profile
        </Heading>
        {userData && (
          <Box>
            <Text fontSize='xl' color='brand.600' textAlign='center'>
              Name: {userData.name}
            </Text>
            <Text fontSize='xl' color='brand.600' textAlign='center'>
              Email: {userData.email}
            </Text>
          </Box>
        )}
        <Box display='flex' justifyContent='center' mt={10}>
          <Button
            colorScheme='brand.300'
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Profile;
