import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Input,
  Select,
  Spinner,
  Text,
  Heading,
  VStack,
  Image,
  Card,
  SimpleGrid,
  Flex,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { FaBookmark, FaRegBookmark } from 'react-icons/fa';
import { useSavedList } from '../index';

const Search = () => {
  const [keyword, setKeyword] = useState('');
  const [products, setProducts] = useState([]);
  const [translatedText, setTranslatedText] = useState(null);
  const [displayLanguage, setDisplayLanguage] = useState('en');
  const [error, setError] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [savedProducts, setSavedProducts] = useState([]);

  const { saveProduct } = useSavedList();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const fetchProducts = async (keyword) => {
    try {
      setFetching(true);
      const response = await fetch(
        `http://localhost:8000/fetch_products?keyword=${encodeURIComponent(keyword)}`,
      );
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  };

  const handleSearch = useCallback(async (searchKeyword, updateUrl = true) => {
    setError(null);
    setTranslatedText(null);
    setProducts([]);
    setFetching(true);

    try {
      const translateResponse = await fetch(
        `http://localhost:8000/translate?text=${encodeURIComponent(searchKeyword)}&dest=${displayLanguage}`,
      );
      if (!translateResponse.ok) throw new Error('Failed to fetch translation');
      const translateData = await translateResponse.json();
      const englishKeyword = translateData.translated_text;
      setTranslatedText(englishKeyword);

      await fetchProducts(englishKeyword);
      const response = await fetch(
        `http://localhost:8000/fetch_products?keyword=${encodeURIComponent(englishKeyword)}`,
      );
      const data = await response.json();
      setProducts(data);
      if (updateUrl) {
        navigate(`?keyword=${encodeURIComponent(searchKeyword)}`);
      }
    } catch (err) {
      setError(err.message);
      setFetching(false);
    }
  }, [displayLanguage, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryKeyword = params.get('keyword');
    if (queryKeyword) {
      setKeyword(queryKeyword);
      handleSearch(queryKeyword, false);
    }

    const fetchSavedProducts = async() => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('http://localhost:8000/get_savedLists', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setSavedProducts(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchSavedProducts();
  }, [location.search, handleSearch]);

  const handleSearchClick = () => {
    handleSearch(keyword);
  };

  const handleAnalysisClick = () => {
    navigate('/analysis', { state: { keyword: translatedText } });
  };

  const handleSaveProduct = async (product) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: 'You must be logged in to save products.',
        position: 'top',
        isClosable: true,
        status: 'error',
      });
      return;
    }

    const checkTokenResult = await saveProduct(product);

    if (checkTokenResult.success) {
      toast({
        title: checkTokenResult.message,
        isClosable: true,
        position: 'top',
        status: 'success',
      });
      setSavedProducts((prev) => [...prev, product]);
    } else if (checkTokenResult.message === 'Unauthorized') {
      toast({
        title: 'Your session has expired. Please log in again.',
        isClosable: true,
        position: 'top',
        status: 'error',
      });
      navigate('/account');
    } else {
      toast({
        title: checkTokenResult.message,
        isClosable: true,
        position: 'top',
        status: 'error',
      });
    }
  };

  const isProductSaved = (productId) => {
    return savedProducts.some((savedProduct) => savedProduct.id === productId);
  };

  const renderSaveIcon = (product) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return <FaRegBookmark />;
    }
    return isProductSaved(product.id) ? <FaBookmark /> : <FaRegBookmark />;
;  }

  return (
    <Box p={5} bg='gray.50' minH='100vh'>
      <Box maxW='1200px' mx='auto'>
        <Heading as='h3' size='lg' mb={6} textAlign='center'>
          Product Search
        </Heading>
        <VStack spacing={4} align='stretch'>
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder='Enter product keyword'
            size='lg'
            borderColor='gray.400'
            _hover={{ borderColor: 'gray.600' }}
            focusBorderColor='blue.500'
          />

          <Select
            value={displayLanguage}
            onChange={(e) => setDisplayLanguage(e.target.value)}
            size='lg'
            borderColor='gray.400'
            _hover={{ borderColor: 'gray.600' }}
            focusBorderColor='blue.500'
          >
            <option value='en'>English</option>
            <option value='es'>Spanish</option>
            <option value='fr'>French</option>
            <option value='de'>German</option>
            <option value='zh-CN'>Chinese</option>
            <option value='ja'>Japanese</option>
          </Select>

          <Button
            onClick={handleSearchClick}
            colorScheme='blue'
            size='lg'
            width='full'
          >
            Search
          </Button>

          {translatedText && (
            <Box mt={4} textAlign='center'>
              <Heading as='h4' size='md' mb={2}>
                Translated Text
              </Heading>
              <Text fontSize='lg' color='gray.700'>
                {translatedText}
              </Text>
            </Box>
          )}

          <Button as={Link} to='/saved' colorScheme='blue' size='lg'>
            View Your Saved List
          </Button>

          {fetching && (
            <Box display='flex' justifyContent='center' mt={4}>
              <Spinner mr={2} />
              <Text>Fetching data. Please wait...</Text>
            </Box>
          )}

          {products.length > 0 && (
            <Box mt={4}>
              <Heading as='h3' size='md' mb={4} color='brand.900'>
                Search Results:
              </Heading>
              <SimpleGrid columns={{ sm: 1, md: 2, lg: 3 }} spacing={6}>
                {products.map((product) => (
                  <Card
                    key={product.product_title}
                    p={4}
                    boxShadow='md'
                    borderRadius='md'
                  >
                    <Flex direction='column' h='100%'>
                      <Flex direction='row' justify='space-between' mb={4}>
                        <Image
                          objectFit='contain'
                          boxSize='130px'
                          src={product.main_Image}
                          alt={product.product_title}
                        />
                        <Heading
                          size='sm'
                          ml={4}
                          alignSelf='center'
                          color='brand.800'
                        >
                          {product.product_title}
                        </Heading>
                        <IconButton
                          aria-label='Save'
                          icon={renderSaveIcon(product)}
                          onClick={() => handleSaveProduct(product)}
                          colorScheme='teal'
                          variant='outline'
                        />
                      </Flex>
                      <Box mt='auto'>
                        <Text mt={0} color='brand.500'>
                          Price: ${product.price}
                        </Text>
                        <Text mt={0} color='brand.500'>
                          Rating: {product.rating}
                        </Text>
                        <Text mt={0} color='brand.500'>
                          Reviews: {product.reviews}
                        </Text>
                        <Button
                          as='a'
                          href={product.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          colorScheme='brand.500'
                          mt={3}
                        >
                          View Product
                        </Button>
                      </Box>
                    </Flex>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>
          )}

          {translatedText && (
            <Button
              onClick={handleAnalysisClick}
              colorScheme='teal'
              size='lg'
              mt={4}
              width='full'
            >
              More Analytic Insights
            </Button>
          )}

          {error && (
            <Text color='red.500' mt={4} textAlign='center'>
              {error}
            </Text>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default Search;
