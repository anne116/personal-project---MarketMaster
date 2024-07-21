import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Input,
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
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import {
  FaBookmark,
  FaRegBookmark,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
} from "react-icons/fa";
import { useSavedList } from "../index";
import { debounce } from "lodash";
import { v4 as uuidv4 } from "uuid";

const Search = () => {
  const [keyword, setKeyword] = useState("");
  const [products, setProducts] = useState([]);
  const [translatedText, setTranslatedText] = useState(null);
  const [displayLanguage, setDisplayLanguage] = useState("en"); // eslint-disable-line no-unused-vars
  const [error, setError] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [savedProducts, setSavedProducts] = useState([]);
  const wsRef = useRef(null);
  const [notification, setNotification] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const { saveProduct } = useSavedList();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const getSessionId = () => {
    let sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem("sessionId", sessionId);
    }
    return sessionId;
  };

  const startWebSocket = useCallback((sessionId) => {
    const webSocketUrl = `wss://${window.location.host}`;
    const socket = new WebSocket(`${webSocketUrl}/api/ws/${sessionId}`);

    socket.onopen = () => {};
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setNotification(data.message);
      setShowAlert(true);
    };
    socket.onclose = () => {
      setTimeout(() => {
        startWebSocket(sessionId);
      }, 5000);
    };
    socket.onerror = () => {};
    wsRef.current = socket;
  }, []);

  const fetchProducts = async (keyword) => {
    try {
      const sessionId = getSessionId();
      setFetching(true);
      const response = await fetch(
        `/api/fetch_products?keyword=${encodeURIComponent(keyword)}&sessionId=${encodeURIComponent(sessionId)}`,
      );

      if (response.status === 202) {
        return { products: [], new_crawl: true };
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();
        throw new Error(`Unexpected response format: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { products: data, new_crawl: false };
    } catch (err) {
      setError(err.message);
      return { products: [], new_crawl: false };
    } finally {
      setFetching(false);
    }
  };

  const handleSearch = useCallback(
    async (searchKeyword, updateUrl = true) => {
      setError(null);
      setTranslatedText(null);
      setProducts([]);
      setFetching(true);
      setNotification("");
      setShowAlert(false);

      try {
        const validateResponse = await fetch(
          `/api/validate_keyword?keyword=${encodeURIComponent(searchKeyword)}`,
        );
        const validateData = await validateResponse.json();

        if (!validateData.valid) {
          throw new Error(
            "Invalid keyword. Please enter a meaningful search term.",
          );
        }

        const normalizedKeyword = validateData.normalized_keyword;

        const translateResponse = await fetch(
          `/api/translate?text=${encodeURIComponent(normalizedKeyword)}&dest=${displayLanguage}`,
        );
        if (!translateResponse.ok)
          throw new Error("Failed to fetch translation");
        const translateData = await translateResponse.json();
        const englishKeyword = translateData.translated_text;
        setTranslatedText(englishKeyword);

        if (updateUrl) {
          navigate(`?keyword=${encodeURIComponent(searchKeyword)}`);
        }

        const fetchData = await fetchProducts(englishKeyword);
        setProducts(fetchData.products);
        if (fetchData.new_crawl) {
          const sessionId = getSessionId();

          let keywords;
          const keywordsString = localStorage.getItem("keywords");
          if (keywordsString) {
            try {
              keywords = JSON.parse(keywordsString);
            } catch (parseError) {
              keywords = [];
            }
          } else {
            keywords = [];
          }

          keywords.push(searchKeyword);
          localStorage.setItem("keywords", JSON.stringify(keywords));
          startWebSocket(sessionId);
          setNotification(
            "Your input is received! We are currently processing your request. You will be notified via the bell icon in the top right corner once the process is complete.",
          );
          setShowAlert(true);
        }
      } catch (err) {
        setError(err.message);
        toast({
          title: "Error",
          description: err.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setFetching(false);
      }
    },
    [displayLanguage, navigate, toast, startWebSocket],
  );

  const debounceHandleSearch = useCallback(
    debounce((searchKeyword, updateUrl = true) => {
      handleSearch(searchKeyword, updateUrl);
    }, 300),
    [handleSearch],
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryKeyword = params.get("keyword");
    if (queryKeyword) {
      setKeyword(queryKeyword);
      debounceHandleSearch(queryKeyword, false);
    }
    const fetchSavedProducts = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }
      try {
        const response = await fetch("/api/get_savedLists", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            return;
          }
          throw new Error(`: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setSavedProducts(data);
      } catch (err) {
        if (err.message === "You Have Not Saved Anything Yet!") {
          setError(err.message);
        } else {
          setError(err.message);
        }
      }
    };

    fetchSavedProducts();

    const sessionId = getSessionId();
    if (!wsRef.current) {
      startWebSocket(sessionId);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleSearchClick = () => {
    debounceHandleSearch(keyword);
  };

  const handleAnalysisClick = () => {
    navigate("/analysis", { state: { keyword: translatedText } });
  };

  const handleSaveProduct = async (product) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "You must be logged in to save products.",
        position: "top",
        isClosable: true,
        status: "error",
      });
      return;
    }

    const checkTokenResult = await saveProduct(product);

    if (checkTokenResult.success) {
      toast({
        title: checkTokenResult.message,
        isClosable: true,
        position: "top",
        status: "success",
      });
      setSavedProducts((prev) => [...prev, product]);
    } else if (checkTokenResult.message === "Unauthorized") {
      toast({
        title: "Your session has expired. Please log in again.",
        isClosable: true,
        position: "top",
        status: "error",
      });
      navigate("/account");
    } else {
      toast({
        title: checkTokenResult.message,
        isClosable: true,
        position: "top",
        status: "error",
      });
    }
  };

  const isProductSaved = (productId) => {
    return (
      Array.isArray(savedProducts) &&
      savedProducts.some((savedProduct) => savedProduct.id === productId)
    );
  };

  const renderSaveIcon = (product) => {
    const token = localStorage.getItem("token");
    if (!token) {
      return <FaRegBookmark />;
    }
    return isProductSaved(product.id) ? <FaBookmark /> : <FaRegBookmark />;
  };

  const renderStars = (rating) => {
    const ratingValue =
      typeof rating === "string"
        ? parseFloat(rating.match(/(\d+(\.\d+)?)/)[0])
        : rating;
    const fullStars = Math.floor(ratingValue);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = Math.max(0, 5 - fullStars - halfStar);

    return (
      <>
        {[...Array(fullStars)].map((_, index) => (
          <Icon as={FaStar} key={`full-${index}`} color="yellow.400" />
        ))}
        {halfStar && <Icon as={FaStarHalfAlt} color="yellow.400" />}
        {[...Array(emptyStars)].map((_, index) => (
          <Icon as={FaRegStar} key={`empty-${index}`} color="yellow.400" />
        ))}
      </>
    );
  };

  return (
    <Box p={5} bg="gray.50" minH="100vh">
      <Box maxW="1200px" mx="auto">
        <Flex
          direction="column"
          justifyContent="center"
          alignItems="center"
          minH="70vh"
        >
          <Heading as="h3" size="lg" mt={10} mb={10} textAlign="center">
            Start Your Product Search:
          </Heading>

          {showAlert && (
            <Alert status="info" mb={4}>
              <AlertIcon />
              <AlertTitle>Notification</AlertTitle>
              <AlertDescription>{notification}</AlertDescription>
            </Alert>
          )}

          <VStack spacing={4} align="stretch" width="50%">
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter product keyword (e.g. camera, pet toy, mascara...)"
              size="lg"
              borderColor="gray.400"
              _hover={{ borderColor: "gray.600" }}
              focusBorderColor="blue.500"
            />

            {/* <Select
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
            </Select> */}

            <Button onClick={handleSearchClick} colorScheme="blue" size="lg">
              Search
            </Button>
          </VStack>
        </Flex>

        <Box mt={6}>
          <VStack spacing={4} align="stretch" width="100%">
            {translatedText && (
              <Box mt={4} textAlign="center">
                <Heading as="h4" size="md" mb={2}>
                  Searching keyword: {translatedText}
                </Heading>
              </Box>
            )}
            {translatedText && (
              <Flex justifyContent="center" width="100%">
                <Button
                  onClick={handleAnalysisClick}
                  colorScheme="teal"
                  size="lg"
                  mt={4}
                  width="50%"
                >
                  Click to View More Analytic Insights
                </Button>
              </Flex>
            )}

            {fetching && (
              <Box display="flex" justifyContent="center" mt={4}>
                <Spinner mr={2} />
                <Text>Fetching data. Please wait...</Text>
              </Box>
            )}

            {products.length > 0 && (
              <Box mt={4}>
                <Heading as="h3" size="md" mb={4} color="brand.900">
                  Search Results:
                </Heading>
                <SimpleGrid columns={{ sm: 1, md: 2, lg: 3 }} spacing={6}>
                  {products.map((product) => (
                    <Card
                      key={product.id}
                      p={4}
                      boxShadow="md"
                      borderRadius="md"
                    >
                      <Flex direction="column" h="100%">
                        <Flex direction="row" justify="space-between" mb={4}>
                          <Image
                            objectFit="contain"
                            boxSize="130px"
                            src={product.main_Image}
                            alt={product.product_title}
                          />
                          <Heading
                            size="sm"
                            ml={4}
                            alignSelf="center"
                            color="brand.800"
                          >
                            {product.product_title}
                          </Heading>
                          <IconButton
                            aria-label="Save"
                            icon={renderSaveIcon(product)}
                            onClick={() => handleSaveProduct(product)}
                            colorScheme="teal"
                            variant="outline"
                          />
                        </Flex>
                        <Box mt="auto">
                          <Text mt={0} color="brand.500">
                            Price: ${product.price}
                          </Text>
                          <Text mt={0} color="brand.500">
                            Rating: {renderStars(product.rating)}
                          </Text>
                          <Text mt={0} color="brand.500">
                            Reviews: {product.reviews}
                          </Text>
                          <Button
                            as="a"
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            colorScheme="brand.500"
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

            {error && (
              <Text color="red.500" mt={4} textAlign="center">
                {error}
              </Text>
            )}
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

export default Search;
