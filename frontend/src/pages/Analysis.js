import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';

const Analysis = () => {
  const location = useLocation();
  const { keyword } = location.state || {};
  const [suggestedTitle, setSuggestedTitle] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (keyword) {
      fetchStatistics();
      fetchSuggestedTitle();
    }
  }, [keyword]);

  const fetchStatistics = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/fetch_statistics?keyword=${encodeURIComponent(keyword)}`,
      );
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    }
  };

    const fetchSuggestedTitle = async() => {
      try {
          const titleResponse = await fetch(`${process.env.REACT_APP_API_URL}/suggested_title?keyword=${encodeURIComponent(keyword)}`)
          if (!titleResponse.ok) throw new Error('Failed to fetch suggested title')
          const suggested_title = await titleResponse.json();
          setSuggestedTitle(suggested_title)
      } catch(err) {
          setError(err.message)
      }
  }
  return (
    <Box p={5} bg={useColorModeValue('gray.50', 'gray.800')} minH='100vh'>
      <Box maxW='1200px' mx='auto'>
        <Heading as='h1' size='xl' mb={6} textAlign='center' color='brand.800'>
          Product Analysis for {keyword}
        </Heading>
        {error && (
          <Text color='red.500' mb={4}>
            {error}
          </Text>
        )}
        {stats ? (
          <VStack spacing={4} align='stretch'>
            <Box p={4} bg='white' boxShadow='md' borderRadius='md'>
              <Heading as='h2' size='lg' mb={4} color='brand.500'>
                Statistics
              </Heading>
              <Text fontSize='lg'>
                Estimated Seller Count: {stats.seller_count}
              </Text>
              <Text mt={3} fontSize='lg'>
                Price Range: ${stats.price_range[0]} - ${stats.price_range[1]}
              </Text>
              <Text mt={3} fontSize='lg'>
                Average Price: ${stats.average_price.toFixed(2)}
              </Text>
              <Text mt={3} fontSize='lg'>
                Average Rating: {stats.average_rating.toFixed(2)}
              </Text>
              <Text mt={3} fontSize='lg'>
                Average Review: {stats.average_reviews.toFixed(0)}
              </Text>
            </Box>
            <Divider />
            <Box p={4} bg='white' boxShadow='md' borderRadius='md'>
              <Heading as='h2' size='lg' mb={4} color='brand.500'>
                Suggested Product Title
              </Heading>
        {suggestedTitle && ( 
            <div>
                  <p>{ suggestedTitle }</p>
              </div>
        )}
            </Box>
          </VStack>
        ) : (
          <Box display='flex' justifyContent='center' mt={4}>
            <Spinner size='xl' />
            <Text ml={2}>Loading...</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Analysis;
