import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Image,
  Card,
  SimpleGrid,
  Flex,
  Spinner,
  useToast,
  IconButton,
} from '@chakra-ui/react';
import { useSavedList } from '../index';
import { FaTrash } from 'react-icons/fa';

const SavedList = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { savedProducts, setSavedProducts, removeProduct } = useSavedList();
  const toast = useToast();
  const navigate = useNavigate();
  const isTokenChecked = useRef(false);

  const handleUnsaveProduct = async (product_id) => {
    try {
      await removeProduct(product_id);
      toast({
        render: () => (
          <Box color='brand.800' p={3} bg='#DFF2E1'>
            <Text fontWeight='bold'>Product unsaved successfully!</Text>
          </Box>
        ),
        status: 'success',
        isClosable: true,
        position: 'top',
      });
    } catch (error) {
      toast({
        title: 'Failed to unsave product. Please try again.',
        status: 'error',
        isClosable: true,
        position: 'top',
      });
    }
  };

  useEffect(() => {
    const fetchSavedProducts = async () => {
      const token = localStorage.getItem('token');
      if (!token && !isTokenChecked.current) {
        isTokenChecked.current = true;
        toast({
          title: 'Please sign in or sign up to view your saved products.',
          status: 'error',
          duration: 5000,
          position: 'top',
          isClosable: true,
        });
        navigate('/account');
        return;
      }
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/get_savedLists`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Please sign up or sign in.');
        const data = await response.json();
        setSavedProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSavedProducts();
  }, [setSavedProducts, toast, navigate]);

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' mt={4}>
        <Spinner mr={2} />
        <Text>Loading saved products...</Text>
      </Box>
    );
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
        <Heading as='h3' size='lg' mb={6} textAlign='center'>
          Saved Products
        </Heading>
        {savedProducts.length > 0 ? (
          <SimpleGrid columns={{ sm: 1, md: 2, lg: 3 }} spacing={6}>
            {savedProducts.map((product) => (
              <Card key={product.id} p={4} boxShadow='md' borderRadius='md'>
                <Flex direction='column' h='100%'>
                  <Flex direction='row' justify='space-between' mb={4}>
                    <Image
                      objectFit='cover'
                      boxSize='100px'
                      src={product.mainImage_url}
                      alt={product.title}
                    />
                    <Heading size='md' ml={4} alignSelf='center'>
                      {product.title}
                    </Heading>
                    <IconButton
                      aria-label='Unsave'
                      icon={<FaTrash />}
                      colorScheme='teal'
                      variant='outline'
                      onClick={() => handleUnsaveProduct(product.id)}
                    />
                  </Flex>
                  <Box mt='auto'>
                    <Text color='brand.600'>Price: ${product.price}</Text>
                    <Text color='brand.600'>Rating: {product.rating}</Text>
                    <Text color='brand.600'>Reviews: {product.reviews}</Text>
                  </Box>
                </Flex>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <Text textAlign='center' mt={10}>
            No products saved.
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default SavedList;
