import React from 'react';
import { Box, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <Box p={5} bg="gray.50" minH="100vh">
      <Box maxW="1200px" mx="auto" textAlign="center">
        <Heading as="h1" size="2xl" mb={6} color="brand.900">
          Welcome to MarketMaster!
        </Heading>
        <Text fontSize="lg" mb={6} color="brand.700">
          Keep track of your favorite products and find the best deals!
        </Text>
        <VStack spacing={4}>
          <Button as={Link} to="/search" colorScheme="teal.300" size="lg" width="full">
            Search Products
          </Button>
          <Button as={Link} to="/saved" colorScheme="blue" size="lg" width="full">
            View Saved List
          </Button>
        </VStack>
      </Box>
    </Box>
  );
};

export default Home;
