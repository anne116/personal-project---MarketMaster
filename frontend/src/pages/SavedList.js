import React from 'react';
import { Box, Heading, VStack, Text, Image, Card, SimpleGrid, Flex } from '@chakra-ui/react';
import { useSavedList } from '../index';

const SavedList = () => {
  const { savedProducts } = useSavedList();

  return (
    <Box p={5} bg="gray.50" minH="100vh">
      <Box maxW="1200px" mx="auto">
        <Heading as="h3" size="lg" mb={6} textAlign="center">Saved Products</Heading>
        {savedProducts.length > 0 ? (
          <SimpleGrid columns={{ sm: 1, md: 2, lg: 3 }} spacing={6}>
            {savedProducts.map((product, index) => (
              <Card key={index} p={4} boxShadow="md" borderRadius="md">
                <Flex direction="column" h="100%">
                  <Flex direction="row" justify="space-between" mb={4}>
                    <Image
                      objectFit="cover"
                      boxSize="100px"
                      src={product.main_Image}
                      alt={product.product_title}
                    />
                    <Heading size="md" ml={4} alignSelf="center">{product.product_title}</Heading>
                  </Flex>
                  <Box mt="auto">
                    <Text color="brand.600">Price: ${product.price}</Text>
                    <Text color="brand.600">Rating: {product.rating}</Text>
                    <Text color="brand.600">Reviews: {product.reviews}</Text>
                  </Box>
                </Flex>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <Text textAlign="center" mt={10}>No products saved.</Text>
        )}
      </Box>
    </Box>
  );
};

export default SavedList;
